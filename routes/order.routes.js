import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByUserId,
  updateOrderStatus,
  deleteOrder,
  getOrderHistory,
  cancelOrder,
} from "../controllers/order.controller.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Admin-only middleware

const router = express.Router();

router.post("/", protect, createOrder); // Create order (Authenticated users)
router.get("/", protect, adminOnly, getAllOrders); // Get all orders (Admin only)
router.get("/user/:id", protect, getOrdersByUserId); // Get all orders by user ID
router.get("/:id", protect, getOrderById); // Get order by ID
router.put("/:id/status", protect, updateOrderStatus); // Update order status
router.delete("/:id", protect, adminOnly, deleteOrder); // Delete order (Admin only)
router.get("/history", protect, getOrderHistory); // Get order history for user
router.put("/:orderId/cancel", protect, cancelOrder); // Cancel an order

export default router;
