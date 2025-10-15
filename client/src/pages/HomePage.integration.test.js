import React from "react";
import {
    render,
    fireEvent,
    waitFor,
    screen,
    within,
    waitForElementToBeRemoved,
} from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
    resetDatabase,
    seedCategories,
    seedProducts,
} from "../../tests/helpers/seedApi";
import { AuthProvider } from "../context/auth";
import { SearchProvider } from "../context/search";
import { CartProvider } from "../context/cart";
import HomePage from "./HomePage";
import CartPage from "./CartPage";
import ProductDetails from "./ProductDetails";
import { Prices } from "../components/Prices";
import {
    BOOKS,
    ELECTRONICS,
    CLOTHING,
    LAPTOP,
    TABLET,
    STUDY_GUIDE,
    SINGAPORE_CONTRACT_LAW,
    CAMPUS_HOODIE,
} from "../../tests/helpers/testData";

console.log = jest.fn();

beforeEach(async () => {
    await resetDatabase();

    const PRODUCTS = [
        LAPTOP,
        TABLET,
        STUDY_GUIDE,
        SINGAPORE_CONTRACT_LAW,
        CAMPUS_HOODIE,
    ];
    const CATEGORIES = [ELECTRONICS, BOOKS, CLOTHING];
    await seedCategories(CATEGORIES);
    await seedProducts(PRODUCTS);
});

afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
    console.log.mockClear();
});

describe("HomePage Component", () => {
    const renderHomePage = () =>
        render(
            <AuthProvider>
                <SearchProvider>
                    <CartProvider>
                        <MemoryRouter initialEntries={["/"]}>
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <>
                                            <Toaster />
                                            <HomePage />
                                        </>
                                    }
                                />
                                <Route path="/product/:slug" element={<ProductDetails />} />
                                <Route path="/cart" element={<CartPage />} />
                            </Routes>
                        </MemoryRouter>
                    </CartProvider>
                </SearchProvider>
            </AuthProvider>
        );

    it("Renders Categories and Products from Backend, Renders Prices", async () => {
        renderHomePage();

        expect(await screen.findByAltText("bannerimage")).toHaveAttribute("src", "/images/Virtual.png");
        expect(await screen.findByText("All Products")).toBeInTheDocument();

        expect(screen.getByText("Filter By Category")).toBeInTheDocument();
        expect(await screen.findByRole("checkbox", { name: "Electronics" })).toBeInTheDocument();
        expect(await screen.findByRole("checkbox", { name: "Books" })).toBeInTheDocument();
        expect(await screen.findByRole("checkbox", { name: "Clothing" })).toBeInTheDocument();

        expect(screen.getByText("Filter By Price")).toBeInTheDocument();
        Prices.forEach((p) => {
            expect(screen.getByText(p.name)).toBeInTheDocument();
        });

        const productHeadings = await screen.findAllByRole("heading", {
            name: /Laptop|Tablet|Study Guide|Singapore Contract Law|Campus Hoodie/i,
        });
        expect(productHeadings.length).toBeGreaterThan(0);
    });

    it("Filters by category and Shows only matching products", async () => {
        renderHomePage();

        await screen.findAllByRole("heading", {
            name: /Laptop|Tablet|Study Guide|Singapore Contract Law|Campus Hoodie/i,
        });

        const books = await screen.findByRole("checkbox", { name: "Books" });
        fireEvent.click(books);

        expect(await screen.findByRole("heading", { name: "Study Guide" })).toBeInTheDocument();
        expect(await screen.findByRole("heading", { name: "Singapore Contract Law" })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole("heading", { name: "Laptop" })).not.toBeInTheDocument();
            expect(screen.queryByRole("heading", { name: "Tablet" })).not.toBeInTheDocument();
            expect(screen.queryByRole("heading", { name: "Campus Hoodie" })).not.toBeInTheDocument();
        });
    });

    it("Filters by price and Shows only matching products", async () => {
        renderHomePage();

        await screen.findAllByRole("heading", {
            name: /Laptop|Tablet|Study Guide|Singapore Contract Law|Campus Hoodie/i,
        });

        const priceRadio = screen.getByLabelText("$60 to 79.99");
        fireEvent.click(priceRadio);

        expect(await screen.findByRole("heading", { name: "Singapore Contract Law" })).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.queryByRole("heading", { name: "Study Guide" })).not.toBeInTheDocument();
            expect(screen.queryByRole("heading", { name: "Campus Hoodie" })).not.toBeInTheDocument();
            expect(screen.queryByRole("heading", { name: "Laptop" })).not.toBeInTheDocument();
            expect(screen.queryByRole("heading", { name: "Tablet" })).not.toBeInTheDocument();
        });
    });

    it("Combines category and price to show only matching products", async () => {
        renderHomePage();

        await screen.findAllByRole("heading", {
            name: /Laptop|Tablet|Study Guide|Singapore Contract Law|Campus Hoodie/i,
        });

        fireEvent.click(await screen.findByRole("checkbox", { name: "Books" }));
        await screen.findByRole("heading", { name: "Study Guide" });
        await screen.findByRole("heading", { name: "Singapore Contract Law" });

        fireEvent.click(screen.getByLabelText("$60 to 79.99"));

        await waitForElementToBeRemoved(() =>
            screen.getByRole("heading", { name: "Study Guide" })
        );

        expect(await screen.findByRole("heading", { name: "Singapore Contract Law" })).toBeInTheDocument();

        ["Laptop", "Tablet", "Campus Hoodie", "Study Guide"].forEach((n) => {
            expect(screen.queryByRole("heading", { name: n })).not.toBeInTheDocument();
        });
    });

    it("Displays all products, Add one to cart, Go to Cart via Header and See the product", async () => {
        renderHomePage();

        await screen.findByRole("heading", { name: "Laptop" });

        const hoodieHeading = await screen.findByRole("heading", { name: "Campus Hoodie" });
        const hoodieCard = hoodieHeading.closest(".card");
        expect(hoodieCard).toBeTruthy();

        const addBtn = within(hoodieCard).getByRole("button", { name: "ADD TO CART" });
        fireEvent.click(addBtn);

        const badge = await screen.findByTestId("badge");
        await waitFor(() => expect(badge).toHaveTextContent("1"));

        const cartLink = screen.getByRole("link", { name: /Cart/i });
        fireEvent.click(cartLink);

        expect(await screen.findByText("Cart Summary")).toBeInTheDocument();
        expect(screen.getByText("Campus Hoodie")).toBeInTheDocument();
    });

    it('Displays all products, Clicks "More Details" on one and Navigates to product page', async () => {
        renderHomePage();

        const laptopHeading = await screen.findByRole("heading", { name: "Laptop" });
        const laptopCard = laptopHeading.closest(".card");
        expect(laptopCard).toBeTruthy();

        const moreBtn = within(laptopCard).getByRole("button", { name: /More Details/i });
        fireEvent.click(moreBtn);

        expect(await screen.findByTestId("product-details")).toBeInTheDocument();
        expect(await screen.findByText(/Name\s*:\s*Laptop/i)).toBeInTheDocument();
    });
});