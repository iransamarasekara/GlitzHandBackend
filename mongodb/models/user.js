import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Securely hashed in production
  avatar: { type: String, default: "" }, // Optional profile picture
  phone: { type: String, default: "" }, // Optional contact number
  address: [
    {
      houseNumber: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
    },
  ],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }], // References to user orders
  cart: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1 },
    },
  ],
  role: {
    type: String,
    enum: ["user", "admin", "guest"], // Define roles here
    default: "guest", // Default role is "user"
  },
  createdAt: { type: Date, default: Date.now }, // Account creation date
  notifications: [
    {
      message: { type: String, required: true }, // Notification message
      status: { type: String, default: "unread" }, // "read" or "unread"
      createdAt: { type: Date, default: Date.now }, // Time of notification
    },
  ],
});

const userModel = mongoose.model("User", userSchema);

export default userModel;
