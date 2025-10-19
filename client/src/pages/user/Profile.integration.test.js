import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/extend-expect";
import dotenv from "dotenv";
import { AuthProvider } from "../../context/auth";
import { CartProvider } from "../../context/cart";
import { SearchProvider } from "../../context/search";
import { toast, Toaster } from "react-hot-toast";
import Profile from "./Profile";
import HomePage from "../HomePage";
import { seedUsers, resetDatabase } from "../../../tests/helpers/seedApi";
import JWT from "jsonwebtoken";
import { hashPassword } from "../../../../helpers/authHelper";

dotenv.config({ path: ".env" });

console.log = jest.fn();

const renderProfilePage = (authData) => {
  localStorage.setItem("auth", JSON.stringify(authData));

  return render(
    <AuthProvider>
      <CartProvider>
        <SearchProvider>
          <MemoryRouter initialEntries={["/profile"]}>
            <Toaster />
            <Routes>
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </MemoryRouter>
        </SearchProvider>
      </CartProvider>
    </AuthProvider>
  );
};

describe("Profile Page Integration Tests", () => {
  let validToken;
  let hashedPassword;

  beforeAll(async () => {
    // Hash password once for all tests
    hashedPassword = await hashPassword("password123");

    validToken = JWT.sign(
      { _id: "64f3b2f9e1f1c2a1a0b0c0d9", role: 0 },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorage.clear();
    await seedUsers([
      {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "John Doe",
        email: "john@example.com",
        password: hashedPassword,
        phone: "91234567",
        address: "123 Main St",
        answer: "Football",
        role: 0,
      },
    ]);
  });

  afterEach(async () => {
    toast.dismiss();
    localStorage.clear();
    await resetDatabase();
  });

  it("should display prefilled user details from context", async () => {
    renderProfilePage({
      user: {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "John Doe",
        email: "john@example.com",
        hashPassword: hashedPassword,
        phone: "91234567",
        address: "123 Main St",
        role: 0,
      },
      token: validToken,
    });

    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue(
      "John Doe"
    );
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue(
      "john@example.com"
    );
    expect(screen.getByPlaceholderText(/enter your password/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveValue(
      "91234567"
    );
    expect(screen.getByPlaceholderText(/enter your address/i)).toHaveValue(
      "123 Main St"
    );
  });

  it("should update user profile successfully and show success toast", async () => {
    // Arrange
    renderProfilePage({
      user: {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "John Doe",
        email: "john@example.com",
        hashPassword: hashedPassword,
        phone: "91234567",
        address: "123 Main St",
        role: 0,
      },
      token: validToken,
    });

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
      target: { value: "John Smith" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
      target: { value: "99887766" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
      target: { value: "456 Updated Street" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    // Assert
    await waitFor(
      () => {
        expect(
          screen.getByText(/profile updated successfully/i)
        ).toBeInTheDocument();
      }
    );

    expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue(
      "John Smith"
    );
    expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveValue(
      "99887766"
    );
    expect(screen.getByPlaceholderText(/enter your address/i)).toHaveValue(
      "456 Updated Street"
    );
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue(
      "john@example.com"
    ); // email should remain unchanged
  });

  it("should update auth context and localStorage after successful profile update", async () => {
    // Arrange
    renderProfilePage({
      user: {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "John Doe",
        email: "john@example.com",
        hashPassword: hashedPassword,
        phone: "91234567",
        address: "123 Main St",
        role: 0,
      },
      token: validToken,
    });

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
      target: { value: "John Updated" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
      target: { value: "90000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    // Assert
    await waitFor(() => {
      const storedAuth = JSON.parse(localStorage.getItem("auth"));
      expect(storedAuth?.user?.name).toBe("John Updated");
    });

    const storedAuth = JSON.parse(localStorage.getItem("auth"));
    expect(storedAuth).toBeTruthy();
    expect(storedAuth.user.phone).toBe("90000000");
    expect(storedAuth.user.email).toBe("john@example.com");
  });

  it("should keep previous values when fields are left empty", async () => {
    // Arrange
    renderProfilePage({
      user: {
        _id: "64f3b2f9e1f1c2a1a0b0c0d9",
        name: "John Doe",
        email: "john@example.com",
        hashPassword: hashedPassword,
        phone: "91234567",
        address: "123 Main St",
        role: 0,
      },
      token: validToken,
    });

    // Act
    fireEvent.change(screen.getByPlaceholderText(/enter your name/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your phone/i), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByPlaceholderText(/enter your address/i), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /update/i }));

    // Assert
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/enter your name/i)).toHaveValue(
        "John Doe"
      );
    });
    expect(screen.getByPlaceholderText(/enter your email/i)).toHaveValue(
      "john@example.com"
    );
    expect(screen.getByPlaceholderText(/enter your password/i)).toHaveValue("");
    expect(screen.getByPlaceholderText(/enter your phone/i)).toHaveValue(
      "91234567"
    );
    expect(screen.getByPlaceholderText(/enter your address/i)).toHaveValue(
      "123 Main St"
    );
  });
});
