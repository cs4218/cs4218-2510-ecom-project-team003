import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import orderModel from '../models/orderModel.js';
import mockRequestResponse from '../testUtils/requests.js';
import braintree from 'braintree';
import * as z from 'zod';
import {
  getProductController,
  getSingleProductController,
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
  productFiltersSchema
} from './productController.js';
import * as productController from './productController.js';
import { expectDatabaseError, mockModel } from '../testUtils/database.js';

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

jest.mock('../models/orderModel.js');

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

const fakeGateway = braintree.BraintreeGateway();

console.log = jest.fn();

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        product: LAPTOP,
      });
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ params: { slug: LAPTOP.slug } });
      mockModel(productModel).mockResolvedValue('populate', null);

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
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

  describe('productPhotoController', () => {
    it('should return 200 with product photo data', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', LAPTOP);

      await productPhotoController(req, res);
      expect(res.set).toHaveBeenCalledWith('Content-type', LAPTOP.photo.contentType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(LAPTOP.photo.data);
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', null);

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should return 404 with photo not found', async () => {
      const [req, res] = mockRequestResponse({ params: { pid: LAPTOP._id } });
      mockModel(productModel).mockResolvedValue('select', { photo: null });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
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
    })

    it('should return 200 with filtered products', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 1500] };
      const [req, res] = mockRequestResponse({ body });
      productFiltersSchema.safeParse.mockReturnValue({ success: true, data: body });
      buildProductFiltersArgs.mockReturnValue({
        category: [LAPTOP.category._id],
        price: { $gte: 500, $lte: 1500 },
      })
      mockModel(productModel).mockResolvedValue('find', [LAPTOP, SMARTPHONE]);

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [LAPTOP, SMARTPHONE],
      });
    });

    it('should return 400 upon invalid request', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 'non-numeric'] };
      const [req, res] = mockRequestResponse({ body });
      productFiltersSchema.safeParse.mockReturnValue({ success: false, error: 'Invalid request' });

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
        error: expect.anything(),
      });
    });

    it('should return 500 upon database failure', async () => {
      const body = { checked: [LAPTOP.category._id], radio: [500, 1500] };
      const [req, res] = mockRequestResponse({body});
      productFiltersSchema.safeParse.mockReturnValue({ success: true, data: body });
      buildProductFiltersArgs.mockReturnValue({
        category: [LAPTOP.category._id],
        price: { $gte: 500, $lte: 1500 },
      });
      mockModel(productModel).mockDatabaseFailure('find');
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
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: 42,
      });
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
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [LAPTOP],
      });
    });

    it('should return 200 with a list of products for default page', async () => {
      const [req, res] = mockRequestResponse();
      mockModel(productModel).mockResolvedValue('sort', [LAPTOP]);

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [LAPTOP],
      });
    });

    it('should return 400 for page number less than or equal to 0', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 0 } });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should return 400 for non-numeric page', async () => {
      const [req, res] = mockRequestResponse({ params: { page: 'abc' } });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
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
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: [SMARTPHONE],
      });
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
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: LAPTOP.category,
        products: [LAPTOP, SMARTPHONE],
      });
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