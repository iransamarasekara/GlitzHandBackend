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
  images: [
    {
      url: String,
      publicId: String, // Store the public ID for deletion later
    },
  ],
  dateReviewed: {
    type: Date,
    default: Date.now,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
  },
  avatar: {
    type: String,
    default: "",
  },
});

const reviewModel = mongoose.model("Review", reviewSchema);

export default reviewModel;
