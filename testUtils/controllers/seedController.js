import { clearTestDB } from "../../config/testDb.js";
import categoryModel from "../../models/categoryModel.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productModel.js";
import userModel from "../../models/userModel.js";

export const resetSeedController = async (req, res) => {
  try {
    await clearTestDB();
    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error clearing test DB",
      error: error.message,
    });
  }
}

export const seedCategoriesController = async (req, res) => {
  try {
    const categories = req.body;
    await categoryModel.insertMany(categories);
    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error seeding categories",
      error: error.message,
    });
  }
}

export const seedOrdersController = async (req, res) => {
  try {
    const orders = req.body;
    await orderModel.insertMany(orders);
    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error seeding orders",
      error: error.message,
    });
  }
}

export const seedProductsController = async (req, res) => {
  try {
    const products = req.body;
    await productModel.insertMany(products);
    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error seeding products",
      error: error.message,
    });
  }
}

export const seedUsersController = async (req, res) => {
  try {
    const users = req.body;
    await userModel.insertMany(users);
    res.status(201).send({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error seeding users",
      error: error.message,
    });
  }
}
