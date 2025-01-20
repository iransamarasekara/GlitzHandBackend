import cloudinary from "../config/cloudinary.config.js";
import path from "path";

const uploadImages = async (req, res) => {
  try {
    const { images } = req.body; // Array of image URLs or base64 strings

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const uploadedImages = [];

    for (const image of images) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "images",
        public_id: `${path.basename(image, path.extname(image))}_${Date.now()}`,
      });

      uploadedImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    res.status(201).json(uploadedImages); // Array of uploaded image details
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error uploading images", error: error.message });
  }
};

export { uploadImages };
