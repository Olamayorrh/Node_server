import multer from "multer";
import fs from "fs";
import path from "path";

// -------------------- ENSURE UPLOADS FOLDER EXISTS --------------------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("Uploads folder created at:", uploadDir);
}

// -------------------- MULTER STORAGE WITH SANITIZED FILENAME --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    // Replace unsafe characters with _
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}-${safeName}`);
  },
});

// Export multer instance
export const upload = multer({ storage });
