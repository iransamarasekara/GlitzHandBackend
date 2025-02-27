import express from "express";
import { upload, uploadImages } from "../controllers/upload.controller.js";

const router = express.Router();

// Accept both images and PDFs
router.post("/", upload.array("files", 10), uploadImages);

export default router;
