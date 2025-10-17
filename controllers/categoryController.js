import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
export const createCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
        return res.status(400).send({ message: "Name is required" });
    }
    if (name.trim().length === 0){
        return res.status(400).send({ message: "Name cannot contain only whitespace" });
    }
    const normalizedSlug = slugify(name);
    const existingCategory = await categoryModel.findOne({ slug: normalizedSlug });
    if (existingCategory) {
      return res.status(409).send({
        success: false,
        message: "Category Already Exists (*Names are case-insensitive)",
      });
    }
    const category = await new categoryModel({
      name,
      slug: normalizedSlug,
    }).save();
    res.status(201).send({
      success: true,
      message: "New Category Created",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error in Category Creation",
    });
  }
};

//update category
export const updateCategoryController = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;
      if (!name) {
          return res.status(400).send({
              success: false,
              message: "Category name cannot be empty",
          });
      }
      if (name.trim().length === 0){
          return res.status(400).send({
              success: false,
              message: "Category name cannot contain only whitespace",
          });
      }
      const normalizedSlug = slugify(name);
      const existingCategory = await categoryModel.findOne({ slug: normalizedSlug, _id: { $ne: id } });
      if (existingCategory) {
          return res.status(200).send({
              success: false,
              message: "Category Already Exists (*Names are case-insensitive)",
          });
      }
    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, slug: normalizedSlug },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Category Updated Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error while updating category",
    });
  }
};

// get all cat
export const categoryController = async (req, res) => {
  try {
    const category = await categoryModel.find({});
    if (!category || category.length === 0) {
      return res.status(200).send({
        success: true,
        message: "No Categories Found",
        category: [],
      });
    }

    return res.status(200).send({
      success: true,
      message: "All Categories List",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      error,
      message: "Error while getting all categories",
    });
  }
};

// single category
export const singleCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).send({
      success: true,
      message: "Get Single Category Successfully",
      category,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      error,
      message: "Error while getting Single Category",
    });
  }
};

//delete category
export const deleteCategoryController = async (req, res) => {
  try {
    const {id} = req.params;
    const deletedItem = await categoryModel.findByIdAndDelete(id);
    if (!deletedItem) {
      res.status(404).send({
        success: false,
        message: "Category not found",
      });
    } else {
      res.status(200).send({
        success: true,
        message: "Category Deleted Successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error while deleting category",
      error,
    });
  }
};