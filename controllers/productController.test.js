import productModel from '../models/productModel.js';
import mockModel from '../testUtils/mockModel.js';
import mockRequestResponse from '../testUtils/mockRequestResponse.js';
import { testDatabaseError, testDatabaseLogError } from '../testUtils/testDatabaseError.js';
import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productListController
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

jest.mock('braintree');

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
      await testDatabaseError(getProductController, productModel, 'sort');
    });

    it('should log the error upon database failure', async () => {
      await testDatabaseLogError(getProductController, productModel, 'sort');
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

    it('should return 500 upon database failure', async () => {
      await testDatabaseError(getSingleProductController, productModel, 'populate', { slug: LAPTOP.slug });
    });

    it('should log the error upon database failure', async () => {
      await testDatabaseLogError(getSingleProductController, productModel, 'populate', { slug: LAPTOP.slug });
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

    it('should return 500 upon database failure', async () => {
      await testDatabaseError(productPhotoController, productModel, 'select', { pid: LAPTOP._id });
    });

    it('should log the error upon database failure', async () => {
      await testDatabaseLogError(productPhotoController, productModel, 'select', { pid: LAPTOP._id });
    });
  });

  describe('productListController', () => {
    it('should return 200 with a list of products for valid', async () => {
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

    it('should return 500 upon database failure', async () => {
      await testDatabaseError(productListController, productModel, 'sort', { page: 1 });
    });

    it('should log the error upon database failure', async () => {
      await testDatabaseLogError(productListController, productModel, 'sort', { page: 1 });
    });
  });
});