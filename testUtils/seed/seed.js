import categoryModel from "../../models/categoryModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";
import { CATEGORIES } from "./data/categories.js";
import { ORDERS } from "./data/orders.js";
import { PRODUCTS } from "./data/products.js";
import { USERS } from "./data/users.js";

export const seedData = async () => {
  try {
    await userModel.deleteMany();
    await categoryModel.deleteMany();
    await productModel.deleteMany();
    await orderModel.deleteMany();
    await userModel.insertMany(USERS);
    await categoryModel.insertMany(CATEGORIES);
    await productModel.insertMany(PRODUCTS);
    await orderModel.insertMany(ORDERS);
    console.log('Successfully seeded test data');
  } catch (error) {
    console.log(error);
  }
};