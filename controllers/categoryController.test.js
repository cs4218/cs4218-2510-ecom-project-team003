import { expect, jest } from "@jest/globals";
import { categoryController, singleCategoryController } from "./categoryController.js";
import categoryModel from "../models/categoryModel.js";

jest.mock("../models/categoryModel.js");

const mockCategories = [
    { name: "Category1", slug: "category1" },
    { name: "Category2", slug: "category2" },
    { name: "Category3", slug: "category3" },
];

describe("Category Controllers", () => {
    let req, res, logSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        req = { body: {}, params: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn(),
        };

        logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        logSpy.mockRestore();
    });

    describe("categoryController (get all categories)", () => {
        it("Returns 200 with categories when found", async () => {
            categoryModel.find = jest.fn().mockResolvedValue(mockCategories);

            await categoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "All Categories List",
                category: mockCategories,
            });
        });

        it("Returns 404 with empty list when category list not found", async () => {
            categoryModel.find = jest.fn().mockResolvedValueOnce([]);

            await categoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "No Categories Found",
                category: [],
            });
        });

        it("Returns 500 when handling error", async () => {
            const error = new Error("Some Error");
            categoryModel.find = jest.fn().mockRejectedValue(error);

            await categoryController(req, res);

            expect(logSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error while getting all categories",
            });
        });
    });

    describe("singleCategoryController (get one single category)", () => {
        it("Returns 200 with category when found", async () => {
            const doc = mockCategories[0];
            req.params.slug = doc.slug;
            categoryModel.findOne = jest.fn().mockResolvedValue(doc);

            await singleCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Get Single Category Successfully",
                category: doc,
            });
        });

        it("Returns 404 when category not found", async () => {
            req.params.slug = "category999";
            categoryModel.findOne = jest.fn().mockResolvedValue(null);

            await singleCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "category999" });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Category not found",
            });
        });

        it("Returns 500 when handling error", async () => {
            const error = new Error("Some Error");
            const doc = mockCategories[0];
            req.params.slug = doc.slug;
            categoryModel.findOne.mockRejectedValueOnce(error);

            await singleCategoryController(req, res);

            expect(logSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error while getting Single Category",
            });
        });
    });
});