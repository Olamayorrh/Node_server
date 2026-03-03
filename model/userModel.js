/********************************************************************
 * USER MODEL WITH FULL AUTHENTICATION LOGIC
 * - Password hashing
 * - JWT generation
 * - Password comparison
 * - Reset password token generator
 ********************************************************************/

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      minlength: 10,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // prevents password from being returned by default
    },

    role: {
      type: String,
      enum: ["buyer", "seller"],
      default: "buyer",
    },

    verificationDocument: {
      type: String, // stores uploaded file path
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    resetPasswordToken: String,

    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

/********************************************************************
 * 🔐 HASH PASSWORD BEFORE SAVING USER
 ********************************************************************/
userSchema.pre("save", async function () {
  // Only hash if password was modified
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

/********************************************************************
 * 🔐 GENERATE JWT TOKEN
 ********************************************************************/
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

/********************************************************************
 * 🔐 COMPARE PASSWORD (LOGIN VALIDATION)
 ********************************************************************/
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/********************************************************************
 * 🔐 GENERATE RESET PASSWORD TOKEN
 ********************************************************************/
userSchema.methods.generateResetPasswordToken = function () {
  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Hash OTP and save to DB
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(otp)
    .digest("hex");

  // Token expires in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return otp; // send this to user via email
};

export default mongoose.model("userData", userSchema);
