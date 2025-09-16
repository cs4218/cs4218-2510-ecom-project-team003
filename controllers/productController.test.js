import productModel from "../models/productModel.js";
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productListController
} from "./productController.js";

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

jest.mock('../models/productModel.js');

jest.mock('braintree');

const mockProductModel = (overrides = {}) => {
  const methods = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    ...overrides,
  };
  Object.keys(methods).forEach((key) => {
    productModel[key] = methods[key];
  });
};

const mockRequestResponse = (params = {}) => {
  const req = { params };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
    set: jest.fn(),
  };
  return [req, res];
}

describe('Product Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});