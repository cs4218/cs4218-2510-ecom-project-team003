import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AdminOrders from "./AdminOrders";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";

// optional helpers if needed for seeding mock API data
import { seedOrders, resetDatabase, seedCategories, seedProducts } from "../../../tests/helpers/seedApi";
import { ELECTRONICS, LAPTOP, SMARTPHONE, TABLET, USER, ADMIN, ORDER_TWO_ITEMS } from "../../../tests/helpers/testData";

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
        await resetDatabase();
        const fakeAuth = {
            user: { _id: "user1", role: "admin", name: "Admin User" },
            token: "fake-jwt-token",
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));

        await seedCategories([ELECTRONICS]);
        await seedProducts([LAPTOP, SMARTPHONE, TABLET]);
        await seedOrders([ORDER_TWO_ITEMS]);
    });

    afterEach(() => {
        localStorage.clear();
    })


    it ("Does not render orders for non-admin user", async () => {
        // override localStorage to have a non-admin user
        const fakeAuth = {
            user: { _id: "user2", role: "user", name: "Regular User" },
            token: "FAKE_JWT_TOKEN",
        };
        localStorage.setItem("auth", JSON.stringify(fakeAuth));

        // security test: typically just check getOrders is not called
        renderAdminOrders();

        // qualitative test: check that no orders are shown
        const orderItems = screen.queryAllByTestId("order-item");
        expect(orderItems.length).toBe(0);
    });

    it ("Renders orders for admin user", async () => {
        // realAuth already set
        renderAdminOrders();

        const orderItems = await screen.findAllByTestId("order-item");
        expect(orderItems.length).toBe(2); // ORDER_TWO_ITEMS has 2 products
    });

    // it ("Renders No orders when none exist", async () => {});
    //
    // it ("Renders Table after fetch", async () => {
    //     // expect tables with cards
    // });
    //
    // it ("Shows failure toast on fetch failure", async () => {});
    //
    // it ("Renders Initial order status", async () => {});
    //
    // it ("Renders buyer name", async () => {});
    //
    // it ("Renders order date", async () => {});
    //
    // it ("Renders payment status", async () => {});
    //
    // it ("Renders product quantity", async () => {});
    //
    // it ("A product card has product name", async () => {});
    //
    // it ("A product card has description", async () => {});
    //
    // it ("A product card has price", async () => {});
    //
    // it ("Changing order status updates order", async () => {
    // });
    //
    // it ("Shows failure toast on order status update failure", async () => {});
});