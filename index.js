// Server entry point — yahan se sab start hota hai
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/Routes/authRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded images browser se open karne ke liye
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Node Practice API — Auth is ready",
    routes: {
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      forgotPassword: "POST /api/auth/forgot-password",
      resetPassword: "POST /api/auth/reset-password",
      profile: "GET /api/auth/profile (Bearer token)",
      updateProfile: "PUT /api/auth/profile (Bearer token)",
      uploadAvatar: "PUT /api/auth/profile/avatar (Bearer token, form-data image)",
    },
  });
});

app.use("/api/auth", authRoutes);

// Multer / other errors
app.use((err, req, res, next) => {
  res.status(400).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
