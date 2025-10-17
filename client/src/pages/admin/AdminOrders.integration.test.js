import React from "react";
import {render, screen, within} from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminOrders from "./AdminOrders";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";

// optional helpers if needed for seeding mock API data
import { seedOrders, resetDatabase, seedCategories, seedProducts, seedUsers } from "../../../tests/helpers/seedApi";
import { ELECTRONICS, LAPTOP, SMARTPHONE, TABLET, USER, ADMIN, ORDER_TWO_ITEMS_PROCESSING } from "../../../tests/helpers/testData";

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
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

export const renderAdminOrders = () => {
    return render(
        <AuthProvider>
            <SearchProvider>
                <CartProvider>
                    <MemoryRouter initialEntries={["/dashboard/admin/orders"]}>
                        <Toaster />
                        <Routes>
                            <Route path="/dashboard/admin/orders" element={<AdminOrders />} />
                        </Routes>
                    </MemoryRouter>
                </CartProvider>
            </SearchProvider>
        </AuthProvider>
    );
};


describe("Admin Orders API integration and Data fetching",  () => {
    beforeEach(async () => {
        const fakeAuth = {
            user: { _id: "user1", role: 1, name: "Admin User" },
            token: admin_token,
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));
    });

    afterEach(async () => {
        await resetDatabase();
        localStorage.clear();
    })

    // Security tests

    it ("Does not render orders for non-admin user", async () => {
        // expected failure in console logs, but logs are not relevant to test
        const consoleSpy =
            jest.spyOn(console, "log").mockImplementation(() => {});

        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        // override localStorage to have a non-admin user
        const fakeAuth = {
            user: { _id: USER._id, role: 0, name: "Regular User" },
            token: user_token,
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));

        // security test: typically just check getOrders is not called
        renderAdminOrders();

        // qualitative test: check that no orders are shown
        const orderItems = screen.queryAllByTestId("order-item");
        expect(orderItems.length).toBe(0);

        consoleSpy.mockRestore();
    });

    it ("Renders orders for admin user when there are orders", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something
    });

    // UI tests:

    it ("Renders No orders when none exist", async () => {
        // no seeding of orders
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);

        renderAdminOrders();
        const orderItems = screen.queryAllByTestId("order-item");
        expect(orderItems.length).toBe(0);
    });

    // Data Integrity tests:

    it ("Renders Initial order status", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstOrder = orderItems[0];
        expect(await within(firstOrder).findByText(ORDER_TWO_ITEMS_PROCESSING.status)).toBeInTheDocument();
    });

    it ("Renders buyer name", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstOrder = orderItems[0];
        expect(await within(firstOrder).findByText(USER.name)).toBeInTheDocument();
    });

    it ("Renders order date", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstOrder = orderItems[0];
        expect(await within(firstOrder).findByText(/ago/i)).toBeInTheDocument();
    });

    it ("Renders payment status", async () => {
        // note that the order has payment.success = true
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();

        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstOrder = orderItems[0];
        expect(await within(firstOrder).findByText(
            ORDER_TWO_ITEMS_PROCESSING.payment.success ? /success/i : /fail/i
        )).toBeInTheDocument();
    });

    it ("Renders product quantity", async () => {
        // note that the order has 2 products, so quantity = 2
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);
        renderAdminOrders();

        const orderItems = await screen.findAllByTestId("order-table");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstOrder = orderItems[0];
        expect(await within(firstOrder).findByText("2")).toBeInTheDocument();
    });

    it ("A product card has correct product names", async () => {
        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-item");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstProduct = orderItems[0];
        const laptops = await within(firstProduct).findAllByText(LAPTOP.description);
        expect(laptops.length).toBeGreaterThan(0);

        const secondProduct = orderItems[1];
        const smartphones = await within(secondProduct).findAllByText(SMARTPHONE.description);
        expect(smartphones.length).toBeGreaterThan(0);
    });

    it ("A product card has description", async () => {
        const laptop_desc = LAPTOP.description.substring(0, 30);
        const smartphone_desc = SMARTPHONE.description.substring(0, 30);

        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-item");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstProduct = orderItems[0];
        const laptops = await within(firstProduct).findAllByText(laptop_desc);
        expect(laptops.length).toBeGreaterThan(0);

        const secondProduct = orderItems[1];
        const smartphones = await within(secondProduct).findAllByText(smartphone_desc);
        expect(smartphones.length).toBeGreaterThan(0);

    });

    it ("A product card has price", async () => {
        const laptop_price = LAPTOP.price;
        const smartphone_price = SMARTPHONE.price;

        await seedUsers([USER, ADMIN]);
        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE]);
        await seedOrders([ORDER_TWO_ITEMS_PROCESSING]);

        renderAdminOrders();
        const orderItems = await screen.findAllByTestId("order-item");
        expect(orderItems.length).toBeGreaterThan(0); // expect something

        const firstProduct = orderItems[0];
        expect(
            within(firstProduct).getByText((text) =>
                text.includes(String(laptop_price))
            )
        ).toBeInTheDocument();

        const secondProduct = orderItems[1];
        expect(
            within(secondProduct).getByText((text) =>
                text.includes(String(smartphone_price))
            )
        ).toBeInTheDocument();

    });

});