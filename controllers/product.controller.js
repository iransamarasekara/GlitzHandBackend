import productModel from "../mongodb/models/product.js";
import categoryModel from "../mongodb/models/category.js";
import cloudinary from "../config/cloudinary.config.js";

// Get all products
const getAllProducts = async (req, res) => {
  try {
    // Extract filters, sorting, pagination, and search options from query params
    const {
      category,
      minPrice,
      maxPrice,
      sortBy,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    // Build the query object
    const query = {};

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice) {
      query.price = { ...query.price, $gte: Number(minPrice) };
    }
    if (maxPrice) {
      query.price = { ...query.price, $lte: Number(maxPrice) };
    }

    // Search filter
    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive search
      query.$or = [
        { name: regex }, // Search in name
        { description: regex }, // Search in description
      ];
    }

    // Pagination options
    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split(":"); // Example: "price:asc" or "name:desc"
      sortOptions[field] = order === "desc" ? -1 : 1;
    } else {
      // Default sorting by latest added products
      sortOptions.dateAdded = -1;
    }

    // Fetch products with filters, sorting, search, and pagination
    const products = await productModel
      .find(query)
      .populate("category", "name") // Populate category with its name
      .populate("reviews", "rating comment user") // Populate specific fields in reviews
      .sort(sortOptions) // Apply sorting
      .skip(skip) // Apply pagination
      .limit(Number(limit)); // Apply pagination limit

    // Fetch the total count of matching products for pagination metadata
    const totalProducts = await productModel.countDocuments(query);

    // Send response with products and pagination metadata
    res.status(200).json({
      products,
      totalProducts,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProducts / limit),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving products", error: error.message });
  }
};

// Create a new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      discount,
      images, // Array of { url, publicId }
      category,
      countInStock,
      description,
      reviews,
    } = req.body;

    const categoryExists = await categoryModel.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const product = new productModel({
      name,
      price,
      discount,
      images,
      category,
      countInStock,
      description,
      reviews,
    });

    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating product", error: error.message });
  }
};

// Get a product by ID
const getProductById = async (req, res) => {
  try {
    const product = await productModel
      .findById(req.params.id)
      .populate("category", "name")
      .populate("reviews"); // Populating reviews

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving product", error: error.message });
  }
};

// Get a product by name
const getProductByName = async (req, res) => {
  try {
    const { name } = req.params;

    // Use a case-insensitive search for better usability
    const product = await productModel
      .findOne({ name: { $regex: new RegExp(name, "i") } })
      .populate("category", "name")
      .populate("reviews"); // Populating reviews

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving product", error: error.message });
  }
};

// Update a product by ID
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await productModel
      .findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
      .populate("category", "name")
      .populate("reviews");

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating product", error: error.message });
  }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove images from Cloudinary
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.publicId);
    }

    // Delete product from database
    await product.deleteOne();

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting product", error: error.message });
  }
};

// Fetch top 6 trending products based on stock count as a simple example
const getTrendingProducts = async (req, res) => {
  try {
    const trendingProducts = await productModel
      .find()
      .sort({ countInStock: -1 }) // Sorting by stock as a placeholder, adjust criteria as needed
      .limit(6)
      .populate("category", "name") // Populate category details if needed
      .select("_id name price discount images category countInStock dateAdded"); // Select only essential fields

    res.status(200).json({
      success: true,
      count: trendingProducts.length,
      products: trendingProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch trending products",
      error: error.message,
    });
  }
};

// Fetch top 6 Featured products
const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await productModel
      .find({ countInStock: { $gt: 0 } })
      .sort({ discount: -1 }) // Sort by discount value in descending order
      .limit(6)
      .populate("category", "name") // Populate category details if needed
      .select(
        "_id name price discount images category countInStock dateAdded description"
      ); // Select only essential fields

    res.status(200).json({
      success: true,
      count: featuredProducts.length,
      products: featuredProducts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
      error: error.message,
    });
  }
};

// Update stock count for a product by product ID
const updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    const { countInStock } = req.body;

    // Validate input
    if (countInStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Stock count must be a non-negative number",
      });
    }

    // Find and update product
    const updatedProduct = await productModel.findByIdAndUpdate(
      productId,
      { countInStock },
      { new: true, runValidators: true }
    );

    // Check if product exists
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock count updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating stock count",
      error: error.message,
    });
  }
};

export {
  getAllProducts,
  createProduct,
  getProductById,
  getProductByName,
  updateProduct,
  deleteProduct,
  getTrendingProducts,
  getFeaturedProducts,
  updateProductStock,
};
