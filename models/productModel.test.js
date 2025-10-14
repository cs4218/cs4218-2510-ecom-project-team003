import mongoose from "mongoose";
import productModel from "./productModel";

const VALID_LAPTOP = {
  'name': 'Laptop',
  'slug': 'laptop',
  'description': 'A powerful laptop',
  'price': 1499.99,
  'category': new mongoose.Types.ObjectId(),
  'quantity': 30,
  'shipping': true,
};

describe('Product Model', () => {
  it('should pass if all required fields are present and valid', async () => {
    const product = new productModel({ ...VALID_LAPTOP });
    await expect(product.validate()).resolves.toBeUndefined();
  });

  it('should fail if required field is missing', async () => {
    const invalidLaptop = { ...VALID_LAPTOP };
    delete invalidLaptop.name;
    const product = new productModel({ ...invalidLaptop });
    await expect(product.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should pass if photo is provided', async () => {
    const validLaptop = { ...VALID_LAPTOP };
    validLaptop.photo = { data: Buffer.from('fake image data'), contentType: 'image/png' };
    const product = new productModel({ ...validLaptop });
    await expect(product.validate()).resolves.toBeUndefined();
  });

  it('should fail if price is zero', async () => {
    const invalidLaptop = { ...VALID_LAPTOP };
    invalidLaptop.price = 0;
    const product = new productModel({ ...invalidLaptop });
    await expect(product.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('should pass if price is 0.01', async () => {
    const validLaptop = { ...VALID_LAPTOP };
    validLaptop.price = 0.01;
    const product = new productModel({ ...validLaptop });
    await expect(product.validate()).resolves.toBeUndefined();
  });

  it('should fail if quantity is negative', async () => {
    const invalidLaptop = { ...VALID_LAPTOP };
    invalidLaptop.quantity = -1;
    const product = new productModel({ ...invalidLaptop });
    await expect(product.validate()).rejects.toThrow(mongoose.Error.ValidationError);
  });

});
