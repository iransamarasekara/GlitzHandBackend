import cloudinary from "../config/cloudinary.config.js";
import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "images",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "avif"], // Specify allowed formats
    public_id: (req, file) => {
      const fileName = path.basename(
        file.originalname,
        path.extname(file.originalname)
      );
      return `${fileName}_${Date.now()}`;
    },
  },
});

// Initialize Multer with Cloudinary storage
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Upload handler
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded.",
      });
    }

    // Map through uploaded files to get their Cloudinary URLs and public IDs
    const uploadedImages = req.files.map((file) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
    }));

    res.status(201).json(uploadedImages);
  } catch (error) {
    console.error("Error uploading files to Cloudinary:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading files to Cloudinary",
      error: error.message,
    });
  }
};

export { uploadImages };
