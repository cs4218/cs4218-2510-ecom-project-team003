import request from 'supertest';
import app from '../server.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
import mongoose from 'mongoose';

const ELECTRONICS = {
  '_id': '66db427fdb0119d9234b27ed',
  'name': 'Electronics',
  'slug': 'electronics',
}

const BOOK = {
  '_id': '66db427fdb0119d9234b27ef',
  'name': 'Book',
  'slug': 'book',
}

const LAPTOP = {
  '_id': '68e3f943282387623f7361f3',
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
  'category': ELECTRONICS._id,
  'quantity': 30,
  'photo': {
    'data': Buffer.from('Laptop image data'),
    'contentType': 'image/jpeg',
  },
  'createdAt': '2024-10-07T12:11:04.440Z'
};

const SMARTPHONE = {
  '_id': '68e3f943102387623f7361f3',
  'name': 'Smartphone',
  'slug': 'smartphone',
  'description': 'A high-end and powerful smartphone',
  'price': 999.99,
  'category': ELECTRONICS._id,
  'quantity': 50,
  'photo': {
    'data': Buffer.from('Smartphone image data'),
    'contentType': 'image/png',
  },
  'createdAt': '2024-11-07T12:11:04.440Z'
};

const TEXTBOOK = {
  '_id': '66db427fdb0119d9234b27f1',
  'name': 'Textbook',
  'slug': 'textbook',
  'description': 'A comprehensive textbook',
  'price': 79.99,
  'category': BOOK._id,
  'quantity': 50,
  'photo': {
    'data': Buffer.from('Textbook image data'),
    'contentType': 'image/jpeg',
  },
  'createdAt': '2024-12-07T12:11:04.440Z'
};

console.log = jest.fn();

describe('Product Controller', () => {
  beforeAll(async () => {
    await createAndConnectTestDB();
    await clearTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  describe('GET /api/v1/product/get-product', () => {
    it('should return 200 with a list of products in decreasing creation', async () => {
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app).get('/api/v1/product/get-product');

      expect(res.status).toBe(200);
      expect(res.body.countTotal).toBe(3);
      const products = res.body.products;
      expect(products).toHaveLength(3);

      products.forEach(p => expect(p).not.toHaveProperty('photo'));
      products.forEach(p => expect(p.category).toHaveProperty('_id'));
      expect(products).toEqual(products.sort((a, b) => b.createdAt - a.createdAt));
    });

    it('should return 200 with empty list if no products exist', async () => {
      const res = await request(app).get('/api/v1/product/get-product');

      expect(res.status).toBe(200);
      expect(res.body.countTotal).toBe(0);
      expect(res.body.products).toHaveLength(0);
    });
  });

  describe('GET /api/v1/product/get-product/:slug', () => {
    it('should return 200 with a single product', async () => {
      await categoryModel.insertMany([ELECTRONICS]);
      await productModel.insertMany([SMARTPHONE]);

      const res = await request(app).get(`/api/v1/product/get-product/${SMARTPHONE.slug}`);

      expect(res.status).toBe(200);
      expect(res.body.product).toEqual(expect.objectContaining({ name: SMARTPHONE.name }));

      expect(res.body.product).not.toHaveProperty('photo');
      expect(res.body.product.category).toHaveProperty('_id');
    });

    it('should return 404 with product not found', async () => {
      await categoryModel.insertMany([ELECTRONICS]);
      await productModel.insertMany([LAPTOP]);

      const res = await request(app).get(`/api/v1/product/get-product/${SMARTPHONE.slug}`);

      expect(res.status).toBe(404);
      expect(res.body).not.toHaveProperty('product');
    });
  });

  describe('GET /api/v1/product-photo/:pid', () => {
    it('should return 200 with product photo data', async () => {
      await categoryModel.insertMany([ELECTRONICS]);
      await productModel.insertMany([LAPTOP]);

      const res = await request(app).get(`/api/v1/product/product-photo/${LAPTOP._id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(LAPTOP.photo.data);
    });

    it('should return 404 with product not found', async () => {
      const res = await request(app).get(`/api/v1/product/product-photo/${SMARTPHONE._id}`);

      expect(res.status).toBe(404);
    });

    it('should return 404 with photo not found', async () => {
      await categoryModel.insertMany([ELECTRONICS]);
      const laptopWithoutPhoto = { ...LAPTOP, photo: null };
      await productModel.insertMany([laptopWithoutPhoto]);

      const res = await request(app).get(`/api/v1/product/get-product/${laptopWithoutPhoto._id}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/v1/product/product-filters', () => {
    beforeEach(async () => {
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);
    });

    it('should return 200 with filtered products by category and price', async () => {
      const res = await request(app).post('/api/v1/product/product-filters').send({
        checked: [ELECTRONICS._id],
        radio: [1000, 1500],
      });

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: LAPTOP.name }),
      ]))

      res.body.products.forEach(p => expect(p).not.toHaveProperty('photo'));
    });

    it('should return 200 with filtered products by category', async () => {
      const res = await request(app).post('/api/v1/product/product-filters').send({ checked: [BOOK._id] });

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(1);
      expect(res.body.products).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: TEXTBOOK.name }),
      ]))
    });

    it('should return 200 with filtered products by price', async () => {
      const res = await request(app).post('/api/v1/product/product-filters').send({ radio: [50, 1000] });

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(2);
      expect(res.body.products).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SMARTPHONE.name }),
        expect.objectContaining({ name: TEXTBOOK.name }),
      ]));
    });

    it('should return 200 with products with no filters', async () => {
      const res = await request(app).post('/api/v1/product/product-filters');

      expect(res.status).toBe(200);
      expect(res.body.products).toHaveLength(3);
    });
  })

  describe('GET /api/v1/product/product-count', () => {
    it('should return 200 with product count', async () => {
      await categoryModel.insertMany([ELECTRONICS]);
      await productModel.insertMany([LAPTOP, SMARTPHONE]);

      const res = await request(app).get('/api/v1/product/product-count');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        success: true,
        message: expect.any(String),
        total: 2,
      }));
    });
  });

  describe('GET /api/v1/product/product-list/:page', () => {
    beforeEach(async () => {
      const laptops = Array.from({ length: 10 }, (_, i) => ({
        ...LAPTOP,
        _id: (new mongoose.Types.ObjectId()).toString(),
        name: `Laptop ${i + 1}`,
        slug: `laptop${i + 1}`,
        createdAt: new Date(2024, 0, 30 - i),
      }));
      await categoryModel.insertMany([ELECTRONICS]);
      await productModel.insertMany(laptops);
    });

    it('should return 200 with products on page 1', async () => {
      const res = await request(app).get('/api/v1/product/product-list/1');

      expect(res.status).toBe(200);
      const products = res.body.products;
      expect(products).toHaveLength(6);

      const slugs = products.map(p => p.slug);
      const expectedSlugs = Array.from({ length: 6 }, (_, i) => `laptop${i + 1}`);
      expect(slugs).toEqual(expectedSlugs);

      products.forEach(p => expect(p).not.toHaveProperty('photo'));
    });

    it('should return 200 with products on page 2', async () => {
      const res = await request(app).get('/api/v1/product/product-list/2');

      expect(res.status).toBe(200);
      const products = res.body.products;
      expect(products).toHaveLength(4);

      const slugs = products.map(p => p.slug);
      const expectedSlugs = Array.from({ length: 4 }, (_, i) => `laptop${i + 7}`);
      expect(slugs).toEqual(expectedSlugs);

      products.forEach(p => expect(p).not.toHaveProperty('photo'));
    });
  });

  describe('GET /api/v1/product/search/:keyword', () => {
    beforeEach(async () => {
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);
    })

    it('should return 200 with products matching case-insensitive name', async () => {
      const res = await request(app).get('/api/v1/product/search/sMartphone');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: SMARTPHONE.name }),
      ]));
    });

    it('should return 200 with products matching case-insensitive description', async () => {
      const res = await request(app).get('/api/v1/product/search/poWeRFul');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: LAPTOP.name }),
        expect.objectContaining({ name: SMARTPHONE.name }),
      ]));
    });

    it('should return 400 with whitespace keyword', async () => {
      const res = await request(app).get('/api/v1/product/search/%20');

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/product/related-product/:pid/:cid', () => {
    beforeEach(async () => {
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);
    })

    it('should return 200 with products of the same category', async () => {
      const res = await request(app).get(`/api/v1/product/related-product/${LAPTOP._id}/${ELECTRONICS._id}`);

      expect(res.status).toBe(200);
      res.body.products.forEach(p => expect(p.category._id).toBe(ELECTRONICS._id));
    });

    it('should exclude current product', async () => {
      const res = await request(app).get(`/api/v1/product/related-product/${LAPTOP._id}/${ELECTRONICS._id}`);

      const ids = res.body.products.map(p => p._id);
      expect(ids).not.toContain(LAPTOP._id);
    });

    it('should exclude photo and populate category', async () => {
      const res = await request(app).get(`/api/v1/product/related-product/${LAPTOP._id}/${ELECTRONICS._id}`);

      res.body.products.forEach(p => expect(p).not.toHaveProperty('photo'));
      res.body.products.forEach(p => expect(p.category).toHaveProperty('_id'));
    });

    it('should return at most 3 related products', async () => {
      const laptops = Array.from({ length: 5 }, (_, i) => ({
        ...LAPTOP,
        _id: (new mongoose.Types.ObjectId()).toString(),
        name: `LAPTOP ${i + 1}`,
        slug: `laptop${i + 1}`,
      }));
      await productModel.insertMany(laptops);

      const res = await request(app).get(`/api/v1/product/related-product/${LAPTOP._id}/${ELECTRONICS._id}`);
      expect(res.body.products).toHaveLength(3);
    });
  });

  describe('GET /api/v1/product/product-category/:slug', () => {
    beforeEach(async () => {
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);
    });

    it('should return 200 with products in category', async () => {
      const res = await request(app).get(`/api/v1/product/product-category/${BOOK.slug}`);

      expect(res.status).toBe(200);
      res.body.products.forEach(p => expect(p.category._id).toBe(BOOK._id));

      res.body.products.forEach(p => expect(p).not.toHaveProperty('photo'));
      res.body.products.forEach(p => expect(p.category).toHaveProperty('_id'));
    });

    it('should return 404 with products in category', async () => {
      const res = await request(app).get(`/api/v1/product/product-category/invalid-category`);

      expect(res.status).toBe(404);
    });
  });
});