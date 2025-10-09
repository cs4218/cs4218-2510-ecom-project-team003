import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import SearchInput from "./SearchInput";
import { useSearch } from "../../context/search";

jest.mock("axios");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
jest.mock("../../context/search");

describe("SearchInput", () => {
  let mockNavigate;
  let mockSetValues;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockSetValues = jest.fn();
    
    require("react-router-dom").useNavigate.mockReturnValue(mockNavigate);
    useSearch.mockReturnValue([{ keyword: "", results: [] }, mockSetValues]);
    
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <BrowserRouter>
        <SearchInput />
      </BrowserRouter>
    );
  };

  describe("Rendering", () => {
    it("renders search input and button", () => {
      // Act
      renderComponent();
      
      // Assert
      expect(screen.getByRole("searchbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
    });

    it("displays keyword from context", () => {
      // Arrange
      useSearch.mockReturnValue([{ keyword: "laptop", results: [] }, mockSetValues]);
      
      // Act
      renderComponent();
      
      // Assert
      expect(screen.getByRole("searchbox")).toHaveValue("laptop");
    });
  });

  describe("User Input", () => {
    it("updates keyword when user types", () => {
      // Arrange
      renderComponent();
      
      // Act
      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "phone" } });
      
      // Assert
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: "phone", results: [] });
    });
  });

  describe("Form Submission", () => {
    it("trims whitespace from keyword before API call", async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: [] });
      useSearch.mockReturnValue([{ keyword: "  laptop  ", results: [] }, mockSetValues]);
      renderComponent();
      
      // Act
      fireEvent.submit(screen.getByRole("search"));
      
      // Assert
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith("/api/v1/product/search/laptop");
      });
    });

    it("does not allow empty keyword search", async () => {
      // Arrange
      renderComponent();
      
      // Act
      fireEvent.submit(screen.getByRole("search"));
      
      // Assert
      expect(axios.get).not.toHaveBeenCalled();
    });
  });

  describe("Successful Search", () => {
    it("updates results and navigates on success", async () => {
      // Arrange
      const mockData = [{ id: 1, name: "Product 1" }];
      axios.get.mockResolvedValue({ data: mockData });
      useSearch.mockReturnValue([{ keyword: "laptop", results: [] }, mockSetValues]);
      renderComponent();
      
      // Act
      fireEvent.submit(screen.getByRole("search"));
      
      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/search");
      });
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: "laptop", results: mockData });
    });

    it("handles empty results", async () => {
      // Arrange
      axios.get.mockResolvedValue({ data: [] });
      useSearch.mockReturnValue([{ keyword: "nonexistent", results: [] }, mockSetValues]);
      renderComponent();
      
      // Act
      fireEvent.submit(screen.getByRole("search"));
      
      // Assert
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/search");
      });
      expect(mockSetValues).toHaveBeenCalledWith({ keyword: "nonexistent", results: [] });
    });
  });

  describe("Error Handling", () => {
    it("sets empty results and does not navigate on error", async () => {
      // Arrange
      axios.get.mockRejectedValue(new Error("Network error"));
      useSearch.mockReturnValue([{ keyword: "laptop", results: [] }, mockSetValues]);
      renderComponent();
      
      // Act
      fireEvent.submit(screen.getByRole("search"));
      
      // Assert
      await waitFor(() => {
        expect(mockSetValues).toHaveBeenCalledWith({ keyword: "laptop", results: [] });
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});