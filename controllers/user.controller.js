import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../mongodb/models/user.js";

// Helper function to generate JWT
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Function to get UI Avatars URL
function getAvatarUrl(name, size = 128) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&size=${size}&background=random`;
}

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

    // Generate avatar URL using UI Avatars
    const avatarUrl = getAvatarUrl(`${firstName} ${lastName}`);

    // Create new user
    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || "",
      avatar: avatarUrl,
      address: {
        addressLine1: "",
        addressLine2: "",
        city: "",
        district: "",
        province: "",
        postalCode: "",
      },
      role: "user", // Changed default role to guest
      orders: [], // Initialize empty orders array
      createdAt: new Date(),
      notifications: [],
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
        avatar: user.avatar,
        address: user.address,
        orders: user.orders,
        notifications: user.notifications,
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

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const adminUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: "admin",
      createdAt: new Date(),
      orders: [],
      notifications: [],
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

    const user = await userModel
      .findOne({ email })
      .select("+password") // Explicitly include password for comparison
      .populate("orders");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
        orders: user.orders,
        notifications: user.notifications,
      },
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in user",
      error: error.message,
    });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, avatar, address } = req.body;
    const userId = req.user._id;

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
    res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
};

// Update address
export const updateAddressBook = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, district, province, postalCode } =
      req.body;
    const userId = req.user._id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create new address object
    const newAddress = {
      addressLine1,
      addressLine2,
      city,
      district,
      province,
      postalCode,
    };

    // Add to address array
    user.address.push(newAddress);

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Address added successfully",
      address: updatedUser.address,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating address",
      error: error.message,
    });
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).populate("orders");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders: user.orders,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving orders",
      error: error.message,
    });
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}, "-password").populate("orders");

    res.status(200).json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

// Send notification to user
export const sendNotificationToUser = async (userId, message) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) {
      return { message: "User not found" };
    }

    // Add new notification with complete structure
    user.notifications.push({
      message,
      status: "unread",
      createdAt: new Date(),
    });

    await user.save();
    return { message: "Notification sent successfully" };
  } catch (error) {
    return {
      message: "Error sending notification",
      error: error.message,
    };
  }
};

// Delete a user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};
