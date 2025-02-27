import cloudinary from "../config/cloudinary.config.js";
import path from "path";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isPDF = file.mimetype.includes("pdf");
    return {
      folder: "uploads",
      allowed_formats: ["jpg", "jpeg", "png", "webp", "avif", "pdf"],
      public_id: `${
        file.mimetype.includes("pdf") ? "document" : "image"
      }_${path.basename(
        file.originalname,
        path.extname(file.originalname)
      )}_${Date.now()}`,
      resource_type: isPDF ? "raw" : "image",
    };
  },
});

// Initialize Multer with Cloudinary storage
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file type is allowed
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "application/pdf",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "File type not supported. Please upload an image (JPG/PNG/WEBP/AVIF) or PDF file."
        ),
        false
      );
    }
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
    const uploadedFiles = req.files.map((file) => ({
      url: file.path, // Cloudinary URL
      publicId: file.filename, // Cloudinary public ID
      fileType: file.mimetype.includes("pdf") ? "pdf" : "image",
    }));

    res.status(201).json(uploadedFiles);
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
