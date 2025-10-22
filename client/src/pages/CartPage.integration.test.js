import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import CartPage from "../pages/CartPage";
import { AuthProvider } from "../context/auth";
import { CartProvider } from "../context/cart";
import { SearchProvider } from "../context/search";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import { USER } from "../../tests/helpers/testData";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config({"path": ".env"});
// Mock DropIn

const userToken = jwt.sign(
    { _id: USER._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const setCartMock = jest.fn();

jest.mock("braintree-web-drop-in-react", () => (props) => (
  <div
    data-testid="dropin-mock"
    onClick={() => props.onInstance({ requestPaymentMethod: async () => ({ nonce: "fake-nonce" }) })}
  ></div>
));

// Mock axios
jest.mock("axios");
axios.get.mockResolvedValue({ data: { clientToken: "fake-client-token" } });
console.log = jest.fn();

const renderCartPage = ({ auth, cart } = {}) => {
  return render(
    <AuthProvider value= {{auth, setAuth: jest.fn()}}>
      <SearchProvider>
        <CartProvider value={{ cart, setCart: setCartMock }}>
          <MemoryRouter initialEntries={["/cart"]}>
            <Toaster />
            <Routes>
              <Route path="/cart" element={<CartPage />} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </SearchProvider>
    </AuthProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  axios.get.mockResolvedValue({ data: { clientToken: "fake-client-token" } });
  axios.post.mockResolvedValue({ data: { ok: true } });
});

test("handles payment successfully", async () => {
  
  const cart = [{ _id: "1", name: "Product 1", description: "desc", price: 100 }];
  const auth = { user: USER, token: userToken };

  renderCartPage({auth, cart});
  await waitFor(() => expect(screen.getByTestId("dropin-mock")).toBeInTheDocument());
  // click DropIn mock to set instance
  fireEvent.click(screen.getByTestId("dropin-mock"));

  const payButton = screen.getByRole("button", { name: /Make Payment/i });
  fireEvent.click(payButton);

  await waitFor(() =>
    expect(axios.post).toHaveBeenCalledWith("/api/v1/payment/braintree/payment", { nonce: "fake-nonce", cart })
  );
  expect(setCartMock).toHaveBeenCalledWith([]);
});
