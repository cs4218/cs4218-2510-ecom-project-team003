import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';
import mockRequestResponse from '../testUtils/requests.js';
import braintree from 'braintree';
import * as z from 'zod';
import {
  getProductController,
  getSingleProductController,
  updateProductController,
  deleteProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
  braintreeTokenController,
  braintreePaymentController,
  buildProductFiltersArgs,
  productFiltersSchema,
  createProductController
} from './productController.js';
import * as productController from './productController.js';
import { expectDatabaseError, mockModel } from '../testUtils/database.js';
import fs from 'fs';

const ELECTRONICS = {
  '_id': '1',
  'name': 'Electronics',
  'slug': 'electronics',
};


const LAPTOP = {
  '_id': '1',
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
  'category': ELECTRONICS,
  'photo': {
    'data': 'Laptop image data',
    'contentType': 'image/jpeg',
  },
};

const SMARTPHONE = {
  '_id': '2',
  'name': 'Smartphone',
  'slug': 'smartphone',
  'description': 'A high-end smartphone',
  'price': 999.99,
  'quantity': 50,
  'category': ELECTRONICS,
  'photo': {
    'data': 'Smartphone image data',
    'contentType': 'image/png',
  },
};


const LAPTOP_CREATE = {
  fields: { name: "foo", description: "desc", price: 10, category: "cat", quantity: 1 },
  files: {photo: {
      size: 1,
      path: "fakepath",
      type: "image/png"
    }
  },
}

const LAPTOP_UPDATE = {
  ...LAPTOP_CREATE,
  params: { pid: LAPTOP._id },
}

jest.mock('../models/productModel.js');

jest.mock("../models/orderModel.js");


jest.mock('braintree', () => {
  const mockGateway = {
    clientToken: {
      generate: jest.fn()
    },
    transaction: {
      sale: jest.fn()
    }
  };
  return {
    BraintreeGateway: jest.fn(() => mockGateway),
    Environment: {
      Sandbox: 'Sandbox'
    }
  };
});

jest.mock('axios');

jest.mock("fs");

const fakeGateway = braintree.BraintreeGateway();

const mockProductModel = (overrides = {}) => {
  const methods = {
    // Reads
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),

    // Creates
    create: jest.fn(),
    save: jest.fn(), // used on document instances

    // Updates
    findByIdAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),

    // Deletes
    findByIdAndDelete: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),

    ...overrides,
  };

  Object.assign(productModel, methods);

  return methods; // return mocks so tests can inspect them
};

// const mockGateway = (overrides = {}) => {
//   clientToken: {
//     generate: jest.fn(),
//   }
// };

console.log = jest.fn();


describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("createProductController", () => {
    beforeEach(() => {
      fs.readFileSync.mockReturnValue('fakeimagedata');
    })
    it("should return 400 if name is missing", async () => {
      const no_name = {
        ...LAPTOP_CREATE,
        fields: { ...LAPTOP_CREATE.fields }, // ensure nested copy
      };
      delete no_name.fields.name;
      const [_, res] = mockRequestResponse(no_name);
      await createProductController(no_name, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is required" });
    });

    it("should return 400 if description is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", price: 10, category: "cat", quantity: 1 };
      req.files = {photo: {
          size: 1,
          path: "fakepath",
          type: "image/png"
        }
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is required" });
    });

    it("should return 400 if price is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });

      req.fields = { name: "name", description: "desc", category: "cat", quantity: 1};
      req.files = {photo: {
          size: 1,
          path: "fakepath",
          type: "image/png"
        }
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is required" });
    });

    it("should return 400 if price is zero", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: -1, category: "cat", quantity: 1};
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Price must be positive" });
    });

    it("should return 400 if category is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: 10, quantity: 1 };
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is required" });
    });

    it("should return 400 if quantity is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: 10, category: "cat"};
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is required" });
    });

    it("should return 400 if quantity is negative", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: 10, category: "cat", quantity: -1};
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity must be non-negative" });
    });

    it("should save product and return 201 on success", async () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue('fakeimagedata');
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
        save: jest.fn().mockResolvedValue({}),
      });
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

    it("should return 400 if photo is too big", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      req.fields = { name: "Book", description: "Nice", price: 100, category: "cat", quantity: 2 };
      req.files = {
        photo: {
          size: 2000000,  // 2 MB
          path: "fakepath",
          type: "image/png"
        }
      };
      await createProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringMatching(/too big|(?=.*less than)(?=.*1mb)/i),
          })
      );
    });

    it("should handle photo upload", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      req.fields = { name: "Book", description: "Nice", price: 100, category: "cat", quantity: 2 };
      req.files = {}
      req.files.photo = { path: "somepath", type: "image/png" };

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

  describe('getProductController', () => {
    it('should return 200 with a list of products', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockResolvedValue('sort', [LAPTOP, SMARTPHONE]);

      await getProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        countTotal: 2,
        message: expect.any(String),
        products: expect.arrayContaining([
          expect.objectContaining({ name: LAPTOP.name }),
          expect.objectContaining({ name: SMARTPHONE.name }),
        ])
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockDatabaseFailure('sort');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await getProductController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('getSingleProductController', () => {
    it('should return 200 with a single product', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.slug } });
      mockModel(productModel).mockResolvedValue('populate', LAPTOP);

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        product: LAPTOP,
      }));
    });

    it('should return 400 without product slug', async () => {
      const [req, res] = mockRequestResponse({ params: {} });

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.slug } });
      mockModel(productModel).mockResolvedValue('populate', null);

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.slug } });
      mockModel(productModel).mockDatabaseFailure('populate');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await getSingleProductController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe("updateProductController", () => {
    beforeEach(() => {
      fs.readFileSync.mockReturnValue('fakeimagedata');
    });

    it("should update the corresponding product", async () => {
      const [_, res] = mockRequestResponse(LAPTOP_UPDATE.params);
      mockProductModel({
        findByIdAndUpdate: jest.fn().mockReturnValue({
          photo: { data: 'data', contentType: 'image/png' },
          save: jest.fn().mockResolvedValue({}),
        }),
      })

      await updateProductController(LAPTOP_UPDATE, res);

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          LAPTOP_UPDATE.params.pid,
          expect.objectContaining({
            name: LAPTOP_UPDATE.fields.name,
            description: LAPTOP_UPDATE.fields.description,
            price: LAPTOP_UPDATE.fields.price,
            category: LAPTOP_UPDATE.fields.category,
            quantity: LAPTOP_UPDATE.fields.quantity,
            // slug is passed in, but we don't care about its value
          }),
          { new: true }
      );
    });

    it("should return 200 with success message on successful update", async () => {
      const [_, res] = mockRequestResponse(LAPTOP_UPDATE.params);
      mockProductModel({
        findByIdAndUpdate: jest.fn().mockReturnValue({
            photo: { data: 'data', contentType: 'image/png' },
            save: jest.fn().mockResolvedValue({}),
        }),
      })

      await updateProductController(LAPTOP_UPDATE, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: expect.stringMatching(/(?=.*update)(?=.*success)/i)
      }));
    });

    it("should handle errors and return 500", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
      jest.spyOn(console, 'log').mockImplementation(); // suppress console output
      const err = new Error("DB failure");
      productModel.findByIdAndUpdate.mockImplementation(() => {
        throw err;
      });

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: expect.stringMatching(/(?=.*error)(?=.*updat)/i), // "updat" to match "update" or "updating"
            error: expect.any(Error)
          })
      );
    });

    it("should console.log the error when update fails", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
      const spy = jest.spyOn(console, 'log').mockImplementation(); // suppress console output
      const err = new Error("DB failure");
      productModel.findByIdAndUpdate.mockImplementation(() => {
        throw err;
      });

      await updateProductController(req, res);
      expect(spy).toHaveBeenCalledWith(expect.any(Error));
    })
  });

  describe("deleteProductController", () => {

    it("should delete the corresponding product", async () => {
      let [req, res] = mockRequestResponse({pid: "fake-id"});
      req.params.pid = "fake-id"; // usually mockRequestResponse should handle this but this is just in case
      const mockSelect = jest.fn().mockResolvedValue({});
      productModel.findByIdAndDelete.mockReturnValue({ select: mockSelect });
      await deleteProductController(req, res);
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith("fake-id");
    });

    it("should return 200 with success message on successful deletion", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
      const mockSelect = jest.fn().mockResolvedValue({});
      productModel.findByIdAndDelete.mockReturnValue({ select: mockSelect });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
          success: true,
          message: expect.stringMatching(/(?=.*delete)(?=.*success)/i)
      }));
    })

    it("should handle errors and return 500", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
      jest.spyOn(console, 'log').mockImplementation(); // suppress console output
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

    it("should console.log the error when deletion fails", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
      const spy = jest.spyOn(console, 'log').mockImplementation(); // suppress console output
      productModel.findByIdAndDelete.mockImplementation(() => {
        throw new Error("DB failure");
      });

      await deleteProductController(req, res);

      expect(spy).toHaveBeenCalledWith(expect.any(Error));
    })
  });

  describe('productPhotoController', () => {
    it('should return 200 with product photo data', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', LAPTOP);

      await productPhotoController(req, res);
      expect(res.set).toHaveBeenCalledWith('Content-type', LAPTOP.photo.contentType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(LAPTOP.photo.data);
    });

    it('should return 400 without product id', async () => {
      const [req, res] = mockRequestResponse({ params: {} });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', null);

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 404 with photo not found', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', { photo: null });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockDatabaseFailure('select');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productPhotoController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('productFiltersSchema', () => {
    it('should use default schema', () => {
      const result = productFiltersSchema.safeParse({});
      expect(result.success).toEqual(true);
      expect(result.data).toEqual(expect.objectContaining({
        checked: [], radio: [],
      }));
    });

    it('should accept radio array of length 0', () => {
      const result = productFiltersSchema.safeParse({radio: []});
      expect(result.success).toEqual(true);
    });

    it('should accept radio array of length 2', () => {
      const result = productFiltersSchema.safeParse({radio: [0, 100]});
      expect(result.success).toEqual(true);
    });

    it('should reject radio array of length 1', () => {
      const result = productFiltersSchema.safeParse({radio: [1]});
      expect(result.success).toEqual(false);
    });

    it('should reject radio array of length > 2', () => {
      const result = productFiltersSchema.safeParse({radio: [1, 2, 3]});
      expect(result.success).toEqual(false);
    });

    it('should reject radio array of wrong type', () => {
      const result = productFiltersSchema.safeParse({radio: ['1', '2']});
      expect(result.success).toEqual(false);
    });

    it('should accept valid checked array of strings', () => {
      const result = productFiltersSchema.safeParse({checked: ['cat1', 'cat2']});
      expect(result.success).toEqual(true);
    });

    it('should reject checked if not array', () => {
      const result = productFiltersSchema.safeParse({checked: 'cat1'});
      expect(result.success).toEqual(false);
    });
  });

  describe('buildProductFiltersArgs', () => {
    it('should return empty object when both are empty', () => {
      expect(buildProductFiltersArgs([], [])).toEqual({});
    });

    it('should return category filter when checked is non-empty', () => {
      const categories = ['cat1', 'cat2']
      const result = buildProductFiltersArgs(categories, []);
      expect(result.category).toEqual(expect.arrayContaining(categories));
      expect(result.category.length).toEqual(2);
    });

    it('should return price filter when radio has two values', () => {
      expect(buildProductFiltersArgs([], [500, 1500])).toEqual({
        price: { $gte: 500, $lte: 1500 },
      });
    });
  });

  describe('productFiltersController', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(productFiltersSchema, 'safeParse');
      jest.spyOn(z, 'treeifyError');
      jest.spyOn(productController, 'buildProductFiltersArgs');
    });

    it('should return 200 with filtered products', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 1500] };
      const [req, res] = mockRequestResponse({ body });
      productFiltersSchema.safeParse.mockReturnValue({ success: true, data: body });
      buildProductFiltersArgs.mockReturnValue({
        category: [LAPTOP.category._id],
        price: { $gte: 500, $lte: 1500 },
      });
      mockModel(productModel).mockResolvedValue('select', [LAPTOP, SMARTPHONE]);

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        products: [LAPTOP, SMARTPHONE],
      }));
    });

    it('should return 400 upon invalid request', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 'non-numeric'] };
      const [req, res] = mockRequestResponse({ body });
      productFiltersSchema.safeParse.mockReturnValue({ success: false, error: 'Invalid request' });

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
        error: expect.anything(),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 1500] };
      const [req, res] = mockRequestResponse({ body });
      productFiltersSchema.safeParse.mockReturnValue({ success: true, data: body });
      buildProductFiltersArgs.mockReturnValue({
        category: [LAPTOP.category._id],
        price: { $gte: 500, $lte: 1500 },
      });
      mockModel(productModel).mockDatabaseFailure('select');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productFiltersController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('productCountController', () => {
    it('should return 200 with total product count', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockResolvedValue('estimatedDocumentCount', 42);

      await productCountController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        total: 42,
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockDatabaseFailure('estimatedDocumentCount');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productCountController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('productListController', () => {
    it('should return 200 with a list of products for valid page', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 1 } });
      mockModel(productModel).mockResolvedValue('sort', [LAPTOP]);

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        products: [LAPTOP],
      }));
    });

    it('should return 200 with a list of products for default page', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockResolvedValue('sort', [LAPTOP]);

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        products: [LAPTOP],
      }));
    });

    it('should return 400 for page number less than or equal to 0', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 0 } });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 400 for non-numeric page', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 'abc' } });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 1 } });
      mockModel(productModel).mockDatabaseFailure('sort');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productListController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('searchProductController', () => {
    it('should return 200 with search results', async () => {
      const [req, res] = mockRequestResponse({ params: { keyword: 'laptop' } });
      mockModel(productModel).mockResolvedValue('select', [LAPTOP]);

      await searchProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([LAPTOP]);
    });

    it('should return 400 without keyword', async () => {
      const [req, res] = mockRequestResponse({ params: {} });

      await searchProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 400 with whitespace keyword', async () => {
      const [req, res] = mockRequestResponse({ params: { keyword: '  ' } });

      await searchProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ params: { keyword: 'laptop' } });
      mockModel(productModel).mockDatabaseFailure('select');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await searchProductController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('relatedProductController', () => {
    it('should return 200 with related products', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id, cid: LAPTOP.category._id } });
      mockModel(productModel).mockResolvedValue('populate', [SMARTPHONE]);

      await relatedProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        products: [SMARTPHONE],
      }));
    });

    it('should return 400 without product id', async () => {
      const [req, res] = mockRequestResponse({ params: { cid: LAPTOP.category._id } });

      await relatedProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 400 without category id', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });

      await relatedProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id, cid: LAPTOP.category._id } });
      mockModel(productModel).mockDatabaseFailure('populate');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await relatedProductController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });

  describe('productCategoryController', () => {
    it('should return 200 with products in category', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.category.slug } });
      mockModel(categoryModel).mockResolvedValue('findOne', LAPTOP.category);
      mockModel(productModel).mockResolvedValue('populate', [LAPTOP, SMARTPHONE]);

      await productCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.any(String),
        category: LAPTOP.category,
        products: [LAPTOP, SMARTPHONE],
      }));
    });

    it('should return 400 without category slug', async () => {
      const [req, res] = mockRequestResponse({ params: {} });

      await productCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 404 with category not found', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.category.slug } });
      mockModel(categoryModel).mockResolvedValue('findOne', null);

      await productCategoryController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.any(String),
      }));
    });

    it('should return 500 upon database failure in categoryModel', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.category.slug } });
      mockModel(categoryModel).mockDatabaseFailure('findOne');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productCategoryController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });

    it('should return 500 upon database failure in productModel', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.category.slug } });
      mockModel(categoryModel).mockResolvedValue('findOne', LAPTOP.category);
      mockModel(productModel).mockDatabaseFailure('populate');
      const spy = jest.spyOn(console, 'log').mockImplementation();

      await productCategoryController(req, res);

      expectDatabaseError(res, spy);

      spy.mockRestore();
    });
  });
});