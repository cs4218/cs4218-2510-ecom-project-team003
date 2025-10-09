import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Search from "./Search";
import { useSearch } from "../context/search";

jest.mock('../context/auth', () => ({
  useAuth: jest.fn(() => [null, jest.fn(), jest.fn()])
}));

const mockAddToCart = jest.fn();
jest.mock('../context/cart', () => ({
  useCart: jest.fn(() => ({ addToCart: mockAddToCart }))
}));

jest.mock('../context/search', () => ({
  useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()])
}));

jest.mock('../hooks/useCategory', () => jest.fn(() => []));

jest.mock('../utils/string', () => ({
  ...jest.requireActual('../utils/string'),
  getShortDescription: jest.fn((desc) => desc)
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const LAPTOP = {
  _id: "1",
  name: "Laptop",
  slug: "slug",
  description: "High performance laptop with great features",
  price: 999,
};

const PHONE = {
  _id: "2",
  name: "Phone",
  slug: "phone",
  description: "Smartphone with excellent camera",
  price: 599,
};

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
    it("displays product count and names", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "laptop", results: [LAPTOP, PHONE] }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText("Found 2")).toBeInTheDocument();
      expect(screen.getByText("Laptop")).toBeInTheDocument();
      expect(screen.getByText("Phone")).toBeInTheDocument();
    });

    it("displays product details", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "", results: [LAPTOP, PHONE] }]);

      // Act
      renderComponent();

      // Assert
      expect(screen.getByText(/High performance laptop with/)).toBeInTheDocument();
      expect(screen.getByText("$999.00")).toBeInTheDocument();
    });

    it("renders images and buttons", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "", results: [LAPTOP, PHONE] }]);

      // Act
      renderComponent();

      // Assert
      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute("src", "/api/v1/product/product-photo/1");
      expect(screen.getAllByRole("button", { name: /more details/i })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: /add to cart/i })).toHaveLength(2);
    });
  });

  describe('User interactions', () => {
    it('adds product to cart', async () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "lap", results: [LAPTOP] }]);

      // Act
      renderComponent();
      fireEvent.click(await screen.findByRole('button', { name: /add to cart/i }));

      // Assert
      expect(mockAddToCart).toHaveBeenCalledWith(LAPTOP);
    });

    it('navigates to product details', async () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "phon", results: [PHONE] }]);

      // Act
      renderComponent();
      fireEvent.click(await screen.findByRole('button', { name: /details/i }));

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(`/product/${PHONE.slug}`);
    });

  });
});