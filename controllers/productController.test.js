import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController
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
      expect(res.send).toHaveBeenCalledWith({ error: "Photo is required and should be less then 1Mb" });
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

  describe("getSingleProductController", () => {
    it("should return single product", async () => {
      req.params.slug = "book-slug";

      const fakeProduct = { name: "Book", slug: "book-slug" };
      const mockPopulate = jest.fn().mockResolvedValue(fakeProduct);
      const mockSelect = jest.fn().mockReturnValue({ populate: mockPopulate }); 
      productModel.findOne.mockReturnValue({ select: mockSelect });

      await getSingleProductController(req, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "book-slug" });
      expect(mockSelect).toHaveBeenCalledWith("-photo");
      expect(mockPopulate).toHaveBeenCalledWith("category");

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: fakeProduct,
      });

    });

    it("should catch errors otherwise(?)", async () => {
      req.params.slug = "bad-slug";

      const fakeError = new Error("Database error");
      productModel.findOne.mockImplementation(() => {
        throw fakeError;
      });

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getitng single product",
        error: fakeError,
      });
    })
  });

  describe("productPhotoController", () => {
    it("should return photo data with correct content type", async () => {
      req.params.pid = "123";
      const fakePhoto = {
        data: Buffer.from("fake image data"),
        contentType: "image/png"
      };

      productModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue({ photo: fakePhoto })
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith("123");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/png");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(fakePhoto.data);
    });

    it("should handle errors", async () => {
      productModel.findById.mockImplementation(() => {
        throw new Error("DB failure");
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo", // keep same typo as your code
          error: expect.any(Error)
        })
      );
    });
  });

  describe("deleteProductController", () => {
    
    it("should delete a product and return 200 on success", async () => {
      req = { params: { pid: "fake-id" } };
      const mockSelect = jest.fn().mockResolvedValue({});
      productModel.findByIdAndDelete.mockReturnValue({ select: mockSelect });

      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("fake-id");
      expect(mockSelect).toHaveBeenCalledWith("-photo");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Product Deleted successfully"
      });
    });

    it("should handle errors and return 500", async () => {
      productModel.findByIdAndDelete.mockImplementation(() => {
        throw new Error("DB failure");
      });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while deleting product",
          error: expect.any(Error)
        })
      );
    });
  });
});

