import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";

let mockAuth = { user: { name: 'Test User', role: 0, token: 'test-token' } };
let mockSetAuth = jest.fn();
let mockLogout = jest.fn();
jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [mockAuth, mockSetAuth, mockLogout]),
}));

let mockCart = [{ _id: '1', name: 'Product 1' }];
jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => ({cart: mockCart})),
}));

jest.mock("../context/search", () => ({
    useSearch: jest.fn(() => ["", jest.fn()]),
}));

const mockCategories = [
    { _id: '1', name: 'Category 1', slug: 'category1' },
    { _id: '2', name: 'Category 2', slug: 'category2' },
];
jest.mock('../hooks/useCategory', () => jest.fn(() => mockCategories));

jest.mock('react-hot-toast');

Object.defineProperty(window, "localStorage", {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

window.matchMedia = window.matchMedia || function () {
    return {
        matches: false,
        addListener: function () { },
        removeListener: function () { }
    };
};

describe("Header", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSetAuth.mockReset();
        mockLogout.mockReset();
    });

    const renderHeader = () => {
        render(
            <MemoryRouter>
                <Header/>
            </MemoryRouter>
        );
    };

    it("Renders Header (when user is not login)", () => {
        mockAuth = { user: null, token: "" };
        renderHeader();

        expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /^Categories$/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
        expect(screen.getByRole("link", { name: /Category 1/i })).toHaveAttribute("href", "/category/category1");
        expect(screen.getByRole("link", { name: /Category 2/i })).toHaveAttribute("href", "/category/category2");

        expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();
    });

    it("Redirect link back to Home Page", () => {
        renderHeader();

        const brandLink = screen.getByRole("link", { name: /🛒 Virtual Vault/i });
        expect(brandLink).toHaveAttribute("href", "/");
    });

    it("Renders Header (when (role=user) is login)", () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'token' } };
        renderHeader();

        expect(screen.getByText("Test User")).toBeInTheDocument();
        const dashboard = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboard).toHaveAttribute("href", "/dashboard/user");
    });

    it("Renders Header (when (role=admin) is login)", () => {
        mockAuth = { user: { name: 'Admin User', role: 1, token: 'token' } };
        renderHeader();

        expect(screen.getByText("Admin User")).toBeInTheDocument();
        const dashboard = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboard).toHaveAttribute("href", "/dashboard/admin");
    });

    it("Renders correct cart count", () => {
        renderHeader();
        expect(screen.getByTestId('badge')).toHaveTextContent('1');
    });

    it("Calls logout, clears localStorage, and shows success toast on logout", async () => {
        mockAuth = { user: { name: 'Admin User', role: 1, token: 'token' } };
        mockLogout.mockImplementation(() => {
            window.localStorage.removeItem('auth');
        });
        renderHeader();

        const userToggle = screen.getByRole("button", { name: /admin user/i });
        fireEvent.click(userToggle);

        const logoutLink = screen.getByRole("link", { name: /logout/i });
        expect(logoutLink).toHaveAttribute('href', '/login');

        fireEvent.click(logoutLink);

        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled();
            expect(toast.success.mock.calls[0][0]).toBe("Logout Successfully");
        });
    });

    it("Handles logout failure by showing error in console", () => {
        const error = new Error("");
        const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        mockLogout.mockImplementationOnce(() => { throw error; });

        mockAuth = { user: { name: 'Admin User', role: 1, token: 'token' } };
        renderHeader();

        const userToggle = screen.getByRole("button", { name: /admin user/i });
        fireEvent.click(userToggle);

        const logout = screen.getByRole("link", { name: /logout/i });
        fireEvent.click(logout);

        expect(errSpy).toHaveBeenCalledWith(error);

        errSpy.mockRestore();
    });
});