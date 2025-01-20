import orderModel from "../mongodb/models/product.js";
import productModel from "../mongodb/models/product.js";

// Create a new order
export const createOrder = async (req, res) => {
  try {
    const { email, phone, products, total, firstName, lastName, address } =
      req.body;

    // Map over the products array to get the ObjectId for each product
    const productsWithObjectIds = [];
    const productDetails = await Promise.all(
      products.map(async (product) => {
        // Find the product by its `id` (the one passed in the order)
        const productDoc = await productModel.findOne({
          id: product.product_id,
        });

        if (!productDoc) {
          return res.status(400).json({
            success: false,
            message: `Product with id ${product.product_id} not found`,
          });
        }

        // Push the product with its `ObjectId` and quantity to the products array
        productsWithObjectIds.push({
          product_id: productDoc._id, // Use the ObjectId of the product
          quantity: product.quantity,
        });

        // Return product details for mailing purposes
        return {
          name: productDoc.name,
          price: productDoc.price - productDoc.discount,
          quantity: product.quantity,
          total: product.quantity * (productDoc.price - productDoc.discount), // Calculate total for each product
        };
      })
    );

    const newOrder = new orderModel({
      email,
      phone,
      products: productsWithObjectIds,
      total,
      firstName,
      lastName,
      address,
    });

    const savedOrder = await newOrder.save();

    // Construct the product description for the email
    let productDescription = productDetails.map((product) => {
      return {
        item: product.name,
        description: `You have ordered ${
          product.quantity
        } of this product at a price of ${product.price - product.discount}`,
        total: product.total,
      };
    });

    /** Sending an email upon order confirmation */
    let config = {
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    };

    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
      theme: "default",
      product: {
        name: "GlitzHand",
        link: "https://mailgen.js/",
      },
    });

    let response = {
      body: {
        name: req.body.firstName,
        intro: "Your bill has arrived!",
        table: {
          data: productDescription, // Use the array of products for the email table
        },
        outro: "Thank you for ordering from us!",
      },
    };

    let mail = MailGenerator.generate(response);

    let message = {
      from: process.env.EMAIL,
      to: req.body.email,
      subject: "Order Confirmation",
      html: mail,
    };

    // Send the email
    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.error("Error sending email:", err);
      } else {
        console.log("Email sent:", info.response);
      }
    });

    res.status(201).json({
      message: "Order created successfully",
      order: savedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Get all orders (Admin only)
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel.find();

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

// Get a single order by ID (Admin or User)
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await orderModel.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
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

// Update the status of an order (Admin and user)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedOrder = await orderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

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
    const userId = req.user.id;

    const orders = await orderModel
      .find({ user: userId })
      .populate("products.product_id")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Order history retrieved successfully",
      orders: orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving order history",
      error: error.message,
    });
  }
};
