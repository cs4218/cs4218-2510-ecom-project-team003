import axios from "axios";
import React from "react";
import AdminOrders from "./AdminOrders";
import {MemoryRouter} from "react-router-dom";
import {act, render, screen, waitFor} from "@testing-library/react";
import {
    ELECTRONICS,
    LAPTOP,
    SMARTPHONE,
    USER
} from "../../../tests/helpers/testData";
import toast from "react-hot-toast";
import userEvent from "@testing-library/user-event";

// dev note: if you look at orderModel, you may be inclined to use LAPTOP._id etc.
// but if you look in orderController, it changes the form of return by
// .populate("products", "-photo") at line 26
// changing _ids to actual objects
// thus we replaced the original testData with actual objects below
const ORDER_TWO_ITEMS_PROCESSING = {
    _id: 'a1b2c3d4e5f6789012345680',
    products: [LAPTOP, SMARTPHONE],
    status: 'Processing',
    buyer: USER._id,
    createAt: new Date().toISOString(),
    payment: { success: true },
}

const ORDER = {
    _id: "order1",
    products: [LAPTOP],
    status: "Processing",
    buyer: { name: "Admin" },
    createAt: new Date().toISOString(),
    payment: { success: true },
};

jest.mock("axios");
jest.mock("react-hot-toast")
jest.mock("../../components/Layout", () => ({ children }) => <div>{children}</div>);
jest.mock("../../components/AdminMenu", () => () => <div />);
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [{
        user: { _id: "user1", role: 1, name: "Admin User" },
        token: "any token",
    }, jest.fn()])
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

const renderAdminOrders = () => {
    render(
        <MemoryRouter>
            <AdminOrders />
        </MemoryRouter>
    );
}

describe("AdminOrders tests", () => {
    it("gets all orders on render", async () => {
        axios.get.mockImplementation((url) => {
            console.log("axios.get called with:", url);
            if (url.startsWith("/api/v1/order/all-orders")) {
                return Promise.resolve({
                    data: [ORDER_TWO_ITEMS_PROCESSING],
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
            renderAdminOrders();
        })

        // note: Most components implicitly call get categories, so we must filter
        await waitFor(() => {
            const orderCalls = axios.get.mock.calls.filter(([url]) =>
                url.includes("/api/v1/order/all-orders")
            );
            expect(orderCalls.length).toBe(1);
        });

        const orderTables = await screen.findAllByTestId("order-table");
        expect(orderTables).toHaveLength(1);
    });

    it("shows toast error when unauthorized", async () => {
        axios.get.mockRejectedValue({ response: { status: 401 } });

        await act(async () => {
            renderAdminOrders();
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/not authorized/i));
        });
    });

    it("shows toast error for other failures", async () => {
        axios.get.mockRejectedValue({ response: { status: 500 } });

        await act(async () => {
            renderAdminOrders();
        });

        await waitFor(() => {
            expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/something went wrong/i));
        });
    });

    it("Changing order status calls put and refreshes page", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/order/all-orders") {
                return Promise.resolve({
                    data: [ORDER],
                });
            }
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, message: "All Categories List", category: [ELECTRONICS] },
                });
            }
            return Promise.reject(new Error("Unexpected GET URL: " + url));
        });

        axios.put.mockResolvedValueOnce({data:[]})

        await act(async () => {
            renderAdminOrders();
        })

        // Wait for the initial order table
        const dropdowns = await screen.findAllByRole("combobox");
        expect(dropdowns.length).toBeGreaterThan(0);

        // Note: fireEvent doesn't work with antd, so manual clicks are required.
        const select = await screen.findByRole("combobox");
        await userEvent.click(select);

        // click on the desired option (case-insensitive match)
        const option = await screen.findByText(/Shipped/i);
        await userEvent.click(option);

        await waitFor(() => {
            // ✅ axios.put called with correct URL and body
            expect(axios.put).toHaveBeenCalledWith(
                `/api/v1/order/order-status/${ORDER._id}`,
                { status: "Shipped" }
            );
        });
    })

    it("Shows Toast Error when changing status fails", async () => {
        axios.get.mockImplementation((url) => {
            if (url === "/api/v1/order/all-orders") {
                return Promise.resolve({
                    data: [ORDER],
                });
            }
            if (url === "/api/v1/category/get-category") {
                return Promise.resolve({
                    data: { success: true, message: "All Categories List", category: [ELECTRONICS] },
                });
            }
            return Promise.reject(new Error("Unexpected GET URL: " + url));
        });
        // Toast change fails
        axios.put.mockRejectedValue(new Error("Network Error"));

        await act(async () => {
            renderAdminOrders();
        })

        // Wait for the initial order table
        const dropdowns = await screen.findAllByRole("combobox");
        expect(dropdowns.length).toBeGreaterThan(0);

        // Note: fireEvent doesn't work with antd, so manual clicks are required.
        const select = await screen.findByRole("combobox");
        await userEvent.click(select);

        // click on the desired option (case-insensitive match)
        const option = await screen.findByText(/Shipped/i);
        await userEvent.click(option);

        await waitFor(() => {
            // ✅ axios.put called with correct URL and body
            expect(axios.put).toHaveBeenCalledWith(
                `/api/v1/order/order-status/${ORDER._id}`,
                { status: "Shipped" }
            );
            expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/something went wrong/i));
        });
    })
})