import axios from "axios";
import React from "react";
import {act, fireEvent, render, screen, waitFor} from "@testing-library/react";
import CreateProduct from "./CreateProduct";
import { MemoryRouter } from 'react-router-dom';
import toast from "react-hot-toast";

const CATEGORIES = [
    { _id: 1, name: "Electronics"},
    { _id: 2, name: "Books"},
]

const SHIPPING = [
    { _id: 1, shipping: true },
    { _id: 2, shipping: false },
]

jest.mock("axios");
jest.mock("react-hot-toast");
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()])
}));
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));
jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()])
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
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
        await act(async () => {
            renderCreateProduct();
        });

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

    it("Toast Failure expected when fetching categories fails", async () => {
        axios.get.mockRejectedValue(new Error("Network error"));
        await act(async () => {
            renderCreateProduct();
        });
        expect(axios.get).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    })

    it("shipping shows options", async () => {
        axios.get.mockResolvedValue({ data: { success: true, category: SHIPPING } });
        await act(async () => {
            renderCreateProduct();
        });

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
    });

    it("shows success Toast when add product is successful", async () => {
        // axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });
        await act(async () => {
            renderCreateProduct();
        });

        axios.post.mockResolvedValueOnce({
            data: { success: true },
        })
        const submitButton = await screen.getByTestId("create-button")
        fireEvent.click(submitButton);

        expect(axios.post).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith("Product Created Successfully");
        });
    });

    it("Navigates upon successful add product", async () => {
        await act(async () => {
            renderCreateProduct();
        });

        axios.post.mockResolvedValueOnce({
            data: { success: true },
        })
        const submitButton = await screen.getByTestId("create-button")
        fireEvent.click(submitButton);

        expect(axios.post).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalled();
    })

    it("Shows Toast on failure to add product (success != true)", async () => {
        // axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });
        await act(async () => {
            renderCreateProduct();
        });

        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "don't care value" },
        })
        const submitButton = await screen.getByTestId("create-button")
        fireEvent.click(submitButton);

        expect(axios.post).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it("Shows Toast on failure to add product (other Errors)", async () => {
        // axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });
        await act(async () => {
            renderCreateProduct();
        });

        axios.post.mockRejectedValueOnce(new Error("Network error"));
        const submitButton = await screen.getByTestId("create-button")
        fireEvent.click(submitButton);

        expect(axios.post).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        });
    });

})