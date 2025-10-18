import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import Login from "./Login";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { hashPassword } from "../../../../helpers/authHelper";
import { seedUsers, resetDatabase } from "../../../tests/helpers/seedApi";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log = jest.fn();

// Mock components for navigation testing
const HomePage = () => <div data-testid="home-page">Home Page</div>;
const DashboardPage = () => <div data-testid="dashboard-page">Dashboard</div>;
const ForgotPasswordPage = () => (
  <div data-testid="forgot-password-page">Forgot Password Page</div>
);

const renderLoginPage = (locationState = null) => {
  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter
            initialEntries={[{ pathname: "/login", state: locationState }]}
          >
            <Toaster />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Login Page Integration Tests", () => {
  let hashedPassword;

  beforeAll(async () => {
    // Hash password once for all tests
    hashedPassword = await hashPassword("password123");
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();

    // ARRANGE - Seed test users
    await seedUsers([
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d0",
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phone: "12345678",
        address: "123 Main St",
        answer: "Blue",
        role: 0,
      },
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d1",
        name: "Admin User",
        email: "admin@example.com",
        password: hashedPassword,
        phone: "87654321",
        address: "456 Admin Ave",
        answer: "Red",
        role: 1,
      },
    ]);
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    localStorage.clear();
    await resetDatabase();
  });

  describe("Successful Login", () => {
    it("should login regular user, update auth state, display toast, and navigate to home", async () => {
      // ARRANGE
      renderLoginPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(screen.getByText(/login success/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(localStorage.getItem("auth")).toBeTruthy();
      });

      const auth = JSON.parse(localStorage.getItem("auth"));
      expect(auth).toHaveProperty("user");
      expect(auth).toHaveProperty("token");
      expect(auth.user.email).toBe("john@example.com");
      expect(auth.user.name).toBe("John Doe");
      expect(auth.user.role).toBe(0);
      expect(typeof auth.token).toBe("string");

      await waitFor(() => {
        expect(screen.getByTestId("home-page")).toBeInTheDocument();
      });
    });

    it("should login admin user, update auth state, display toast, and navigate to home", async () => {
      // ARRANGE
      renderLoginPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "admin@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(localStorage.getItem("auth")).toBeTruthy();
        },
        { timeout: 5000 }
      );

      const auth = JSON.parse(localStorage.getItem("auth"));
      expect(auth.user.role).toBe(1);
      expect(auth.user.name).toBe("Admin User");
      expect(auth.user.email).toBe("admin@example.com");
    });

    it("should redirect to previous location (dashboard) after successful login", async () => {
      // ARRANGE - User was redirected to login from dashboard
      renderLoginPage("/dashboard");

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(localStorage.getItem("auth")).toBeTruthy();
        },
        { timeout: 5000 }
      );

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });
    });
  });

  describe("Failed Login", () => {
    it("should show error message for wrong password", async () => {
      // ARRANGE
      renderLoginPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(
            screen.getByText(/invalid email or password/i)
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(localStorage.getItem("auth")).toBeNull();
      expect(screen.getByText(/login form/i)).toBeInTheDocument();
    });

    it("should show error for non-existent user", async () => {
      // ARRANGE
      renderLoginPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "nonexistent@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByRole("button", { name: /^login$/i }));

      // ASSERT
      await waitFor(
        () => {
          expect(
            screen.getByText(/invalid email or password/i)
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      expect(localStorage.getItem("auth")).toBeNull();
      expect(screen.getByText(/login form/i)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid multiple login button clicks", async () => {
      // ARRANGE
      renderLoginPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });

      const loginButton = screen.getByRole("button", { name: /^login$/i });
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);
      fireEvent.click(loginButton);

      // ASSERT - Should still complete successfully
      await waitFor(
        () => {
          expect(localStorage.getItem("auth")).toBeTruthy();
        },
        { timeout: 5000 }
      );
    });
  });
});
