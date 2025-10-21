import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import { AuthProvider } from "../../context/auth";
import { Toaster } from "react-hot-toast";
import AdminRoute from "./AdminRoute";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import AdminDashboard from "../../pages/admin/AdminDashboard";
import { seedUsers, resetDatabase } from "../../../tests/helpers/seedApi";
import JWT from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log = jest.fn();

const renderAdminRoute = (authState = null) => {
  if (authState) localStorage.setItem("auth", JSON.stringify(authState));

  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/admin-dashboard"]}>
            <Toaster />
            <Routes>
              <Route element={<AdminRoute />}>
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("AdminRoute Integration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await seedUsers([
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d0",
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        phone: "12345678",
        address: "123 Main St",
        answer: "Blue",
        role: 0, // Regular user
      },
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d1",
        name: "Admin User",
        email: "admin@example.com",
        password: "adminpass123",
        phone: "87654321",
        address: "456 Admin Ave",
        answer: "Red",
        role: 1, // Admin user
      },
    ]);
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  it("renders protected admin content for a valid admin token", async () => {
    // ARRANGE
    const token = JWT.sign(
      { _id: "64f3b2f9e1f1c2a1a0b0c0d1" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const authState = {
      token,
      user: { _id: "64f3b2f9e1f1c2a1a0b0c0d1", role: 1 },
    };

    // ACT
    renderAdminRoute(authState);

    // ASSERT
    await waitFor(() => {
      expect(screen.getByRole("link", { name: /create category/i })).toHaveAttribute(
        "href",
        "/dashboard/admin/create-category"
      );
    });

    expect(screen.getByRole("link", { name: /create product/i })).toHaveAttribute(
      "href",
      "/dashboard/admin/create-product"
    );
  });

  it("shows spinner and blocks content for non-admin user", async () => {
    // ARRANGE
    const token = JWT.sign(
      { _id: "64f3b2f9e1f1c2a1a0b0c0d0" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const authState = {
      token,
      user: { _id: "64f3b2f9e1f1c2a1a0b0c0d0", role: 0 },
    };

    // ACT
    renderAdminRoute(authState);

    // ASSERT
    expect(
      screen.getByText(/Redirecting you in 3 seconds/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/admin panel/i)
      ).not.toBeInTheDocument();
    });
  });

  it("handles expired admin token correctly", async () => {
    // ARRANGE
    const token = JWT.sign(
      { _id: "64f3b2f9e1f1c2a1a0b0c0d1" },
      process.env.JWT_SECRET,
      { expiresIn: "1s" }
    );
    const authState = {
      token,
      user: { _id: "64f3b2f9e1f1c2a1a0b0c0d1", role: 1 },
    };
    localStorage.setItem("auth", JSON.stringify(authState));

    await new Promise((resolve) => setTimeout(resolve, 2000)); // wait for token to expire

    // ACT
    renderAdminRoute(authState);

    // ASSERT
    expect(
      screen.getByText(/Redirecting you in 3 seconds/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/admin panel/i)
      ).not.toBeInTheDocument();
    });
  });

  it("handles invalid admin token correctly", async () => {
    // ARRANGE
    const authState = {
      token: "invalid-token",
      user: { _id: "64f3b2f9e1f1c2a1a0b0c0d1", role: 1 },
    };
    localStorage.setItem("auth", JSON.stringify(authState));

    // ACT
    renderAdminRoute(authState);

    // ASSERT
    expect(
      screen.getByText(/Redirecting you in 3 seconds/i)
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText(/admin panel/i)
      ).not.toBeInTheDocument();
    });
  });
});
