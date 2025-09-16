import { expect, jest } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react";
import useCategory from "./useCategory";
import axios from "axios";

jest.mock("axios");

const mockCategories = [
    { _id: "1", name: "Category 1", slug: "category-1"},
    { _id: "2", name: "Category 2", slug: "category-2" },
    { _id: "2", name: "Category 3", slug: "category-3" },
];

describe("useCategory Hook", () => {
    let logSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    it("Handles API response, success = true", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: true, message:"All Categories List", category: mockCategories } });

        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        });

        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    })

    it("Handles API response, success = false", async () => {
        axios.get.mockResolvedValueOnce({ data: { success: false, error: new Error()} });

        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(result.current).toEqual([]);
        });

        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    })

    it("Handles Errors in API", async () => {
        const error = new Error("");
        axios.get.mockRejectedValue(error);

        const { result } = renderHook(() => useCategory());

        await waitFor(() => {
            expect(result.current).toEqual([]);
        });

        expect(logSpy).toHaveBeenCalledWith(error);
    })
});