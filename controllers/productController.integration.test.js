import request from 'supertest';
import app from '../server.js';
import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import userModel from '../models/userModel.js';
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

export const USER = {
  _id: 'a1b2c3d4e5f6789012345678',
  name: 'John Doe',
  email: 'johndoe@gmail.com',
  password: 'dont care value',
  phone: '91234567',
  address: '123 Main St, City, Country',
  answer: 'security answer',
  role: 0,
};

export const ADMIN = {
  _id: 'a1b2c3d4e5f6789012345679',
  name: 'Admin User',
  email: 'Administrator@gmail.com',
  password: 'dont care value',
  phone: '98765432',
  address: '456 Admin Rd, City, Country',
  answer: 'admin security answer',
  role: 1,
};

console.log = jest.fn();

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {expect} from "@jest/globals";
dotenv.config({"path": ".env"});

const admin_token = jwt.sign(
    { _id: ADMIN._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);

const user_token = jwt.sign(
    { _id: USER._id},
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
);


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

  /* ------------ CREATE TESTS ----------------------- */
  describe('POST /api/v1/product/create-product', () => {
    it('should return 401 for non admins', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);

      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', user_token)

      expect(res.status).toBe(401);
    });

    it('should return 201 if product created successfully', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);

      // because of formidable() we MUST send in .fields instead of .send({LAPTOP})
      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', admin_token)
          .field('name', LAPTOP.name)
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(201);
    })

    it('should return 400 if the object sent is missing a field', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      // let name be missing
      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', admin_token)
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
    });

    it('should return 400 if the object sent is missing a combination of fields', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      // let name and quantity to be missing
      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', admin_token)
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
    });

    it('should return description of 1 (one) missing field if there are any', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      // let name be missing
      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', admin_token)
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
      expect(res.body?.message).toMatch(/Name.*required/i);
    });

    it('should return helpful message on invalid field entries', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);

      // let price be negative
      const res = await request(app)
          .post('/api/v1/product/create-product')
          .set('Authorization', admin_token)
          .field('name', LAPTOP.name)
          .field('description', LAPTOP.description)
          .field('price', -1)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
      expect(res.body?.message).toMatch(/price.*positive/i);
    })
  })

  /* ------------ READ OPERATION TESTS --------------------------- */
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
        slug: `laptop-${i + 1}`,
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
      const expectedSlugs = Array.from({ length: 6 }, (_, i) => `laptop-${i + 1}`);
      expect(slugs).toEqual(expectedSlugs);

      products.forEach(p => expect(p).not.toHaveProperty('photo'));
    });

    it('should return 200 with products on page 2', async () => {
      const res = await request(app).get('/api/v1/product/product-list/2');

      expect(res.status).toBe(200);
      const products = res.body.products;
      expect(products).toHaveLength(4);

      const slugs = products.map(p => p.slug);
      const expectedSlugs = Array.from({ length: 4 }, (_, i) => `laptop-${i + 7}`);
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

  /* ----------------- UPDATE TESTS ------------------ */
  describe('PUT /api/v1/product/update-product/:pid', () => {
    it('should return 401 for non-admins', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', user_token)

      expect(res.status).toBe(401);
    });

    it('should not alter contents if update request is non-admin', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const before = (await productModel.find({})).map(p => (
          {
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            quantity: p.quantity,
          })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', user_token)
          .field('name', "Ultra Pro Mac")
          .field('description', "new_description")
          .field('price', 69420)
          .field('category', BOOK._id)
          .field('quantity', 69420)

      const after = (await productModel.find({})).map(p => (
          {
            name: p.name,
            description: p.description,
            price: p.price,
            category: p.category,
            quantity: p.quantity,
          })).sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      expect(res.status).toBe(401);
      expect(before).toEqual(after)

    })

    it('should return 200 if object is updated successfully', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(200);
    });

    it('should return 200 if just photo is not reattached', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)

      expect(res.status).toBe(200);
    });

    it('should return 404 if product id is not found', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .put(`/api/v1/product/update-product/aaaaaaaaaaaaaaaaaaaaaaaa`)
          .set('Authorization', admin_token)

      expect(res.status).toBe(404);
    });

    it('should return 400 if object has missing fields', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      // let description be missing
      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', LAPTOP.quantity)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
    });

    it('should return 400 if multiple fields are missing', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      // let only name be present
      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")

      expect(res.status).toBe(400);
    });

    it('should return description of 1 (one) missing field if there are any', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      // let quantity be missing
      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
      expect(res.body?.message).toMatch(/quantity.*required/i);
    });

    it('should return helpful message on invalid fields', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      // let quantity be negative
      const res = await request(app)
          .put(`/api/v1/product/update-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)
          .field('name', "Ultra Pro Mac")
          .field('description', LAPTOP.description)
          .field('price', LAPTOP.price)
          .field('category', LAPTOP.category)
          .field('quantity', -1)
          .attach('photo', Buffer.from('dummy'), 'test.jpg');

      expect(res.status).toBe(400);
      expect(res.body?.message).toMatch(/quantity.*non-negative/i);
    });
  });

  /* ----------------- DELETE TESTS ------------------ */
  describe('DELETE /api/v1/product/delete-product/:pid', () => {
    it('returns 401 if a non-admin user tries deleting', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .delete(`/api/v1/product/delete-product/${LAPTOP._id}`)
          .set('Authorization', user_token)

      expect(res.status).toBe(401);
    });

    it('returns 200 on successful delete', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .delete(`/api/v1/product/delete-product/${LAPTOP._id}`)
          .set('Authorization', admin_token)

      expect(res.status).toBe(200);
    });

    it('returns 404 on deleting non existent product', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .delete(`/api/v1/product/delete-product/aaaaaaaaaaaaaaaaaaaaaaaa`)
          .set('Authorization', admin_token)

      expect(res.status).toBe(404);
    });

    it('nothing is actually deleted for non-admins', async () => {
      await userModel.insertOne(ADMIN);
      await categoryModel.insertMany([ELECTRONICS, BOOK]);
      await productModel.insertMany([LAPTOP, SMARTPHONE, TEXTBOOK]);

      const res = await request(app)
          .delete(`/api/v1/product/delete-product/${LAPTOP._id}`)
          .set('Authorization', user_token)

      expect(res.status).toBe(401);
      const products = await productModel.find({})
      expect(products.length).toBe(3)
    })
  })
});