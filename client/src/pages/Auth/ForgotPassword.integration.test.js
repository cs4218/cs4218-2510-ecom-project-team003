import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import { Toaster } from "react-hot-toast";
import ForgotPassword from "./ForgotPassword";
import LoginPage from "./Login";
import HomePage from "../HomePage";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { hashPassword } from "../../../../helpers/authHelper";
import { seedUsers, resetDatabase } from "../../../tests/helpers/seedApi";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log = jest.fn();

const renderForgotPasswordPage = () => {
  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/forgot-password"]}>
            <Toaster />
            <Routes>
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Forgot Password Integration Tests", () => {
  let hashedPassword;

  beforeAll(async () => {
    hashedPassword = await hashPassword("password123");
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();

    // Seed users for realistic test environment
    await seedUsers([
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0ff",
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phone: "12345678",
        address: "123 Main St",
        answer: "Blue",
        role: 0,
      },
    ]);
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  describe("Successful Reset", () => {
    it("should reset password successfully, show success message and redirect to login", async () => {
      // ARRANGE
      renderForgotPasswordPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/what is your favorite sport/i), {
        target: { value: "Blue" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
        target: { value: "newpassword123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/password reset successful/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/login form/i)).toBeInTheDocument();
      });
    });
  });

  describe("Failed Reset", () => {
    it("should show error for incorrect security answer", async () => {
      // ARRANGE
      renderForgotPasswordPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/what is your favorite sport/i), {
        target: { value: "WrongAnswer" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
        target: { value: "newpassword123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/wrong email or answer/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
    });

    it("should show error for non-existent user", async () => {
      // ARRANGE
      renderForgotPasswordPage();

      // ACT
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "nonexistent@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/what is your favorite sport/i), {
        target: { value: "Anything" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), {
        target: { value: "password123" },
      });

      fireEvent.click(screen.getByRole("button", { name: /reset password/i }));

      // ASSERT
      await waitFor(() => {
        expect(screen.getByText(/wrong email or answer/i)).toBeInTheDocument();
      });

      expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
    });
  });

  describe("Already Logged In", () => {
    it("should redirect to home immediately if token exists", async () => {
      // Arrange
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: {
            _id: "64f3b2f9e1f1c2a1a0b0c0ff",
            name: "John Doe",
            email: "john@example.com",
          },
          token: "mockToken123",
        })
      );

      // Act
      renderForgotPasswordPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/all products/i)).toBeInTheDocument();
      });
    });
  });
});