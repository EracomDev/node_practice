const User = require("../Models/User");
const generateOtp = require("../utils/generateOtp");
const sendToken = require("../utils/sendToken");
const { sendOtpEmail } = require("../Services/emailService");

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    // Required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please send name, email and password.",
      });
    }

    // Clean data
    name = name.trim();
    email = email.trim().toLowerCase();

    // Name validation
    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters.",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    // Existing user check
    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    sendToken(user, 201, res, "Signup successful");
  } catch (error) {
    console.error("Signup Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please send email and password.",
      });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Wrong email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Wrong email or password.",
      });
    }

    sendToken(user, 200, res, "Login successful");
  } catch (error) {
    console.error("Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// POST /api/auth/forgot-password — email par OTP
const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please send email.",
      });
    }

    email = email.trim().toLowerCase();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    const user = await User.findOne({ email });

    // Security: same response whether user exists or not
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is registered, OTP has been sent.",
      });
    }

    // OTP resend cooldown (60 seconds)
    if (
      user.otpSentAt &&
      Date.now() - user.otpSentAt.getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message:
          "Please wait 60 seconds before requesting another OTP.",
      });
    }

    const otp = generateOtp();

    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    ); // 10 min

    user.otpSentAt = new Date();

    await user.save({ validateBeforeSave: false });

    try {
      await sendOtpEmail(user.email, otp);
    } catch (emailError) {
      // rollback OTP if email fails

      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      user.otpSentAt = undefined;

      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Unable to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "If this email is registered, OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// POST /api/auth/reset-password — OTP + naya password
const resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please send email, otp and newPassword.",
      });
    }

    email = email.trim().toLowerCase();

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    if (user.resetOtp !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }

    if (!user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Request a new one.",
      });
    }

    user.password = newPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    user.otpSentAt = null;
    await user.save();

    sendToken(user, 200, res, "Password reset successful");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/auth/profile — logged-in user ki details
const getProfile = async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profileImage: req.user.profileImage,
      createdAt: req.user.createdAt,
    },
  });
};

// PUT /api/auth/profile — name update (optional email mat badlo abhi)
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (name) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters.",
        });
      }
      req.user.name = trimmed;
    }
    await req.user.save();

    res.json({
      success: true,
      message: "Profile updated",
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        profileImage: req.user.profileImage,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/auth/profile/avatar — multer se image
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file (field name: image).",
      });
    }

    const imagePath = `/uploads/profiles/${req.file.filename}`;
    req.user.profileImage = imagePath;
    await req.user.save();

    res.json({
      success: true,
      message: "Profile image updated",
      profileImage: imagePath,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
};
