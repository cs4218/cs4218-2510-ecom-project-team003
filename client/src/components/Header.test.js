import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "./Header";
import "@testing-library/jest-dom";
import toast from "react-hot-toast";

let mockAuth = { user: { name: 'Test User', role: 0, token: 'test-token' } };
let mockSetAuth = jest.fn();
let mockCart = [{ _id: '1', name: 'Product 1' }];
const mockCategories = [
    { _id: '1', name: 'Category 1', slug: 'category1' },
    { _id: '2', name: 'Category 2', slug: 'category2' },
];
const mockNavigate = jest.fn();

jest.mock('../context/auth', () => ({
    useAuth: jest.fn(() => [mockAuth, mockSetAuth]),
}));

jest.mock('../context/cart', () => ({
    useCart: jest.fn(() => [mockCart, jest.fn()]),
}));

jest.mock("../context/search", () => ({
    useSearch: jest.fn(() => ["", jest.fn()]),
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => mockCategories));

jest.mock('react-hot-toast');

jest.mock('antd', () => ({
    Badge: ({ count, children }) => (
        <div data-testid="badge" data-count={count}>{children}</div>
    ),
}));

jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}))

Object.defineProperty(window, "localStorage", {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

describe("Header", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSetAuth.mockReset();
        mockNavigate.mockReset();
    });

    const renderHeader = () => {
        render(
            <MemoryRouter>
                <Header/>
            </MemoryRouter>
        );
    }

    it("Renders Header (when user is not login)", () => {
        mockAuth = { user: null, token: "" };
        renderHeader();

        expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /^Categories$/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
        expect(screen.getByRole("link", { name: /Category 1/i })).toHaveAttribute("href", "/category/category1");
        expect(screen.getByRole("link", { name: /Category 2/i })).toHaveAttribute("href", "/category/category2");
    });

    it("Redirect link back to Home Page", () => {
        mockAuth = { user: null, token: "" };
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
        mockAuth = { user: null, token: "" };
        mockCart = [{ _id: '1', name: 'Product 1' }];
        renderHeader();
        expect(screen.getByTestId("badge")).toHaveAttribute("data-count", "1");
    });

    it("Renders clearing of auth, shows success toast, removes localStorage, and navigates to /login on logout", async () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'token' } };
        renderHeader();

        const logout = screen.getByRole("link", { name: /logout/i });
        fireEvent.click(logout);

        expect(mockSetAuth).toHaveBeenCalledTimes(1);
        const newState = mockSetAuth.mock.calls[0][0];
        expect(newState.user).toBeNull();
        expect(newState.token).toBe("");

        expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");

        await waitFor(() => {
            expect(toast.success).toHaveBeenCalled();
            expect(toast.success.mock.calls[0][0]).toBe("Logout Successfully");
        });
    });

    it("Renders error toast and does not navigate on logout", () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'token' } };
        const error = new Error("");
        const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        window.localStorage.removeItem.mockImplementationOnce(() => { throw error; });

        renderHeader();

        const logout = screen.getByRole("link", { name: /logout/i });
        fireEvent.click(logout);

        expect(toast.error).toHaveBeenCalled();
        expect(toast.error.mock.calls[0][0]).toBe("Logout Failed");
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(errSpy).toHaveBeenCalledWith(error);

        errSpy.mockRestore();
    });
});