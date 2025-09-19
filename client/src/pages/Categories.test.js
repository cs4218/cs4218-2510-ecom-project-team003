import React from "react";
import {render, screen, within} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import Categories from "./Categories";
import useCategory from "../hooks/useCategory";

jest.mock("../hooks/useCategory");

jest.mock("../components/Layout", () => ({ title, children }) => (
    <div data-testid="layout" data-title={title}>
        <h1 data-testid="title">{title}</h1>
        {children}
    </div>
));

const renderCategories = () =>
    render(
        <MemoryRouter>
            <Categories />
        </MemoryRouter>
    );

const mockCategories = [
    { _id: "1", name: "Category 1", slug: "category1" },
    { _id: "2", name: "Category 2", slug: "category2" },
];

describe("Categories page", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Renders the title", () => {
        useCategory.mockReturnValue([]);

        renderCategories();

        expect(screen.getByTestId("layout")).toHaveAttribute(
            "data-title",
            "All Categories"
        );
    });

    it("Renders the list of categories", () => {
        useCategory.mockReturnValue(mockCategories);

        renderCategories();

        const categories = screen.getByTestId("categories");

        const firstCategory = within(categories).getByText("Category 1");
        expect(firstCategory).toBeInTheDocument();
        expect(firstCategory.closest("a")).toHaveAttribute("href", "/category/category1");

        const secondCategory = within(categories).getByText("Category 2");
        expect(secondCategory).toBeInTheDocument();
        expect(secondCategory.closest("a")).toHaveAttribute("href", "/category/category2");
    });

    it("Renders empty list when there are no categories", () => {
        useCategory.mockReturnValue([]);

        renderCategories();

        expect(screen.queryByRole("link")).toBeNull();
    });
});