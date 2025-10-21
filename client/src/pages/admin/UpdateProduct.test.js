import axios from "axios";
import React from "react";
import UpdateProduct from "./UpdateProduct";
import {MemoryRouter} from "react-router-dom";
import {act, render, screen, within} from "@testing-library/react";
import { LAPTOP, TABLET, STUDY_GUIDE, ELECTRONICS, BOOKS, USER, ADMIN } from "../../../tests/helpers/testData";

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

const renderUpdateProduct = (product) => {
    render(
        <MemoryRouter>
            <UpdateProduct/>
        </MemoryRouter>
    )
}

describe("Update Product Unit Tests", () => {
    it("populates fields when fetching product", async () => {
        axios.get.mockImplementation((url) => {
            if (url.startsWith("/api/v1/product/get-product")) {
                return Promise.resolve({
                    data: { success: true, message: "Single product fetched", product: LAPTOP },
                });
            }
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, message: "All Categories List", category: [ELECTRONICS] },
                });
            }
            return Promise.reject(new Error("Unexpected GET URL: " + url));
        });


        await act(async () => {
            renderUpdateProduct();
        })

        const nameField = await screen.getByPlaceholderText("write a name");
        const descriptionField = await screen.findByPlaceholderText("write a description");
        const priceField = await screen.findByPlaceholderText("write a Price");
        const quantityField = await screen.findByPlaceholderText("write a quantity");

        expect(nameField).toHaveValue(LAPTOP.name);
        expect(descriptionField).toHaveValue(LAPTOP.description);
        expect(priceField).toHaveValue(LAPTOP.price);
        expect(quantityField).toHaveValue(LAPTOP.quantity);
    })
})

