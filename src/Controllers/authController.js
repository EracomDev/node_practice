const User = require("../Models/User");
const generateOtp = require("../utils/generateOtp");
const sendToken = require("../utils/sendToken");
const { sendOtpEmail } = require("../Services/emailService");

// POST /api/auth/signup
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please send name, email and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered. Please login.",
      });
    }

    const user = await User.create({ name, email, password });
    sendToken(user, 201, res, "Signup successful");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please send email and password.",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Wrong email or password.",
      });
    }

    sendToken(user, 200, res, "Login successful");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/forgot-password — email par OTP
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please send email.",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Security: email exist karta hai ya nahi — same message (guess na ho)
      return res.json({
        success: true,
        message: "If this email is registered, OTP has been sent.",
      });
    }

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    await sendOtpEmail(user.email, otp);

    res.json({
      success: true,
      message: "If this email is registered, OTP has been sent.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/auth/reset-password — OTP + naya password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please send email, otp and newPassword.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
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
    if (name) req.user.name = name;
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
