import categoryModel from "../mongodb/models/category.js";

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find();
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving categories", error: error.message });
  }
};

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, parentCategory, description } = req.body;

    // Check if category name already exists
    const categoryExists = await categoryModel.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    // Create new category
    const category = new categoryModel({
      name,
      parentCategory: parentCategory || null,
      description,
    });

    const savedCategory = await category.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating category", error: error.message });
  }
};

// Get a category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryModel
      .findById(req.params.id)
      .populate("parentCategory", "name");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.status(200).json(category);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving category", error: error.message });
  }
};

// Update a category by ID
const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await categoryModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json(updatedCategory);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating category", error: error.message });
  }
};

// Delete a category by ID
const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await categoryModel.findByIdAndDelete(
      req.params.id
    );
    if (!deletedCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting category", error: error.message });
  }
};

export {
  getAllCategories,
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
