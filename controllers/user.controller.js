import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../mongodb/models/user.js";

// Helper function to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || "",
      avatar: "",
      address: [],
      role: "user",
      cart: [],
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};

export const createAdminUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const adminUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "admin",
    });

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: adminUser._id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating admin",
      error: error.message,
    });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: user.address,
        cart: user.cart,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error logging in user", error: error.message });
  }
};

// Update user profile (name, phone, avatar)
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar, address } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;
    user.avatar = avatar || user.avatar;
    user.address = address || user.address;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        address: updatedUser.address,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating profile", error: error.message });
  }
};

// Add or update an address in addressBook
export const updateAddressBook = async (req, res) => {
  try {
    const {
      houseNumber,
      addressLine1,
      addressLine2,
      city,
      district,
      postalCode,
      province,
    } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update or add new address
    user.address = [
      {
        houseNumber,
        addressLine1,
        addressLine2,
        city,
        district,
        postalCode,
        province,
      },
    ];

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Address updated successfully",
      address: updatedUser.address,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating address", error: error.message });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId).populate("orders");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders: user.orders,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving orders", error: error.message });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password"); // Exclude password from the result
    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: error.message });
  }
};

// Delete a user by ID (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
};

export const sendNotificationToUser = async (userId, message) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return { message: "User not found" };
    }

    // Add the new notification
    user.notifications.push({
      message,
      status: "unread", // default status
    });

    await user.save();
    return { message: "Notification sent successfully" };
  } catch (error) {
    return { message: "Error sending notification", error: error.message };
  }
};

// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId).populate("cart.product_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product already exists in cart
    const existingCartItem = user.cart.find(
      (item) => item.product_id._id.toString() === productId
    );

    if (existingCartItem) {
      // Update quantity if product exists
      existingCartItem.quantity += quantity;
    } else {
      // Add new product to cart
      user.cart.push({
        product_id: productId,
        quantity: quantity,
      });
    }

    await user.save();

    res.status(200).json({
      message: "Product added to cart successfully",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding product to cart",
      error: error.message,
    });
  }
};

// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = user.cart.filter(
      (item) => item.product_id.toString() !== productId
    );

    await user.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error removing product from cart",
      error: error.message,
    });
  }
};

// Update cart item quantity
export const updateCartQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cartItem = user.cart.find(
      (item) => item.product_id.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    cartItem.quantity = quantity;
    await user.save();

    res.status(200).json({
      message: "Cart quantity updated successfully",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating cart quantity",
      error: error.message,
    });
  }
};

// Get cart items
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId).populate("cart.product_id");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving cart",
      error: error.message,
    });
  }
};
