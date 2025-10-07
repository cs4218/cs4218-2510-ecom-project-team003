import axios from "axios";
import React from "react";
import {MemoryRouter} from "react-router-dom";
import Products from "./Products"
import {act, render, screen} from "@testing-library/react";


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

const PRODUCTS = [
    { _id: 1, name: "Product 1", description: "Description 1", slug: "product-1", photo: "test1" },
    { _id: 2, name: "Product 2", description: "Description 2", slug: "product-2", photo: "test2" },
]

const LONG_DESC_PRODUCT = [
    { _id: 3, name: "Product 3", description: "A".repeat(250), slug: "product-3", photo: "test3" },
]

const renderProducts = () =>
    render(
        <MemoryRouter>
            <Products/>
        </MemoryRouter>
    );

describe("Products Page", () => {
    it("renders", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: PRODUCTS } });
        // we are wrapping in act because of possible async state updates in Header, Auth and Cart contexts
        await act(async () => {
            renderProducts();
        })
        expect(axios.get).toHaveBeenCalled();
    })

    it("shows no products when none are fetched", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: [] } });

        await act(async () => {
            renderProducts();
        })

        // queryAllByTestId returns empty array if nothing found, but findAllByTestId expects at least one match
        const cards = await screen.queryAllByTestId("product-card");
        expect(cards.length).toBe(0);

        expect(axios.get).toHaveBeenCalled();
    });

    it("shows names of products fetched", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: PRODUCTS } });

        await act(async () => {
            renderProducts();
        })

        for (const { name } of PRODUCTS) {
            // getByText doesn't await, so we need to use findByText
            expect(await screen.findByText(name)).toBeInTheDocument();
        }
    });

    // simple equivalence partitioning: descriptions < 200 chars, descriptions >= 200 chars
    it("shows FULL descriptions of products fetched for less than 200 chars", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: PRODUCTS } });
        await act(async () => {
            renderProducts();
        })
        for (const { description } of PRODUCTS) {
            expect(await screen.findByText(description)).toBeInTheDocument();
        }
    });

    it("shows TRUNCATED descriptions of products fetched for more than 200 chars", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: LONG_DESC_PRODUCT } });
        await act(async () => {
            renderProducts();
        })
        for (const { description } of LONG_DESC_PRODUCT) {
            expect(await screen.findByText(`${description.slice(0, 200)}...`)).toBeInTheDocument();
            expect(screen.queryByText(description)).not.toBeInTheDocument();
        }
    });

    it("product links have correct href", async () => {
        axios.get.mockResolvedValue({ data: { success: true, products: PRODUCTS } });
        await act(async () => {
            renderProducts();
        })

        for (const { name, slug } of PRODUCTS) {
            // const link = await screen.findByRole("link", { name }); Doesn't work
            const productName = await screen.findByText(name);
            const link = productName.closest("a");
            expect(link).toHaveAttribute("href", `/dashboard/admin/product/${slug}`);
        }
    });

    it("shows some image when products are fetched", async () => {
        axios.get.mockResolvedValue({ data: { products: PRODUCTS } });

        await act(async () => {
            renderProducts();
        })

        const images = await screen.findAllByRole("img");
        expect(images.length).toBe(PRODUCTS.length);

        expect(axios.get).toHaveBeenCalled();
    });
})