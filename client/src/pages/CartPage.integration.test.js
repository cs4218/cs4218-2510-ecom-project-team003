// CartPage.integration.test.js
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import CartPage from "../pages/CartPage";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { MemoryRouter } from "react-router-dom";
import { SearchProvider } from "../context/search";
import axios from "axios";

// Mock Braintree DropIn
jest.mock("braintree-web-drop-in-react", () => (props) => {
  return (
    <div
      data-testid="braintree-dropin"
      onClick={() =>
        props.onInstance({
          requestPaymentMethod: jest.fn(() =>
            Promise.resolve({ nonce: "fake-nonce" })
          ),
        })
      }
    >
      Mock DropIn
    </div>
  );
});

// Mock axios
jest.mock("axios");
axios.get.mockImplementation((url) => {
  if (url === "/api/v1/payment/braintree/token") {
    return Promise.resolve({ data: { clientToken: "fake-client-token" } });
  }
  return Promise.reject(new Error("not found"));
});

const USER = { _id: "user123", name: "Test User" };
const CART = [
  { _id: "prod1", name: "Product 1", description: "Desc 1", price: 100 },
  { _id: "prod2", name: "Product 2", description: "Desc 2", price: 50 },
];

const renderCartPage = () => {
  // Pre-populate localStorage so AuthProvider initializes correctly
  localStorage.setItem("auth", JSON.stringify({ user: USER, token: "fake-token" }));
  localStorage.setItem("cart", JSON.stringify(CART));

  render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter>
            <CartPage />
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("CartPage Integration Tests", () => {
  beforeEach(() => {
    axios.post.mockReset();
    axios.get.mockReset();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should handle payment successfully", async () => {
    axios.get.mockResolvedValueOnce({ data: { clientToken: "fake-client-token" } });
    axios.post.mockResolvedValue({ data: { ok: true } });

    // renderCartPage();
    await act( async () => renderCartPage());
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("/api/v1/payment/braintree/token");
    });
    // Wait for DropIn mock to render
    const button = await screen.findByText("Make Payment");
        await waitFor(() => expect(button).not.toBeDisabled());
        fireEvent.click(button);

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith("/api/v1/payment/braintree/payment", {
        nonce: "fake-nonce",
        cart: CART,
      })
    );

    // Expect cart to be cleared after successful payment
    expect(screen.getByText(/Total :/)).toHaveTextContent("Total :$0.00");
    // expect(setCartMock).toHaveBeenCalledWith([]);
  });
});
