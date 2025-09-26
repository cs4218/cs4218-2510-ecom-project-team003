import {expect, jest} from "@jest/globals";
import productModel from "../models/productModel.js";
import orderModel from "../models/orderModel.js";
import braintree from "braintree";
import {
  braintreePaymentController,
  braintreeTokenController,
  createProductController, deleteProductController,
  getProductController,
  getSingleProductController,
  productListController,
  productPhotoController, updateProductController
} from "./productController.js";
import {beforeEach, describe} from "node:test";
import fs from "fs";

const LAPTOP = {
  "_id": "1",
  "name": "Laptop",
  "slug": "laptop",
  "description": "A powerful laptop",
  "price": 1499.99,
  "photo": {
    "data": "Laptop image data",
    "contentType": "image/jpeg",
  },
};

const SMARTPHONE = {
  "_id": "2",
  "name": "Smartphone",
  "slug": "smartphone",
  "description": "A high-end smartphone",
  "price": 999.99,
  "quantity": 50,
  "photo": {
    "data": "Smartphone image data",
    "contentType": "image/png",
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

const mockRequestResponse = (params = {}) => {
  const req = { params };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    set: jest.fn(),
    json: jest.fn(),
  };
  return [req, res];
}

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("createProductController", () => {
    beforeEach(() => {
      fs.readFileSync.mockReturnValue('fakeimagedata');
    })
    it("should return 500 if name is missing", async () => {
      const no_name = {
        ...LAPTOP_CREATE,
        fields: { ...LAPTOP_CREATE.fields }, // ensure nested copy
      };
      delete no_name.fields.name;
      const [_, res] = mockRequestResponse(no_name);
      await createProductController(no_name, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return 500 if description is missing", async () => {
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

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Description is Required" });
    });

    it("should return 500 if price is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });

      req.fields = { name: "name", description: "desc", category: "cat", quantity: 1};
      req.files = {photo: {
          size: 1,
          path: "fakepath",
          type: "image/png"
        }
      };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    it("should return 500 if category is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: 10, quantity: 1 };
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    it("should return 500 if quantity is missing", async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });
      req.fields = { name: "name", description: "desc", price: 10, category: "cat"};
      req.files = { photo: jest.fn() };

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
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

    it("should return 500 if photo is too big", async () => {
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
      expect(res.status).toHaveBeenCalledWith(500);
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
      mockProductModel({
        sort: jest.fn().mockResolvedValueOnce([LAPTOP, SMARTPHONE]),
      });

      await getProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: 2,
        message: "All Products",
        products: [LAPTOP, SMARTPHONE],
      });
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse();
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = new Error('Database error');
      mockProductModel({
        sort: jest.fn().mockRejectedValue(err),
      });

      await getProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: 'Database error',
      });
      expect(spy).toHaveBeenCalledWith(err);

      spy.mockRestore();
    });
  });

  describe('getSingleProductController', () => {
    it('should return 200 with a single product', async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(LAPTOP),
      });

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single product fetched",
        product: LAPTOP,
      });
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockProductModel({
        populate: jest.fn().mockResolvedValueOnce(null),
      });

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = new Error('Database error');
      mockProductModel({
        populate: jest.fn().mockRejectedValue(err),
      });

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error while getting single product',
        error: 'Database error',
      });
      expect(spy).toHaveBeenCalledWith(err);

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
  });

  describe("deleteProductController", () => {

    it("should delete the corresponding product", async () => {
      const [req, res] = mockRequestResponse({ pid: "fake-id" });
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
      const spy = jest.spyOn(console, 'log').mockImplementation(); // suppress console output
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

  describe('productPhotoController', () => {
    it('should return 200 with product photo data', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockProductModel({
        select: jest.fn().mockResolvedValueOnce(LAPTOP),
      });

      await productPhotoController(req, res);
      expect(res.set).toHaveBeenCalledWith("Content-type", LAPTOP.photo.contentType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(LAPTOP.photo.data);
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockProductModel({
        select: jest.fn().mockResolvedValueOnce(null),
      });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found',
      });
    });

    it('should return 404 with photo not found', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockProductModel({
        select: jest.fn().mockResolvedValueOnce({ photo: null }),
      });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Photo not found',
      });
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = new Error('Database error');
      mockProductModel({
        select: jest.fn().mockRejectedValue(err),
      });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error while getting photo',
        error: 'Database error',
      });
      expect(spy).toHaveBeenCalledWith(err);
      spy.mockRestore();
    });

  });

  describe('productListController', () => {
    it('should return 200 with a list of products for page 1', async () => {
      const [req, res] = mockRequestResponse({ page: 1 });
      mockProductModel({
        sort: jest.fn().mockResolvedValueOnce([LAPTOP]),
      });

      await productListController(req, res);
      expect(productModel.skip).toHaveBeenCalledWith(0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [LAPTOP],
      });
    });

    it('should return 200 with a list of products for page 2', async () => {
      const [req, res] = mockRequestResponse({ page: 2 });
      mockProductModel({
        sort: jest.fn().mockResolvedValueOnce([SMARTPHONE]),
      });

      await productListController(req, res);
      expect(productModel.skip).toHaveBeenCalledWith(6);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [SMARTPHONE],
      });
    });

    it('should return 200 with a list of products for default page', async () => {
      const [req, res] = mockRequestResponse();
      mockProductModel({
        sort: jest.fn().mockResolvedValueOnce([LAPTOP]),
      });

      await productListController(req, res);
      expect(productModel.skip).toHaveBeenCalledWith(0);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [LAPTOP],
      });
    });

    it('should return 400 for page number less than 0', async () => {
      const [req, res] = mockRequestResponse({ page: -1 });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Page number must be number greater than 0',
      });
    });

    it('should return 400 for non-numeric page', async () => {
      const [req, res] = mockRequestResponse({ page: 'abc' });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Page number must be number greater than 0',
      });
    });

    it('should return 400 for page 0', async () => {
      const [req, res] = mockRequestResponse({ page: 0 });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Page number must be number greater than 0',
      });
    });

    it('should return 500 upon database failure', async () => {
      const [req, res] = mockRequestResponse({ page: 1 });
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const err = new Error('Database error');
      mockProductModel({
        sort: jest.fn().mockRejectedValue(err),
      });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: 'Error in per page control',
        error: 'Database error',
      });
      expect(spy).toHaveBeenCalledWith(err);

      spy.mockRestore();
    });
  });

  describe('braintreeTokencontroller', () => {
    it("should send token on success", async () => {
      const [req, res] = mockRequestResponse();
      const fakeToken = { clientToken: "123abc" };

      fakeGateway.clientToken.generate.mockImplementation((opts, cb) => cb(null, fakeToken));

      await braintreeTokenController(req, res);

      expect(fakeGateway.clientToken.generate).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(fakeToken);
    });

    it("should send 500 on error", async () => {
      const [req, res] = mockRequestResponse();
      const fakeError = { message: "Failed" };
    
      fakeGateway.clientToken.generate.mockImplementation((opts, cb) => cb(fakeError, null));

      await braintreeTokenController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(fakeError);
    });
  });

  describe('braintreePaymentController', () => {
    it("should return ok:true when transaction succeeds", async () => {
      const cart = [{ price: 100 }, { price: 50 }];
      const nonce = "fake-nonce";
      const fakeResult = { id: "txn123", status: "success" };

      // Mock sale to call callback with result
      fakeGateway.transaction.sale.mockImplementation((data, cb) => cb(null, fakeResult));

      const saveMock = jest.fn().mockResolvedValue({});
      orderModel.mockImplementation(() => ({ save: saveMock }));

      const [req, res] = mockRequestResponse()
      req.body = { nonce, cart };
      req.user = { _id: "user123" };

      await braintreePaymentController(req, res);

      expect(fakeGateway.transaction.sale).toHaveBeenCalledWith(
        {
          amount: 150, // sum of cart prices
          paymentMethodNonce: nonce,
          options: { submitForSettlement: true }
        },
        expect.any(Function)
      );

      expect(orderModel).toHaveBeenCalledWith({
        products: cart,
        payment: fakeResult,
        buyer: "user123"
      });
      expect(saveMock).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    it("should return 500 when transaction fails", async () => {
      const cart = [{ price: 200 }];
      const nonce = "fake-nonce";
      const fakeError = { message: "Transaction failed" };

      fakeGateway.transaction.sale.mockImplementation((data, cb) => cb(fakeError, null));

      const [req, res] = mockRequestResponse()
      req.body = { nonce, cart };
      req.user = { _id: "user123" };

        

      await braintreePaymentController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(fakeError);
    });
  });
});