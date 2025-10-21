import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { Toaster } from "react-hot-toast";
import Register from "./Register";
import LoginPage from "./Login";
import HomePage from "../HomePage";
import { seedUsers, resetDatabase } from "../../../tests/helpers/seedApi";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

console.log = jest.fn();

const renderRegisterPage = (locationState = null) => {
  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/register"]}>
            <Toaster />
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};
  
describe("Register Page Integration Tests", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();
    await seedUsers([
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "Existing User",
        email: "existing@example.com",
        password: "hashedpassword123",
        phone: "11112222",
        address: "Existing Street",
        answer: "Football",
        role: 0,
      },
    ]);
  });

  afterEach(async () => {
    localStorage.clear();
    await resetDatabase();
  });

  describe("Successful Registration", () => {
    it("should register a new user successfully, display toast, and redirect to login", async () => {
      // Arrange
      renderRegisterPage();

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
        target: { value: "Jane Doe" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "jane@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
        target: { value: "98765432" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
        target: { value: "123 Test Street" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), {
        target: { value: "1995-08-12" },
      });
      fireEvent.change(screen.getByPlaceholderText(/what is your favorite sports/i), {
        target: { value: "Tennis" },
      });

      fireEvent.click(screen.getByRole("button", { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/user register successfully/i)).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/login form/i)).toBeInTheDocument();
      });
    });
  });

  describe("Failed Registration", () => {
    it("should show error if email already exists", async () => {
      // Arrange
      renderRegisterPage();

      // Act
      fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
        target: { value: "Existing User" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your email/i), {
        target: { value: "existing@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your password/i), {
        target: { value: "password123" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
        target: { value: "99998888" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
        target: { value: "Duplicate Lane" },
      });
      fireEvent.change(screen.getByPlaceholderText(/enter your dob/i), {
        target: { value: "1990-05-10" },
      });
      fireEvent.change(
        screen.getByPlaceholderText(/what is your favorite sports/i),
        { target: { value: "Soccer" } }
      );

      fireEvent.click(screen.getByRole("button", { name: /register/i }));

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText(/already register please login/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/register form/i)).toBeInTheDocument();
      expect(screen.queryByText(/login form/i)).not.toBeInTheDocument();
    });
  });

  describe("Already Logged In", () => {
    it("should redirect to home page immediately if user already has a valid token", async () => {
      // Arrange
      localStorage.setItem(
        "auth",
        JSON.stringify({
          user: {
            _id: "64f3b2f9e1f1c2a1a0b0c0d9",
            name: "Existing User",
            email: "existing@example.com",
            password: "hashedpassword123",
            phone: "11112222",
            address: "Existing Street",
            answer: "Football",
            role: 0,
          },
          token: "mockToken123",
        })
      );

      // Act
      renderRegisterPage();

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/all products/i)).toBeInTheDocument();
      });
    });
  });
});
