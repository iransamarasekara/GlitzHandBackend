import express from "express";
import {
  createReview,
  getReviewsByProduct,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";

const router = express.Router();

router.post("/", createReview);
router.get("/:productId", getReviewsByProduct);
router.put("/:reviewId", updateReview);
router.delete("/:reviewId", deleteReview);

export default router;
