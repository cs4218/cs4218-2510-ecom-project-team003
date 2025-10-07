import axios from "axios";
import React from "react";
import {fireEvent, render, screen} from "@testing-library/react";
import CreateProduct from "./CreateProduct";
import {MemoryRouter} from "react-router-dom";

const CATEGORIES = [
    { _id: 1, name: "Electronics"},
    { _id: 2, name: "Books"},
]

const SHIPPING = [
    { _id: 1, shipping: true },
    { _id: 2, shipping: false },
]

// Mock the fetchCategories function to return a promise that resolves to CATEGORIES
jest.mock("axios");
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

const renderCreateProduct = () =>
    render(
        <MemoryRouter>
            <CreateProduct/>
        </MemoryRouter>
    )

describe("Create Product Page", () => {
    it("dropdown shows categories fetched", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: CATEGORIES } });

        renderCreateProduct();

        const selectRoot = await screen.findByTestId("category-dropdown");
        expect(selectRoot).toBeInTheDocument();

        // ✅ Open the Select properly (AntD binds to mousedown on the selector)
        const selector = selectRoot.querySelector(".ant-select-selector");
        expect(selector).not.toBeNull();
        fireEvent.mouseDown(selector);

        for (const { name } of CATEGORIES) {
            expect(
                screen.getByRole("option", { name })
            ).toBeInTheDocument();
        }

        expect(axios.get).toHaveBeenCalled();
    });

    it("shipping shows options", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: SHIPPING } });
        renderCreateProduct();

        const selectRoot = await screen.findByTestId("shipping-dropdown");
        expect(selectRoot).toBeInTheDocument();

        // ✅ Open the Select properly (AntD binds to mousedown on the selector)
        const selector = selectRoot.querySelector(".ant-select-selector");
        expect(selector).not.toBeNull();
        fireEvent.mouseDown(selector);

        for (const { shipping } of SHIPPING) {
            expect(
                screen.getByRole("option", { name: shipping ? "Yes" : "No" })
            ).toBeInTheDocument();
        }
        expect(axios.get).toHaveBeenCalled();
    })

})