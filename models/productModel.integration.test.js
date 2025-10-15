import productModel from '../models/productModel.js';
import { createAndConnectTestDB, clearTestDB, closeTestDB } from '../config/testDb.js';
import mongoose from 'mongoose';
import { describe } from 'node:test';

const LAPTOP = {
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
  'category': '66db427fdb0119d9234b27ed',
  'quantity': 30,
  'photo': {
    'data': Buffer.from('Laptop image data'),
    'contentType': 'image/jpeg',
  },
};

console.log = jest.fn();

describe('Product Model', () => {
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

  describe('creation', () => {
    it('generates slug upon creation', async () => {
      const product = await productModel.create({ ...LAPTOP });
      expect(product.slug).toBe('laptop');
    });

    it('generates unique slug if slug already exists upon creation', async () => {
      await productModel.create({ ...LAPTOP });

      const product2 = await productModel.create({ ...LAPTOP });
      const product3 = await productModel.create({ ...LAPTOP });

      expect(product2.slug).toBe('laptop-1');
      expect(product3.slug).toBe('laptop-2');
    }); 
  });

  describe('save', () => {
    it('generates slug upon save', async () => {
      const product = await productModel.create({ ...LAPTOP });
      product.slug = 'mac';

      await product.save();

      expect(product.slug).toBe('mac');
    });

    it('generates unique slug if slug already exists upon creation', async () => {
      await productModel.create({ ...LAPTOP, slug: 'mac' });
      const product = await productModel.create({ ...LAPTOP });
      product.slug = 'mac';

      await product.save();

      expect(product.slug).toBe('mac-1');
    });
  });

  describe('findOneAndUpdate', () => {
    it('generates slug upon findOneAndUpdate', async () => {
      const product = await productModel.create({ ...LAPTOP });
      
      const updated = await productModel.findByIdAndUpdate(product._id, {slug: 'mac'}, {new: true});

      expect(updated.slug).toBe('mac');
    });

    it('generates unique slug if slug already exists upon findOneAndUpdate', async () => {
      await productModel.create({ ...LAPTOP, slug: 'mac' });
      const product = await productModel.create({ ...LAPTOP });
      
      const updated = await productModel.findByIdAndUpdate(product._id, {slug: 'mac'}, {new: true});

      expect(updated.slug).toBe('mac-1');
    });

    it('does not rengerate slug if slug not updated', async () => {
      const product = await productModel.create({ ...LAPTOP });
      
      const spy = jest.spyOn(productModel, 'generateUniqueSlug');
      await productModel.findOneAndUpdate({_id: product._id}, {price: 999.99}, {new: true});

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });


});