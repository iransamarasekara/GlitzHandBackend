import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

import connectDB from "./mongodb/connect.js";
import ProductRouter from "./routes/product.routes.js";
import CategoryRouter from "./routes/category.routes.js";
import ReviewRouter from "./routes/review.routes.js";
import UserRouter from "./routes/user.routes.js";
import OrderRouter from "./routes/order.routes.js";
import userModel from "./mongodb/models/user.js";
import categoryModel from "./mongodb/models/category.js";
import UploadRouter from "./routes/upload.routes.js";
import NewsLetterRouter from "./routes/newsLetter.routes.js";
import ContactRouter from "./routes/contact.router.js";
import productModel from "./mongodb/models/product.js";
import orderModel from "./mongodb/models/order.js";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const allowedOrigins = [
  "https://glitzhand.netlify.app",
  "https://glitzhand-admin-panel.netlify.app",
  "https://glitzhand.com",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send({ message: "Hello World!" });
});

app.use("/api/products", ProductRouter);
app.use("/api/categories", CategoryRouter);
app.use("/api/reviews", ReviewRouter);
app.use("/api/users", UserRouter);
app.use("/api/orders", OrderRouter);
app.use("/api/uploads", UploadRouter);
app.use("/api/newsletter", NewsLetterRouter);
app.use("/api/contact", ContactRouter);

// async function findProduct() {
//   try {
//     const product = await productModel.findOne({
//       _id: "678e00f87a94374fdeca1917",
//     });
//     console.log("Product found:", product);
//   } catch (err) {
//     console.error("Error finding product:", err.message);
//   }
// }

// findProduct();

// async function createTestOrder() {
//   try {
//     const newOrder = await orderModel.create({
//       user: new mongoose.Types.ObjectId("679000e73654a7b01374e9a2"), // Replace with valid user ID
//       products: [
//         {
//           product_id: new mongoose.Types.ObjectId("678e00f87a94374fdeca1917"),
//           quantity: 3,
//         },
//       ],
//       total: 1500, // Adjust as needed
//     });
//     console.log("Order created successfully:", newOrder);
//   } catch (err) {
//     console.error("Error creating new my order:", err.message);
//   }
// }
// createTestOrder();

const createAdminUser = async () => {
  try {
    const email = "admin@example.com";
    const password = "adminpassword";
    const firstName = "Admin";
    const lastName = "User";
    const phone = "1234567890";

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const adminUser = await userModel.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: "admin",
    });

    console.log("Admin user created successfully", {
      id: adminUser._id,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      email: adminUser.email,
      role: adminUser.role,
    });
  } catch (error) {
    console.error("Error creating admin", error.message);
  }
};

const createDefaultCategories = async () => {
  const defaultCategories = [
    { name: "Bracelets" },
    { name: "Necklaces" },
    { name: "Earrings" },
    { name: "Rings" },
    { name: "Handbags" },
    { name: "Wallets" },
    { name: "T-Shirts" },
    { name: "Sweat-Shirts" },
  ];

  try {
    for (const categoryData of defaultCategories) {
      const { name } = categoryData;

      // Check if category name already exists
      const categoryExists = await categoryModel.findOne({ name });
      if (categoryExists) {
        console.log(`Category "${name}" already exists`);
        continue;
      }

      // Create new category
      const category = new categoryModel({
        name,
      });

      await category.save();
      console.log(`Category "${name}" created successfully`);
    }
  } catch (error) {
    console.error("Error creating default categories", error.message);
    mongoose.connection.close();
  }
};

const startServer = async () => {
  try {
    await connectDB(process.env.MONGODB_URL);
    await createAdminUser();
    await createDefaultCategories();

    app.listen(8080, () => {
      console.log("Server is running on port http://localhost:8080");
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
