import reviewModel from "../mongodb/models/review.js";
import productModel from "../mongodb/models/product.js";

// Create a new review
const createReview = async (req, res) => {
  try {
    const { user, rating, text, images, productId } = req.body;

    // Check if the product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Create the review
    const review = new reviewModel({
      user,
      rating,
      text,
      images,
      product: productId,
    });

    // Save the review to the database
    const savedReview = await review.save();

    // Add the review to the product's reviews array
    product.reviews.push(savedReview._id);
    await product.save();

    res.status(201).json(savedReview);
  } catch (error) {
    res.status(500).json({
      message: "Error creating review",
      error: error.message,
    });
  }
};

// Get all reviews for a product
const getReviewsByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;

    // Find the product and populate reviews
    const product = await productModel.findById(productId).populate("reviews");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product.reviews);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving reviews",
      error: error.message,
    });
  }
};

// Update a review by ID
const updateReview = async (req, res) => {
  try {
    const { rating, text } = req.body;

    // Find the review to update
    const review = await reviewModel.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update the review
    review.rating = rating || review.rating;
    review.text = text || review.text;

    const updatedReview = await review.save();

    res.status(200).json(updatedReview);
  } catch (error) {
    res.status(500).json({
      message: "Error updating review",
      error: error.message,
    });
  }
};

// Delete a review by ID
const deleteReview = async (req, res) => {
  try {
    const review = await reviewModel.findByIdAndDelete(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Remove the review from the product's reviews array
    const product = await productModel.findById(review.product);
    product.reviews.pull(review._id);
    await product.save();

    res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting review",
      error: error.message,
    });
  }
};

export { createReview, getReviewsByProduct, updateReview, deleteReview };
