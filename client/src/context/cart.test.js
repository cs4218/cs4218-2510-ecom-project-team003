import React from "react";
import { render, screen, act } from "@testing-library/react";
import { CartProvider, useCart } from "../context/cart";

describe("CartContext", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  const TestComponent = () => {
    const { cart, setCart, addToCart } = useCart();

    return (
      <div>
        <div data-testid="cart-length">{cart.length}</div>
        <button onClick={() => setCart([{ _id: "a", name: "Manual" }])}>SetCart</button>
        <button onClick={() => addToCart({ _id: "b", name: "Added" })}>AddToCart</button>
      </div>
    );
  };

  it("loads existing cart items from localStorage on mount", () => {
    localStorage.setItem("cart", JSON.stringify([{ _id: "1", name: "Saved item" }]));

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });

  it("starts with empty cart if localStorage is empty", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("cart-length").textContent).toBe("0");
  });

  it("adds item to cart and updates localStorage", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = screen.getByText("AddToCart");
    act(() => addButton.click());

    expect(screen.getByTestId("cart-length").textContent).toBe("1");

    const storedCart = JSON.parse(localStorage.getItem("cart"));
    expect(storedCart).toEqual([{ _id: "b", name: "Added" }]);
  });

  it("setCart manually replaces the cart state", () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const button = screen.getByText("SetCart");
    act(() => button.click());

    expect(screen.getByTestId("cart-length").textContent).toBe("1");
  });
});
