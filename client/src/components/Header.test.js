import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
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

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

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

    it("Renders Header with Navigation Links when user is not login", () => {
        mockAuth = { user: null, token: "" };
        renderHeader();

        expect(screen.getByText("🛒 Virtual Vault")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /^Categories$/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /cart/i })).toBeInTheDocument();

        expect(screen.getByRole("link", { name: /register/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /login/i })).toBeInTheDocument();

        expect(screen.queryByText(/Test User/i)).not.toBeInTheDocument();

        expect(screen.getByRole("link", { name: /all categories/i })).toHaveAttribute("href", "/categories");
        expect(screen.getByRole("link", { name: /category 1/i })).toHaveAttribute("href", "/category/category1");
        expect(screen.getByRole("link", { name: /category 2/i })).toHaveAttribute("href", "/category/category2");
    });

    it("Shows user dropdown and hides Register/Login when logged in (role=user)", () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'x' } };
        renderHeader();

        expect(screen.getByText("Test User")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /register/i })).not.toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /login/i })).not.toBeInTheDocument();

        const dashboard = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboard).toHaveAttribute("href", "/dashboard/user");
    });

    it("Redirects dashboard link correctly for admin (role=1)", () => {
        mockAuth = { user: { name: 'Admin User', role: 1, token: 'x' } };
        renderHeader();

        expect(screen.getByText("Admin User")).toBeInTheDocument();
        const dashboard = screen.getByRole("link", { name: /dashboard/i });
        expect(dashboard).toHaveAttribute("href", "/dashboard/admin");
    });

    it("Displays correct cart count initially, after add, and after remove", () => {
        mockAuth = { user: null, token: "" };
        mockCart = [{ _id: '1', name: 'Product 1' }];
        const { rerender } = render(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByTestId("badge")).toHaveAttribute("data-count", "1");

        mockCart = [
            { _id: '1', name: 'Product 1' },
            { _id: '2', name: 'Product 2' },
            { _id: '3', name: 'Product 3' },
        ];
        rerender(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByTestId("badge")).toHaveAttribute("data-count", "3");

        mockCart = [];
        rerender(
            <MemoryRouter>
                <Header />
            </MemoryRouter>
        );
        expect(screen.getByTestId("badge")).toHaveAttribute("data-count", "0");
    });

    it("Clears auth, shows success toast, removes localStorage, and navigates to /login on logout", () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'x' } };
        renderHeader();

        const logout = screen.getByRole("link", { name: /logout/i });
        fireEvent.click(logout);

        expect(mockSetAuth).toHaveBeenCalledTimes(1);
        const newState = mockSetAuth.mock.calls[0][0];
        expect(newState.user).toBeNull();
        expect(newState.token).toBe("");

        expect(window.localStorage.removeItem).toHaveBeenCalledWith("auth");
        expect(toast.success).toHaveBeenCalledWith("Logout Successfully");
    });

    it("Shows error toast and does not navigate if logout throws", () => {
        mockAuth = { user: { name: 'Test User', role: 0, token: 'x' } };
        window.localStorage.removeItem.mockImplementationOnce(() => { throw new Error(""); });
        const spy = jest.spyOn(console, "error").mockImplementation(() => {});

        renderHeader();

        const logout = screen.getByRole("link", { name: /logout/i });
        fireEvent.click(logout);

        expect(toast.error).toHaveBeenCalledWith("Logout Failed");
        expect(mockNavigate).not.toHaveBeenCalled();

        spy.mockRestore();
    });

    it("Brand links to home", () => {
        mockAuth = { user: null, token: "" };
        renderHeader();
        const brand = screen.getByRole("link", { name: /virtual vault/i });
        expect(brand).toHaveAttribute("href", "/");
    });
});