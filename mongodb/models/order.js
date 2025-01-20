import mongoose from "mongoose";

// Order schema
const orderSchema = new mongoose.Schema({
  email: {
    type: String, // User's email for communication
    required: true,
  },
  phone: {
    type: String, // User's WhatsApp number
    required: true,
  },
  products: [
    {
      product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now, // Order creation date
  },
  time: {
    type: String,
    default: () => new Date().toLocaleTimeString(), // Time of order
  },
  total: {
    type: Number,
    required: true, // Total price of the order
  },
  firstName: {
    type: String,
    required: true, // User's first name
  },
  lastName: {
    type: String,
    required: true, // User's last name
  },
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
  status: {
    type: String,
    enum: [
      "pending",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
      "Finished",
      "Returned",
    ],
    default: "pending", // Current order status
  },
});

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
