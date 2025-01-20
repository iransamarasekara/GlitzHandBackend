import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  images: [
    {
      url: String,
      publicId: String, // Store the public ID for deletion later
    },
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  countInStock: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    formattedText: String,
    bulletPoints: [String],
    plainText: String,
  },
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  dateAdded: {
    type: Date,
    default: Date.now,
  },
});

const productModel = mongoose.model("Product", productSchema);

export default productModel;
