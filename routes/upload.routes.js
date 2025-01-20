import express from "express";
import { uploadImages } from "../controllers/upload.controller.js";
const router = express.Router();

router.post("/", uploadImages);

export default router;
