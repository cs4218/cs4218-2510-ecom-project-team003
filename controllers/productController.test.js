import {
  createProductController,
  getProductController,
} from "../controllers/productController.js";

import productModel from "../models/productModel.js";
import fs from "fs";

// Mock dependencies
jest.mock("../models/productModel.js");
jest.mock("fs");

describe("Product Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      fields: {},
      files: {},
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      json: jest.fn(),
      set: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe("createProductController", () => {
    it("should return 500 if name is missing", async () => {
      req.fields = { description: "desc", price: 10, category: "cat", quantity: 1 };
      
      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return 500 if description is missing", async () => {
      req.fields = { name: "name", description: "", price: 10, category: "cat", quantity: 1 };
      
      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
    });
    
    it("should return 500 if price is missing", async () => {
      req.fields = { name: "name", description: "desc", price: 0, category: "cat", quantity: 1 };
      
      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    it("should return 500 if category is missing", async () => {
      req.fields = { name: "name", description: "desc", price: 10, category: "", quantity: 1 };
      
      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    it("should return 500 if quantity is missing", async () => {
      req.fields = { name: "name", description: "desc", price: 10, category: "cat", quantity: 0 };
      
      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    });

    it("should save product and return 201 on success", async () => {
      req.fields = { name: "Book", description: "Nice", price: 100, category: "cat", quantity: 2 };
      req.files = {}; // no photo

      const mockSave = jest.fn().mockResolvedValue({});
      productModel.mockImplementation(() => ({ save: mockSave }));

      await createProductController(req, res);

      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully"
        })
      );
    });

    it("should return 500 if photo is too big", async () => {
      req.fields = { name: "Book", description: "Nice", price: 100, category: "cat", quantity: 2 };
      req.files = {
        photo: { 
          size: 2000000,  // 2 MB
          path: "fakepath", 
          type: "image/png" 
        }
      };
      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "photo is Required and should be less then 1mb" });
    });

    it("should handle photo upload", async () => {
      req.fields = { name: "Book", description: "Nice", price: 100, category: "cat", quantity: 2 };
      req.files.photo = { path: "somepath", type: "image/png" };

      fs.readFileSync.mockReturnValue("fake-binary");

      const mockSave = jest.fn().mockResolvedValue({});
      productModel.mockImplementation(() => ({ 
        save: mockSave,
        photo: {}
      }));

      await createProductController(req, res);

      expect(fs.readFileSync).toHaveBeenCalledWith("somepath");
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getProductController", () => {
    it("should return products list", async () => {
      const mockFind = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ name: "Book1" }, { name: "Book2" }])
      };
      productModel.find.mockReturnValue(mockFind);

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        products: [{ name: "Book1" }, { name: "Book2" }]
      }));
    });
  });
});
