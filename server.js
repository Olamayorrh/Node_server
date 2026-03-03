/***********************************************************************
 * MAIN SERVER FILE
 * Handles:
 * - Express setup
 * - Middleware
 * - Routes
 * - Database connection
 ***********************************************************************/

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";

import authRoute from "./routes/userRoute.js";
import wasteRoute from "./routes/wasteRoute.js";

dotenv.config();

const app = express();

/***********************************************************************
 * ================= MIDDLEWARE =================
 ***********************************************************************/

// Enable CORS
app.use(
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true,
  }),
);

// Parse JSON body
app.use(express.json());

// Parse form-data (important for file uploads)
app.use(express.urlencoded({ extended: true }));

/***********************************************************************
 * ================= STATIC FOLDER =================
 * Allows access to uploaded files
 * Example: http://localhost:5000/uploads/filename.jpg
 ***********************************************************************/
app.use("/uploads", express.static("uploads"));

/***********************************************************************
 * ================= ROUTES =================
 ***********************************************************************/
app.use("/api/auth", authRoute);
app.use("/api/waste", wasteRoute);

app.get("/", (req, res) => {
  res.send("Welcome Home!");
});

/***********************************************************************
 * ================= GLOBAL ERROR HANDLER =================
 ***********************************************************************/
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Something went wrong on the server",
  });
});

/***********************************************************************
 * ================= DATABASE CONNECTION =================
 ***********************************************************************/
const PORT = process.env.PORT || 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });
