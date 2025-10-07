import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CartPage from "../pages/CartPage";
import { useCart } from "../context/cart";
import { useAuth } from "../context/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DropIn from "braintree-web-drop-in-react";
import toast from "react-hot-toast";

jest.mock("../context/cart");
jest.mock("../context/auth");
jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn(),
}));
jest.mock("axios");

jest.mock("react-hot-toast");
jest.mock("braintree-web-drop-in-react", () => {
  return ({ onInstance }) => {
    // call onInstance asynchronously to avoid render loop
    setTimeout(() => {
      onInstance({
        requestPaymentMethod: jest.fn().mockResolvedValue({ nonce: "fake-nonce" }),
      });
    }, 0);

    return <div data-testid="dropin-mock" />;
  };
});
jest.mock("../components/Header", () => () => <div>Header</div>);
jest.mock("../components/Footer", () => () => <div>Footer</div>);


describe("CartPage Component", () => {
  let setCartMock, setAuthMock, navigateMock;

  beforeEach(() => {
    setCartMock = jest.fn();
    setAuthMock = jest.fn();
    navigateMock = jest.fn();
    useCart.mockReturnValue({ cart: [], setCart: setCartMock });
    useAuth.mockReturnValue([{ user: null, token: null }, setAuthMock]);
    useNavigate.mockReturnValue(navigateMock);
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
    axios.post.mockResolvedValue({ data: { success: true } });
    jest.clearAllMocks();
  });

  it("renders guest view when user is not logged in", async () => {
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
    await act( async () => render(<CartPage />));
    expect(screen.getByText("Hello Guest")).toBeInTheDocument();
    expect(screen.getByText("Your Cart Is Empty")).toBeInTheDocument();
  });

  it("displays items in cart and calculates total price", async () => {
    const fakeCart = [
      { _id: "1", name: "Item 1", description: "Desc1", price: 50 },
      { _id: "2", name: "Item 2", description: "Desc2", price: 100 },
    ];
    useCart.mockReturnValue({ cart: fakeCart, setCart: setCartMock });
    useAuth.mockReturnValue([{ user: { name: "Alice" }, token: "token123" }, setAuthMock]);
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
    await act( async () => render(<CartPage />));
    expect(screen.getByText("Hello Alice")).toBeInTheDocument();
    expect(screen.getByText("You Have 2 items in your cart")).toBeInTheDocument();
    expect(screen.getByText("Total : $150.00")).toBeInTheDocument();
  });

  it("removes item from cart when Remove button clicked", async () => {
    const fakeCart = [
      { _id: "1", name: "Item 1", description: "Desc1", price: 50 },
    ];
    useCart.mockReturnValue({ cart: fakeCart, setCart: setCartMock });
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
    await act( async () => render(<CartPage />));
    fireEvent.click(screen.getByText("Remove"));
    expect(setCartMock).toHaveBeenCalledWith([]);
  });

  it("fetches Braintree token on mount", async () => {
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });

    await act( async () => render(<CartPage />));
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
    
  });

  it("handles payment successfully", async () => {
    const fakeCart = [{ _id: "1", name: "Item 1", price: 50, description: "Desc1" }];
    useCart.mockReturnValue({ cart: fakeCart, setCart: setCartMock });
    useAuth.mockReturnValue([{ user: { name: "Alice", address: "123 St" }, token: "token123" }, setAuthMock]);
    axios.get.mockResolvedValue({ data: { clientToken: "fake-token" } });
    axios.post.mockResolvedValue({ data: { success: true } });

    await act( async () => render(<CartPage />));
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token");
    });
    // await waitFor(() => expect(axios.get).toHaveBeenCalledWith("/api/v1/product/braintree/token"));

    const button = await screen.findByText("Make Payment");
    await waitFor(() => expect(button).not.toBeDisabled());
    fireEvent.click(button);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith("/api/v1/product/braintree/payment", {
        nonce: "fake-nonce",
        cart: fakeCart,
      });
      expect(setCartMock).toHaveBeenCalledWith([]);
      expect(navigateMock).toHaveBeenCalledWith("/dashboard/user/orders");
      expect(toast.success).toHaveBeenCalledWith("Payment Completed Successfully ");
    });
  });
});