import express from "express";
import multer from "multer";
import { analyzeImage, uploadListing, getListings } from "../controller/wasteController.js";

const router = express.Router();

// Setup Multer to temporarily store files before sending to Gemini
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "waste-" + uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// POST endpoint for AI image analysis
router.post("/analyze-image", upload.single("image"), analyzeImage);

// POST endpoint for publishing a listing with up to 5 images
router.post("/upload", upload.array("images", 5), uploadListing);

// GET endpoint for fetching all listings (with optional ?search= query)
router.get("/listings", getListings);

export default router;

