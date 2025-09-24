import productModel from '../models/productModel.js';
import orderModel from '../models/orderModel.js';
import mockModel from '../testUtils/mockModel.js';
import mockRequestResponse from '../testUtils/mockRequestResponse.js';
import { testDatabaseError } from '../testUtils/testDatabaseError.js';
import braintree from 'braintree';
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productListController,
  braintreeTokenController,
  braintreePaymentController
} from './productController.js';

const LAPTOP = {
  '_id': '1',
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
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
  'photo': {
    'data': 'Smartphone image data',
    'contentType': 'image/png',
  },
};

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

    it('should properly handle database failure', async () => {
      await testDatabaseError(getProductController, productModel, 'sort');
    });
  });

  describe('getSingleProductController', () => {
    it('should return 200 with a single product', async () => {
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
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
      const [req, res] = mockRequestResponse({ slug: LAPTOP.slug });
      mockModel(productModel).mockResolvedValue('populate', null);

      await getSingleProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should properly handle database failure', async () => {
      await testDatabaseError(getSingleProductController, productModel, 'populate', { slug: LAPTOP.slug });
    });
  });

  describe('productPhotoController', () => {
    it('should return 200 with product photo data', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockModel(productModel).mockResolvedValue('select', LAPTOP);

      await productPhotoController(req, res);
      expect(res.set).toHaveBeenCalledWith('Content-type', LAPTOP.photo.contentType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(LAPTOP.photo.data);
    });

    it('should return 404 with product not found', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockModel(productModel).mockResolvedValue('select', null);

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should return 404 with photo not found', async () => {
      const [req, res] = mockRequestResponse({ pid: LAPTOP._id });
      mockModel(productModel).mockResolvedValue('select', { photo: null });

      await productPhotoController(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should properly handle database failure', async () => {
      await testDatabaseError(productPhotoController, productModel, 'select', { pid: LAPTOP._id });
    });
  });

  describe('productListController', () => {
    it('should return 200 with a list of products for valid page', async () => {
      const [req, res] = mockRequestResponse({ page: 1 });
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
      const [req, res] = mockRequestResponse({ page: 0 });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should return 400 for non-numeric page', async () => {
      const [req, res] = mockRequestResponse({ page: 'abc' });

      await productListController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.any(String),
      });
    });

    it('should properly handle database failure', async () => {
      await testDatabaseError(productListController, productModel, 'sort', { page: 1 });
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