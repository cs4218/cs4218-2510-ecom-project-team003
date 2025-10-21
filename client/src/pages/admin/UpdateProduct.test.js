import axios from "axios";
import React from "react";
import UpdateProduct from "./UpdateProduct";
import {MemoryRouter} from "react-router-dom";
import {act, fireEvent, render, screen, waitFor, within} from "@testing-library/react";
import { LAPTOP, ELECTRONICS } from "../../../tests/helpers/testData";
import toast from "react-hot-toast";

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


const renderUpdateProduct = () => {
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
    });

    it("shows Toast Error when fetching product fails", async () => {
        axios.get.mockRejectedValue(new Error("Network Error"));
        await act(async () => {
            renderUpdateProduct();
        });
        expect(axios.get).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        })
    })

    it("shows Toast Success when updating product is successful", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        axios.put.mockResolvedValue({
            data: {success: true}
        });

        const updateButton = await screen.getByTestId("update-button");
        fireEvent.click(updateButton);

        expect(axios.put).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled();
        })
    });

    it("shows Toast Failure when updating product is unsuccessful", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        axios.put.mockResolvedValue({
            data: {success: false}
        });

        const updateButton = await screen.getByTestId("update-button");
        fireEvent.click(updateButton);

        expect(axios.put).toHaveBeenCalled();
        await waitFor(() => {
            expect(toast.error).toHaveBeenCalled();
        })
    });

    it("Attempts to Navigate on successful update", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        axios.put.mockResolvedValue({
            data: {success: true}
        });

        const updateButton = await screen.getByTestId("update-button");
        fireEvent.click(updateButton);

        expect(axios.put).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
    });

    it("shows Toast success when deleting product is successful", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        window.prompt = jest.fn().mockReturnValue("yes");
        axios.delete.mockResolvedValue({
            data: {success: true}
        });

        const deleteButton = await screen.getByTestId("delete-button");
        fireEvent.click(deleteButton);


        await waitFor(() => {
            expect(window.prompt).toHaveBeenCalled();
            expect(axios.delete).toHaveBeenCalled();
            expect(toast.success).toHaveBeenCalledWith(
                expect.stringMatching(/Product.*Delete.*Success/i)
            );
        });
    });

    it("shows Toast Failure when deleting product is unsuccessful", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        window.prompt = jest.fn().mockReturnValue("yes");
        axios.delete.mockRejectedValueOnce(new Error("Network Error"));

        const deleteButton = await screen.getByTestId("delete-button");
        fireEvent.click(deleteButton);


        await waitFor(() => {
            expect(window.prompt).toHaveBeenCalled();
            expect(axios.delete).toHaveBeenCalled();
            expect(toast.error).toHaveBeenCalled();
        });
    });

    it("attempts to Navigate on successful delete", async () => {
        axios.get.mockResolvedValue({
            data: { success: true, message: "Single product fetched", product: LAPTOP, categories: [ELECTRONICS] },
        });

        await act(async () => {
            renderUpdateProduct();
        });

        window.prompt = jest.fn().mockReturnValue("yes");
        axios.delete.mockResolvedValue({
            data: {success: true}
        });

        const deleteButton = await screen.getByTestId("delete-button");
        fireEvent.click(deleteButton);


        await waitFor(() => {
            expect(window.prompt).toHaveBeenCalled();
            expect(axios.delete).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/admin/products");
        });
    });
})

