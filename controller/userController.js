/**********************************************************************
 * AUTH CONTROLLER (Improved Version)
 * - Uses model authentication methods
 * - Cleaner & more secure
 * - Supports role (buyer/seller)
 **********************************************************************/

import User from "../model/userModel.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";

dotenv.config();

/**********************************************************************
 * ================= REGISTER USER =================
 **********************************************************************/
// userController.js - Simplified
export const registerUser = async (req, res) => {
  try {
    const { fullname, email, password, role } = req.body;
    // ... validation ...

    const user = new User({
      fullname,
      email: email.toLowerCase(),
      password, // Send plain password; the Model's .pre("save") will hash it!
      role: role ? role.toLowerCase() : "buyer",
      verificationDocument: req.file ? `uploads/${req.file.filename}` : null,
    });

    await user.save();
    console.log("=== NEW USER REGISTERED ===");
    console.log({
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      password: password, // Plain text before model save hashing
      verificationDocument: user.verificationDocument,
    });
    console.log("===========================");

    res.status(201).json({ message: "User Registered successfully" });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: error.message || "Registration failed on server" });
  }
};
/**********************************************************************
 * ================= LOGIN USER =================
 **********************************************************************/
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) return res.status(400).json({ message: "User does not exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ userID: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("=== USER LOGGED IN ===");
    console.log({
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      password: password, // Plain text login attempt
    });
    console.log("======================");

    // Remove the password from the returned user object so it's not sent to the frontend
    user.password = undefined;

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
/**********************************************************************
 * ================= FORGOT PASSWORD =================
 **********************************************************************/
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset OTP using schema method
    const resetOTP = user.generateResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    console.log(`\n=== PASSWORD RESET OTP FOR ${user.email} ===`);
    console.log(`OTP: ${resetOTP}`);
    console.log(`=============================================\n`);

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const message = `
        You requested a password reset for Carbon Neutral Platform.

        Your 4-digit OTP for resetting your password is: ${resetOTP}

        This OTP will expire in 15 minutes.
      `;

      await transporter.sendMail({
        from: `"Carbon Neutral Platform" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Password Reset OTP",
        text: message,
      });
    } catch (mailError) {
      console.log("Mail sending skipped or failed (check .env credentials):", mailError.message);
    }

    res.status(200).json({ message: "OTP generated (check server console and email)" });
  } catch (error) {
    console.log("Forgot Password Error:", error);
    res.status(500).json({ message: "An error occurred generating the OTP" });
  }
};

/**********************************************************************
 * ================= RESET PASSWORD =================
 **********************************************************************/
export const resetPassword = async (req, res) => {
  try {
    const { email } = req.params;
    const { password, otp } = req.body;

    // Hash OTP to match DB
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedOtp,
      resetPasswordExpire: { $gt: Date.now() },
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Set new password (will auto-hash via schema)
    user.password = password;

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.log("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
