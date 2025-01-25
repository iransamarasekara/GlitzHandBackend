import express from "express";

import {
  getAllProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getTrendingProducts,
  getFeaturedProducts,
  updateProductStock,
  getProductByName,
} from "../controllers/product.controller.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Admin-only middleware

const router = express.Router();

router.get("/trending", getTrendingProducts);
router.get("/featured", getFeaturedProducts);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.get("/name/:name", getProductByName);
router.post("/", protect, adminOnly, createProduct);
router.put("/:id", protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);
router.put("/:id/stock", protect, adminOnly, updateProductStock);

export default router;
