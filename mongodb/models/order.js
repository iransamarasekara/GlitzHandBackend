import mongoose from "mongoose";

// Order schema
const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  status: {
    type: String,
    enum: [
      "pending",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
      "finished",
      "returned",
    ],
    default: "pending", // Current order status
  },
  pickUpMethod: {
    type: String,
    enum: ["delivery", "pickup", "prepaid"],
    default: "delivery", // Delivery or pickup
  },
  paymentSlipUrl: {
    type: String,
  },
});

const orderModel = mongoose.model("Order", orderSchema);

export default orderModel;
