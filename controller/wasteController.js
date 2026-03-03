import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Initialize the Gemini client using the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing from .env");
        return res.status(500).json({ success: false, message: "Server AI configuration missing." });
    }

    console.log("Analyzing image via Gemini:", req.file.filename);

    // Read the uploaded file into a base64 string
    const filePath = req.file.path;
    const fileData = fs.readFileSync(filePath).toString("base64");
    
    // Determine the mime type (assuming jpeg or png from the frontend)
    const mimeType = req.file.mimetype || "image/jpeg";

    const prompt = `Analyze this industrial material/waste image for a marketplace listing. 
    Respond STRICTLY in valid JSON format with the following keys:
    - "title": A short, descriptive title (e.g. "500kg Recycled Glass").
    - "category": Choose one of: "Plastic", "Metal", "Paper", "Electronic", "Other".
    - "grade": Choose one of: "Sorted/Clean", "Unsorted/Mixed", "Industrial Grade".
    - "description": A short functional description including any visible impurities, storage conditions, or visual defects.
    
    Do not include markdown or formatting, just raw JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: fileData,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
          responseMimeType: "application/json"
      }
    });

    const outputText = response.text;
    console.log("Gemini Output:", outputText);

    // Clean up temporary multipart upload
    fs.unlinkSync(filePath);

    let parsedData;
    try {
        parsedData = JSON.parse(outputText);
    } catch (parseError) {
        console.error("Gemini returned invalid json:", outputText);
         // Fallback default
        parsedData = {
             title: "Unknown Material",
             category: "Other",
             grade: "Unsorted/Mixed",
             description: "AI failed to categorize automatically."
        };
    }

    res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error("AI Analysis Error:", error);
    
    // Clean up file if it exists and we crashed
    if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ success: false, message: "Failed to analyze image with AI" });
  }
};

import Waste from "../model/wasteModel.js";

export const uploadListing = async (req, res) => {
  try {
    const { title, category, grade, description, listingType, price, unit, quantity } = req.body;
    
    // Process location from flattened form-data syntax: "location[address]", etc
    const location = {
      type: "Point",
      coordinates: [0, 0],
      address: req.body["location[address]"] || ""
    };

    // Extract image paths
    const imagePaths = req.files ? req.files.map(file => `uploads/${file.filename}`) : [];

    const newWaste = new Waste({
      title,
      category,
      grade,
      description,
      listingType,
      price: price ? Number(price) : undefined,
      unit,
      quantity: quantity ? Number(quantity) : undefined,
      location,
      images: imagePaths,
      // sellerId: req.user._id // Needs auth middleware
    });

    await newWaste.save();
    console.log("=== NEW WASTE LISTING PUBLISHED ===");
    console.log(newWaste);

    res.status(201).json({ success: true, message: "Listing published successfully", data: newWaste });

  } catch (error) {
    console.error("Upload Listing Error:", error);
    res.status(500).json({ success: false, message: "Failed to publish listing" });
  }
};
