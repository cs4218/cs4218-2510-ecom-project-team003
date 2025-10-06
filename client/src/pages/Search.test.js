import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Search from "./Search";
import { useSearch } from "../context/search";

jest.mock("../context/search");
jest.mock("./../components/Layout", () => {
  return function Layout({ children, title }) {
    return (
      <div data-testid="layout" data-title={title}>
        {children}
      </div>
    );
  };
});

describe("Search Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <Search />
      </BrowserRouter>
    );
  };

  describe("Rendering", () => {
    it("renders with Layout component and heading", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "", results: [] }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByTestId("layout")).toHaveAttribute("data-title", "Search results");
      expect(screen.getByRole("heading", { name: /search results/i })).toBeInTheDocument();
    });
  });

  describe("No Results", () => {
    it("displays no products message and no cards", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "laptop", results: [] }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });

  describe("With Results", () => {
    const mockProducts = [
      {
        _id: "1",
        name: "Laptop",
        description: "High performance laptop with great features",
        price: 999,
      },
      {
        _id: "2",
        name: "Phone",
        description: "Smartphone with excellent camera",
        price: 599,
      },
    ];

    it("displays product count and names", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "laptop", results: mockProducts }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText("Found 2")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
    });

    it("displays product details", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "", results: mockProducts }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/High performance laptop with/)).toBeInTheDocument();
      expect(screen.getByText("$ 999")).toBeInTheDocument();
    });

    it("renders images and buttons", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "", results: mockProducts }]);

      // Act
      renderComponent();

      // Assert
      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute("src", "/api/v1/product/product-photo/1");
      expect(screen.getAllByRole("button", { name: /more details/i })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: /add to cart/i })).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles missing description", () => {
      // Arrange
      const noDescProduct = [{ _id: "1", name: "Item", price: 10 }];
      useSearch.mockReturnValue([{ keyword: "", results: noDescProduct }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("handles undefined or null values", () => {
      // Arrange
      useSearch.mockReturnValue([undefined]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText("No Products Found")).toBeInTheDocument();
    });
  });
});