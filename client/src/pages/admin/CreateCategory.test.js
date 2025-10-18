import React from "react";
import { render, screen, within, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateCategory from "./CreateCategory";
import axios from "axios";

jest.mock("axios");

jest.mock("react-hot-toast");

jest.mock("../../context/auth", () => ({
    useAuth: jest.fn(() => [null, jest.fn()]),
}));

const mockAddToCart = jest.fn();
jest.mock("../../context/cart", () => ({
    useCart: jest.fn(() => ({ addToCart: mockAddToCart })),
}));

jest.mock("../../context/search", () => ({
    useSearch: jest.fn(() => [{ keyword: "" }, jest.fn()]),
}));

jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
}));

window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
    };
};

let logSpy;

const CATEGORIES = [
    { _id: "1", name: "Electronics", slug: "electronics" },
    { _id: "2", name: "Book", slug: "book" },
    { _id: "3", name: "Clothing", slug: "clothing" },
];

const renderCreateCategory = () =>
    render(
        <MemoryRouter>
            <CreateCategory />
        </MemoryRouter>
    );

describe("CreateCategory", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    it("Render all components in Category Page", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: CATEGORIES },
        });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            expect(within(table).getByText("Electronics")).toBeInTheDocument();
            expect(within(table).getByText("Book")).toBeInTheDocument();
            expect(within(table).getByText("Clothing")).toBeInTheDocument();
            const tbody = table.querySelector("tbody");
            const rows = tbody.querySelectorAll("tr");
            expect(rows.length).toBe(3);
        });
    });

    it("Add new category", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: CATEGORIES },
        });

        renderCreateCategory();

        const form = await screen.findByTestId("create-category-form");
        axios.post.mockResolvedValueOnce({ data: { success: true } });

        const afterCreate = [...CATEGORIES, { _id: "4", name: "Furniture", slug: "furniture" }];
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: afterCreate },
        });

        fireEvent.change(within(form).getByPlaceholderText("Enter new category"), {
            target: { value: "Furniture" },
        });
        fireEvent.click(within(form).getByText(/submit/i));

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            expect(within(table).getByText("Furniture")).toBeInTheDocument();
        });
    });

    it("Add new category unsuccessfully (Rejects)", async () => {
        axios.get.mockResolvedValueOnce({
            data: { success: true, category: CATEGORIES },
        });

        renderCreateCategory();

        const form = await screen.findByTestId("create-category-form");
        axios.post.mockRejectedValueOnce({
            response: { data: { message: "Create failed" } },
        });

        fireEvent.change(within(form).getByPlaceholderText("Enter new category"), {
            target: { value: "Error Category" },
        });
        fireEvent.click(within(form).getByText(/submit/i));

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            const tbody = table.querySelector("tbody");
            const rows = tbody.querySelectorAll("tr");
            expect(rows.length).toBe(3);
            expect(within(table).queryByText("Error Category")).not.toBeInTheDocument();
        });
    });

    it("Add new category unsuccessfully (success=false)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const form = await screen.findByTestId("create-category-form");
        axios.post.mockResolvedValueOnce({
            data: { success: false, message: "Duplicate" },
        });

        fireEvent.change(within(form).getByPlaceholderText("Enter new category"), {
            target: { value: "Electronics" },
        });
        fireEvent.click(within(form).getByText(/submit/i));

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            const tbody = table.querySelector("tbody");
            const rows = tbody.querySelectorAll("tr");
            expect(rows.length).toBe(3);
            expect(within(table).queryByText("Electronics")).toBeInTheDocument();
        });
    });

    it("Add new category unsucessfully (Uses fallback error message)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const form = await screen.findByTestId("create-category-form");
        axios.post.mockRejectedValueOnce({ response: { data: {} } });

        fireEvent.change(within(form).getByPlaceholderText("Enter new category"), {
            target: { value: "Error Category" },
        });
        fireEvent.click(within(form).getByText(/submit/i));

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            const tbody = table.querySelector("tbody");
            const rows = tbody.querySelectorAll("tr");
            expect(rows.length).toBe(3);
            expect(within(table).queryByText("Error Category")).not.toBeInTheDocument();
        });
    });

    it("Update category", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const bookCell = await within(table).findByText("Book");
        const targetRow = bookCell.closest("tr");
        fireEvent.click(within(targetRow).getByText(/edit/i));

        axios.put.mockResolvedValueOnce({ data: { success: true } });
        const updatedSet = [
            CATEGORIES[0],
            { _id: "2", name: "Updated Book", slug: "updated-book" },
            CATEGORIES[2],
        ];
        axios.get.mockResolvedValueOnce({ data: { success: true, category: updatedSet } });

        const modal = await screen.findByRole("dialog");
        const input = await within(modal).findByDisplayValue("Book");
        fireEvent.change(input, { target: { value: "Updated Book" } });
        fireEvent.click(within(modal).getByText(/submit/i));

        await waitFor(() => {
            expect(within(table).getByText("Updated Book")).toBeInTheDocument();
            expect(within(table).queryByText("Book")).not.toBeInTheDocument();
        });
    });

    it("Update category unsuccessfully (Rejects with response)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const bookCell = await within(table).findByText("Book");
        const targetRow = bookCell.closest("tr");
        fireEvent.click(within(targetRow).getByText(/edit/i));

        axios.put.mockRejectedValueOnce({
            response: { status: 500, data: { message: "Update failed" } },
        });

        const modal = await screen.findByRole("dialog");
        const input = await within(modal).findByDisplayValue("Book");
        fireEvent.change(input, { target: { value: "Error Category" } });
        fireEvent.click(within(modal).getByText(/submit/i));

        await waitFor(() => {
            expect(within(table).getByText("Book")).toBeInTheDocument();
            expect(within(table).queryByText("Error Category")).not.toBeInTheDocument();
        });
    });

    it("Update category unsuccessfully (success=false)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const bookCell = await within(table).findByText("Book");
        const targetRow = bookCell.closest("tr");
        fireEvent.click(within(targetRow).getByText(/edit/i));

        axios.put.mockResolvedValueOnce({
            data: { success: false, message: "Duplicate name" },
        });

        const modal = await screen.findByRole("dialog");
        const input = await within(modal).findByDisplayValue("Book");
        fireEvent.change(input, { target: { value: "Electronics" } });
        fireEvent.click(within(modal).getByText(/submit/i));

        await waitFor(() => {
            expect(screen.getByRole("dialog")).toBeInTheDocument();
            expect(within(table).getByText("Book")).toBeInTheDocument();
        });
    });

    it("Update category unsuccessfully (Rejects)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const bookCell = await within(table).findByText("Book");
        const targetRow = bookCell.closest("tr");
        fireEvent.click(within(targetRow).getByText(/edit/i));

        axios.put.mockRejectedValueOnce(new Error(""));

        const modal = await screen.findByRole("dialog");
        const input = await within(modal).findByDisplayValue("Book");
        fireEvent.change(input, { target: { value: "Error Category" } });
        fireEvent.click(within(modal).getByText(/submit/i));

        await waitFor(() => {
            expect(within(table).getByText("Book")).toBeInTheDocument();
            expect(within(table).queryByText("Error Category")).not.toBeInTheDocument();
        });
    });

    it("Delete category", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const clothingCell = await within(table).findByText("Clothing");
        const delRow = clothingCell.closest("tr");

        axios.delete.mockResolvedValueOnce({ data: { success: true } });
        const afterDelete = [CATEGORIES[0], CATEGORIES[1]];
        axios.get.mockResolvedValueOnce({ data: { success: true, category: afterDelete } });

        fireEvent.click(within(delRow).getByText(/delete/i));

        await waitFor(() => {
            expect(within(table).queryByText("Clothing")).not.toBeInTheDocument();
        });
    });

    it("Delete category unsuccessfully (Rejects)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const electronicsCell = await within(table).findByText("Electronics");
        const delRow = electronicsCell.closest("tr");

        axios.delete.mockRejectedValueOnce(new Error(""));

        fireEvent.click(within(delRow).getByText(/delete/i));

        await waitFor(() => {
            expect(within(table).getByText("Electronics")).toBeInTheDocument();
        });
    });

    it("Delete category unsuccessfully (success=false)", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const clothingCell = await within(table).findByText("Clothing");
        const delRow = clothingCell.closest("tr");

        axios.delete.mockResolvedValueOnce({ data: { success: false, message: "Cannot delete" } });

        fireEvent.click(within(delRow).getByText(/delete/i));

        await waitFor(() => {
            expect(within(table).getByText("Clothing")).toBeInTheDocument();
        });
    });

    it("Initial fetch with success=false", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: false, message: "No categories" } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            const tbody = table.querySelector("tbody");
            expect(tbody.querySelectorAll("tr").length).toBe(0);
        });
    });

    it("Initial fetch (Rejects)", async () => {
        axios.get.mockRejectedValueOnce(new Error(""));

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        await waitFor(() => {
            const tbody = table.querySelector("tbody");
            expect(tbody.querySelectorAll("tr").length).toBe(0);
        });
    });

    it("Closes update modal", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, category: CATEGORIES } });

        renderCreateCategory();

        const table = await screen.findByTestId("category-table");
        const bookCell = await within(table).findByText("Book");
        const targetRow = bookCell.closest("tr");
        fireEvent.click(within(targetRow).getByText(/edit/i));

        const modal = await screen.findByRole("dialog");
        const closeBtn = modal.parentElement.querySelector('button[aria-label="Close"]');
        fireEvent.click(closeBtn);

        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});