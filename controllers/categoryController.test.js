import {expect, jest} from "@jest/globals";
import {
    categoryController,
    createCategoryController,
    singleCategoryController,
    updateCategoryController
} from "./categoryController.js";
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

        it("Returns 200 with empty list when category list not found", async () => {
            categoryModel.find = jest.fn().mockResolvedValueOnce([]);

            await categoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
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
            categoryModel.findOne = jest.fn().mockRejectedValue(error);

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

    describe("Category Controllers Create operations", () => {
        // Add tests for createCategoryController here
        it("Accepts non-repeated category and returns 201", async () => {
            const newCategory = { name: "NewCategory" };
            req.body = newCategory;
            categoryModel.findOne = jest.fn().mockResolvedValue(null);
            categoryModel.prototype.save = jest.fn().mockResolvedValue({ ...newCategory, slug: "newcategory" });

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "NewCategory" });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "New Category Created",
                category: { ...newCategory, slug: "newcategory" },
            });
        })

        it("Rejects repeated category and returns 409", async () => {
            const newCategory = { name: "Category1" };
            req.body = newCategory;
            categoryModel.findOne = jest.fn().mockResolvedValue(newCategory);

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Category1" });
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Category Already Exists",
            });
        });

        it("Returns 500 when handling error", async () => {
            const error = new Error("Some Error");
            req.body = {name: "NewCategory"};
            categoryModel.findOne = jest.fn().mockRejectedValue(error);

            await createCategoryController(req, res);

            expect(logSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error in Category Creation",
            });
        });
    });

    describe("Category Controllers Update operations", () => {
        it("Updates existing category in DB", async () => {
           req.body = {name: "UpdatedCategory"};
           req.params.id = "12345";
           categoryModel.findByIdAndUpdate = jest.fn();

           await updateCategoryController(req, res);

           expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
               "12345",
               { name: "UpdatedCategory", slug: "UpdatedCategory" },
               { new: true }
           );
        });

        it("Returns 200 when update is successful", async () => {
          req.body = {name: "UpdatedCategory"};
          req.params.id = "12345";
          categoryModel.findByIdAndUpdate = jest.fn();

          await updateCategoryController(req, res);

          expect(res.status).toHaveBeenCalledWith(200);
        });

        it("Expects DB to return updated category", async () => {
            const updatedCategory = { name: "UpdatedCategory", slug: "updatedcategory" };
            req.body = {name: "UpdatedCategory"};
            req.params.id = "12345";
            categoryModel.findByIdAndUpdate = jest.fn().mockResolvedValue(updatedCategory);

            await updateCategoryController(req, res);

            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category Updated Successfully",
                category: updatedCategory,
            });
        });

        it("Returns 500 when handling error", async () => {
            const error = new Error("Some Error");
            req.body = {name: "UpdatedCategory"};
            req.params.id = "12345";
            categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

            await updateCategoryController(req, res);

            expect(logSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
        });

        it("Sends error message when handling error", async () => {
            const error = new Error("Some Error");
            req.body = {name: "UpdatedCategory"};
            req.params.id = "12345";
            categoryModel.findByIdAndUpdate = jest.fn().mockRejectedValue(error);

            await updateCategoryController(req, res);

            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error: error,
                message: "Error while updating category",
            });
        });
    });
});

