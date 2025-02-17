import orderModel from "../mongodb/models/order.js";
import productModel from "../mongodb/models/product.js";
import nodemailer from "nodemailer";
import Mailgen from "mailgen";
import userModel from "../mongodb/models/user.js";

export const createOrder = async (req, res) => {
  try {
    const { products, total, email, firstName, lastName, pickUpMethod } =
      req.body;
    const userId = req.user._id;

    const productsWithObjectIds = await Promise.all(
      products.map(async (product) => {
        const productDoc = await productModel.findById(product.product_id);

        if (!productDoc) {
          throw new Error(`Product with id ${product.product_id} not found`);
        }

        return {
          product_id: productDoc._id,
          quantity: product.quantity,
          name: productDoc.name,
          price: productDoc.price - productDoc.discount,
          total: product.quantity * (productDoc.price - productDoc.discount),
        };
      })
    );

    if (!productsWithObjectIds.length) {
      return res.status(400).json({
        success: false,
        message: "No valid products found",
      });
    }

    const newOrder = new orderModel({
      user: userId,
      products: productsWithObjectIds.map(({ product_id, quantity }) => ({
        product_id,
        quantity,
      })),
      total,
      status: "pending",
      pickUpMethod: pickUpMethod || "delivery",
      date: new Date(),
      time: new Date().toLocaleTimeString(),
    });

    const savedOrder = await newOrder.save();

    // Find the user who placed the order
    const user = await userModel.findById(userId);

    // Prepare notifications
    const userNotification = {
      message: `Your order #${savedOrder._id} has been successfully submitted.`,
      status: "unread",
    };

    const adminNotification = {
      message: `New order #${savedOrder._id} submitted by ${user.firstName} ${user.lastName}`,
      status: "unread",
    };

    // Update user with order reference and notification
    await userModel.findByIdAndUpdate(userId, {
      $push: {
        orders: savedOrder._id,
        notifications: userNotification,
      },
    });

    // Send notifications to all admins
    await userModel.updateMany(
      { role: "admin" },
      { $push: { notifications: adminNotification } }
    );

    // Email configuration
    const mailConfig = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    const transporter = nodemailer.createTransport(mailConfig);
    const mailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "GlitzHand",
        link: "https://mailgen.js/",
      },
    });

    const emailContent = {
      body: {
        name: `${firstName} ${lastName}`,
        intro: "Your bill has arrived!",
        table: {
          data: productsWithObjectIds.map((product) => ({
            item: product.name,
            description: `Quantity: ${product.quantity} × Rs ${product.price}`,
            subtotal: `Rs ${product.total.toFixed(2)}`,
          })),
        },
        outro: "Thank you for ordering from us!",
      },
    };

    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Order Confirmation",
      html: mailGenerator.generate(emailContent),
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status === "pending") {
      filter.status = "pending";
    }
    if (status === "cancelled") {
      filter.status = "cancelled";
    }

    if (status === "finished") {
      filter.status = "finished";
    }

    const orders = await orderModel
      .find(filter)
      .populate("user", "firstName lastName email address phone") // Populate user details
      .populate("products.product_id"); // Populate product details

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving orders",
      error: error.message,
    });
  }
};

// Get a single order by ID (Admin or User)
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderModel
      .findById(id)
      .populate("user", "name email")
      .populate("products.product_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if user is authorized to view this order
    if (!req.user.role === "admin" && order.user.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this order" });
    }

    res.status(200).json({
      message: "Order retrieved successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving order",
      error: error.message,
    });
  }
};

// Get all orders by user ID
export const getOrdersByUserId = async (req, res) => {
  const { id } = req.params;
  console.log("User ID:", id);

  try {
    const orders = await orderModel
      .find({ user: id })
      .populate("user", "firstName lastName email address")
      .populate("products.product_id")
      .sort({ date: -1 });

    console.log("Orders:", orders);

    if (!orders) {
      return res.status(404).json({
        message: "No orders found",
      });
    }

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving orders",
      error: error.message,
    });
  }
};

// Update the status of an order
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Validate status against enum values
  const validStatuses = [
    "pending",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
    "finished",
    "returned",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      message: "Invalid status value",
      validStatuses,
    });
  }

  try {
    const updatedOrder = await orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate("user", "name email")
      .populate("products.product_id");

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating order status",
      error: error.message,
    });
  }
};

// Delete an order (Admin only)
export const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedOrder = await orderModel.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order deleted successfully",
      order: deletedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting order",
      error: error.message,
    });
  }
};

// Get user order history
export const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const orders = await orderModel
      .find({ user: userId })
      .populate("products.product_id")
      .sort({ date: -1, time: -1 }); // Sort by date and time

    res.status(200).json({
      message: "Order history retrieved successfully",
      orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving order history",
      error: error.message,
    });
  }
};

// Cancel an order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order",
      });
    }

    if (order.status === "shipped" || order.status === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel shipped or delivered orders",
      });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
};
