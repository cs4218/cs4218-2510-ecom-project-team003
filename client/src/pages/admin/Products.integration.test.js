import React from "react";
import {act, render, screen, waitFor, within} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Products from "./Products";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";

// optional helpers if needed for seeding mock API data
import { resetDatabase, seedCategories, seedProducts, seedUsers } from "../../../tests/helpers/seedApi";
import { ELECTRONICS, LAPTOP, SMARTPHONE, TABLET, USER, ADMIN, LONG_DESC_PRODUCT } from "../../../tests/helpers/testData";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UpdateProduct from "./UpdateProduct";
import userEvent from "@testing-library/user-event";
dotenv.config({"path": ".env"});

const admin_token = jwt.sign(
    { _id: ADMIN._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const user_token = jwt.sign(
    { _id: USER._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

export const renderProducts = () => {
    return render(
        <AuthProvider>
            <SearchProvider>
                <CartProvider>
                    <MemoryRouter initialEntries={["/dashboard/admin/products"]}>
                        <Toaster />
                        <Routes>
                            <Route path="/dashboard/admin/products" element={<Products />} />
                            <Route path="/dashboard/admin/product/:slug" element={<UpdateProduct />} />
                        </Routes>
                    </MemoryRouter>
                </CartProvider>
            </SearchProvider>
        </AuthProvider>
    );
};

describe("Admin Products Test", () => {
    beforeEach(async () => {
        await resetDatabase();
        const fakeAuth = {
            user: { _id: "user1", role: 1, name: "Admin User" },
            token: admin_token,
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));
    });

    afterEach(() => {
        localStorage.clear();
    });

    // // Security Tests
    it("Does not render anything for non-admin user", async () => {
        // expected failure in console logs, but logs are not relevant to test
        const consoleSpy =
            jest.spyOn(console, "log").mockImplementation(() => {});

        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);

        // override localStorage to have a non-admin user
        const fakeAuth = {
            user: { _id: USER._id, role: 0, name: "Regular User" },
            token: user_token,
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));

        // security test: typically just check getOrders is not called
        renderProducts();

        // qualitative test: check that no orders are shown
        await waitFor(() => {
            expect(screen.queryAllByTestId("product-card")).toHaveLength(0);
        });

        consoleSpy.mockRestore();
    });

    it("Renders a product card when the user is Admin", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);

        renderProducts();
        // fix: queryAll does not wait for elements to appear, findAll is a promise that can be awaited for all elements
        const products = await screen.findAllByTestId("product-card");
        expect(products.length).toBeGreaterThan(0);
    });

    // UI tests (Navigation)
    it("Clicking on a card sends you to the expected resource", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);

        renderProducts();
        // find a selector
        const cards = await screen.findAllByTestId("product-link");
        // click on it
        const focus = cards[0];
        act(() => {userEvent.click(focus)});
        // assert navigation
        const foo = await screen.findAllByText(/update product/i);
        expect(foo.length).toBeGreaterThan(0);
    });

    // Data Integrity tests
    it("Products should have correct name", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP]);
        renderProducts();

        const cards = await screen.findAllByTestId("product-link");
        expect(within(cards[0]).getByText(LAPTOP.name)).toBeInTheDocument();
    });

    it("Products should have description, truncated if necessary", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP]);
        renderProducts();

        const laptop_desc = LAPTOP.description;
        const cards = await screen.findAllByTestId("product-link");
        expect(within(cards[0]).getByText(laptop_desc)).toBeInTheDocument();
    });

    it("object with description > 200 chars should be less than 200 chars with ellipses", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LONG_DESC_PRODUCT]);
        renderProducts();

        const desc = LONG_DESC_PRODUCT.description;
        const cards = await screen.findAllByTestId("product-link");

        const descElement = within(cards[0]).getByText(/\.{3}$/); // matches anything ending with ...
        const renderedText = descElement.textContent;

        expect(renderedText.length).toBeLessThan(desc.length);
        expect(renderedText.endsWith("...")).toBe(true);

    })
})
