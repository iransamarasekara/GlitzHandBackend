import express from "express";
import {
  registerUser,
  createAdminUser,
  loginUser,
  updateUserProfile,
  updateAddressBook,
  getUserOrders,
  getAllUsers,
  deleteUser,
  sendNotificationToUser,
  // addToCart,
  // removeFromCart,
  // updateCartQuantity,
  // getCart,
} from "../controllers/user.controller.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js"; // Assume `protect` authenticates and `adminOnly` checks for admin role

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/profile", protect, updateUserProfile);
router.put("/address", protect, updateAddressBook);
router.get("/orders", protect, getUserOrders);
router.get("/", protect, adminOnly, getAllUsers);
router.delete("/:id", protect, adminOnly, deleteUser);
router.post("/notify", protect, adminOnly, sendNotificationToUser);
router.post("/createadmin", protect, adminOnly, createAdminUser);
// router.post("/cart", protect, addToCart);
// router.delete("/cart/:id", protect, removeFromCart);
// router.put("/cart/:id", protect, updateCartQuantity);
// router.get("/cart", protect, getCart);

export default router;
