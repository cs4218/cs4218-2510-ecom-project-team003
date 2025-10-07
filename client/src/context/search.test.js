import React from "react";
import { renderHook, act } from "@testing-library/react";
import { SearchProvider, useSearch } from "./search";

describe("SearchContext", () => {
  const wrapper = ({ children }) => <SearchProvider>{children}</SearchProvider>;

  describe("Initial State", () => {
    it("provides default search state with empty keyword and results", () => {
      // Arrange & Act
      const { result } = renderHook(() => useSearch(), { wrapper });

      // Assert
      expect(result.current[0]).toEqual({
        keyword: "",
        results: [],
      });
    });

    it("provides setSearch function", () => {
      // Arrange & Act
      const { result } = renderHook(() => useSearch(), { wrapper });

      // Assert
      expect(typeof result.current[1]).toBe("function");
    });
  });

  describe("State Updates", () => {
    it("updates keyword", () => {
      // Arrange
      const { result } = renderHook(() => useSearch(), { wrapper });

      // Act
      act(() => {
        const [search, setSearch] = result.current;
        setSearch({ ...search, keyword: "laptop" });
      });

      // Assert
      expect(result.current[0].keyword).toBe("laptop");
    });

    it("updates results", () => {
      // Arrange
      const { result } = renderHook(() => useSearch(), { wrapper });
      const mockResults = [
        { id: 1, name: "Product 1" },
        { id: 2, name: "Product 2" },
      ];

      // Act
      act(() => {
        const [search, setSearch] = result.current;
        setSearch({ ...search, results: mockResults });
      });

      // Assert
      expect(result.current[0].results).toEqual(mockResults);
    });

    it("updates both keyword and results simultaneously", () => {
      // Arrange
      const { result } = renderHook(() => useSearch(), { wrapper });
      const mockResults = [{ id: 1, name: "Laptop" }];

      // Act
      act(() => {
        const [, setSearch] = result.current;
        setSearch({ keyword: "laptop", results: mockResults });
      });

      // Assert
      expect(result.current[0]).toEqual({
        keyword: "laptop",
        results: mockResults,
      });
    });

    it("preserves previous state when updating single property", () => {
      // Arrange
      const { result } = renderHook(() => useSearch(), { wrapper });
      const mockResults = [{ id: 1, name: "Product" }];

      act(() => {
        const [, setSearch] = result.current;
        setSearch({ keyword: "laptop", results: mockResults });
      });

      // Act - Update only keyword
      act(() => {
        const [search, setSearch] = result.current;
        setSearch({ ...search, keyword: "phone" });
      });

      // Assert
      expect(result.current[0]).toEqual({
        keyword: "phone",
        results: mockResults,
      });
    });
  });

  describe("Multiple Updates", () => {
    it("handles consecutive updates", () => {
      // Arrange
      const { result } = renderHook(() => useSearch(), { wrapper });

      // Act
      act(() => {
        const [search, setSearch] = result.current;
        setSearch({ ...search, keyword: "phone" });
      });

      act(() => {
        const [search, setSearch] = result.current;
        setSearch({ ...search, keyword: "laptop" });
      });

      // Assert
      expect(result.current[0].keyword).toBe("laptop");
    });
  });
});