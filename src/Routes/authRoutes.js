const express = require("express");
const router = express.Router();
const protect = require("../Middleware/authMiddleware");
const upload = require("../Middleware/uploadMiddleware");
const {
  signup,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  uploadAvatar,
} = require("../Controllers/authController");

// Public — token ki zaroorat nahi
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Private — pehle protect middleware
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/profile/avatar", protect, upload.single("image"), uploadAvatar);

module.exports = router;
