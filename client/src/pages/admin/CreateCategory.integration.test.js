import { expect } from "@jest/globals";
import React from "react";
import {
    render,
    fireEvent,
    waitFor,
    screen,
    within,
} from "@testing-library/react";
import axios from "axios";
import bcrypt from "bcrypt";
import CreateCategory from "./CreateCategory";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { AuthProvider } from "../../context/auth";
import { SearchProvider } from "../../context/search";
import { CartProvider } from "../../context/cart";
import {
    resetDatabase,
    seedUsers,
    seedCategories,
} from "../../../tests/helpers/seedApi";
import { Toaster } from "react-hot-toast";
import { ADMIN, ELECTRONICS, BOOKS } from "../../../tests/helpers/testData";

console.log = jest.fn();

beforeEach(async () => {
    const INITIAL_CATEGORIES = [ELECTRONICS, BOOKS]
    await seedCategories(INITIAL_CATEGORIES);

    const hashed = await bcrypt.hash(ADMIN.password, 10);
    await seedUsers([
        { _id: ADMIN.id, ...ADMIN, password: hashed }
    ]);

    const ADMIN_CREDENTIALS = {
        email: ADMIN.email,
        password: ADMIN.password,
    };
    const response = await axios.post("/api/v1/auth/login", ADMIN_CREDENTIALS);
    localStorage.setItem("auth", JSON.stringify(response.data));
    const token = response.data.token;
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
});

afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
    console.log.mockClear();
});

describe("CreateCategory Component", () => {
    const renderCreateCategory = () => {
        render(
            <AuthProvider>
                <SearchProvider>
                    <CartProvider>
                        <MemoryRouter>
                            <Toaster />
                            <CreateCategory />
                        </MemoryRouter>
                    </CartProvider>
                </SearchProvider>
            </AuthProvider>
        );
    };

    it("Renders fetched categories in the categories component", async () => {
        renderCreateCategory();

        const categoryTable = screen.getByTestId("category-table");
        const firstCategory = await within(categoryTable).findByText("Electronics");
        const secondCategory = await within(categoryTable).findByText("Books");

        const tbody = categoryTable.querySelector("tbody");
        const rows = tbody.querySelectorAll("tr");

        expect(firstCategory).toBeInTheDocument();
        expect(secondCategory).toBeInTheDocument();
        expect(rows.length).toBe(2);
    });

    it("Do not add a duplicate category and table remains unchanged", async () => {
        renderCreateCategory();

        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        const categoryTable = await screen.findByTestId("category-table");

        await waitFor(() => {
            const tbody = categoryTable.querySelector("tbody");
            expect(tbody.querySelectorAll("tr").length).toBe(2);
        });

        const createCategoryForm = screen.getByTestId("create-category-form");
        const input = within(createCategoryForm).getByPlaceholderText("Enter new category");
        const submitButton = within(createCategoryForm).getByText("Submit");

        fireEvent.change(input, { target: { value: "Electronics" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            const tbody = categoryTable.querySelector("tbody");
            const rows = tbody.querySelectorAll("tr");
            expect(rows.length).toBe(2);
        });

        await waitFor(() => expect(logSpy).toHaveBeenCalled());
        logSpy.mockRestore();
    });

    it("Creates new category upon submission", async () => {
        renderCreateCategory();

        const createCategoryForm = await screen.getByTestId("create-category-form");
        const input = within(createCategoryForm).getByPlaceholderText("Enter new category");
        const submitButton = within(createCategoryForm).getByText("Submit");

        fireEvent.change(input, { target: { value: "Furniture" } });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText("Furniture")).toBeInTheDocument();
        });
    });

    it("Updates a category successfully", async () => {
        renderCreateCategory();

        const createUpdateCategoryForm = await screen.findByTestId("create-category-form");
        fireEvent.change(within(createUpdateCategoryForm).getByPlaceholderText("Enter new category"), { target: { value: "Furniture" } });
        fireEvent.click(within(createUpdateCategoryForm).getByText("Submit"));
        await screen.findByText("Furniture");

        const categoryTable = await screen.findByTestId("category-table");

        const row = within(categoryTable).getByText("Furniture").closest("tr");
        const editButton = within(row).getByText("Edit");
        fireEvent.click(editButton);

        const modal = await screen.findByRole("dialog");
        const updateInput = await within(modal).findByDisplayValue("Furniture");
        const updateSubmitButton = within(modal).getByText("Submit");

        fireEvent.change(updateInput, { target: { value: "Updated Furniture" } });
        fireEvent.click(updateSubmitButton);

        await waitFor(() => {
            expect(within(categoryTable).getByText("Updated Furniture")).toBeInTheDocument();
        });
    });

    it("Updates a category and handles empty string", async () => {
        renderCreateCategory();

        const categoryTable = await screen.findByTestId("category-table");
        await waitFor(() => {
            expect(within(categoryTable).getByText("Books")).toBeInTheDocument();
        });

        const bookRow = within(categoryTable).getByText("Books").closest("tr");
        const editButton = within(bookRow).getByText("Edit");
        fireEvent.click(editButton);

        const modal = await screen.findByRole("dialog");
        const updateInput = await within(modal).findByDisplayValue("Books");
        const updateSubmitButton = within(modal).getByText("Submit");

        fireEvent.change(updateInput, { target: { value: " " } });
        fireEvent.click(updateSubmitButton);

        await waitFor(() => {
            expect(within(categoryTable).getByText("Books")).toBeInTheDocument();
        });
    });

    it("Updates a category and handles duplicate category name", async () => {
        renderCreateCategory();

        const categoryTable = await screen.findByTestId("category-table");
        await waitFor(() => {
            expect(within(categoryTable).getByText("Books")).toBeInTheDocument();
        });

        const bookRow = within(categoryTable).getByText("Books").closest("tr");
        const editButton = within(bookRow).getByText("Edit");
        fireEvent.click(editButton);

        const modal = await screen.findByRole("dialog");
        const updateInput = await within(modal).findByDisplayValue("Books");
        const updateSubmitButton = within(modal).getByText("Submit");

        fireEvent.change(updateInput, { target: { value: "Electronics" } });
        fireEvent.click(updateSubmitButton);

        await waitFor(() => {
            expect(within(categoryTable).getByText("Books")).toBeInTheDocument();
        });
    });

    it("Deletes a category successfully", async () => {
        renderCreateCategory();

        const createForm2 = await screen.findByTestId("create-category-form");
        fireEvent.change(within(createForm2).getByPlaceholderText("Enter new category"), { target: { value: "Updated Furniture" } });
        fireEvent.click(within(createForm2).getByText("Submit"));
        await screen.findByText("Updated Furniture");

        const categoryTable = await screen.findByTestId("category-table");

        const targetRow = within(categoryTable).getByText("Updated Furniture").closest("tr");
        const deleteButton = within(targetRow).getByText("Delete");
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(within(categoryTable).queryByText("Updated Furniture")).toBeNull();
        });
    });
});