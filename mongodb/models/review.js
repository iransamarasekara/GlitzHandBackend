import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  images: {
    type: [String], // Optional user-uploaded images
    validate: [(val) => val.length >= 0, "Invalid image data"],
  },
  dateReviewed: {
    type: Date,
    default: Date.now,
  },
});

const reviewModel = mongoose.model("Review", reviewSchema);

export default reviewModel;
