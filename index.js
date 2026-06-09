// Server entry point — yahan se sab start hota hai
require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/Routes/authRoutes");
const productRoutes = require("./src/Routes/productRoutes");
const categoryRoutes = require("./src/Routes/categoryRoutes");
const cartRoutes = require("./src/Routes/cartRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploaded images browser se open karne ke liye
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    message: "Node Practice API — Auth, Products, Categories & Cart ready",
    routes: {
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      forgotPassword: "POST /api/auth/forgot-password",
      resetPassword: "POST /api/auth/reset-password",
      profile: "GET /api/auth/profile (Bearer token)",
      updateProfile: "PUT /api/auth/profile (Bearer token)",
      uploadAvatar: "PUT /api/auth/profile/avatar (Bearer token, form-data image)",
      getProducts: "GET /api/products",
      getProduct: "GET /api/products/:id",
      createProduct: "POST /api/products (Bearer token)",
      updateProduct: "PUT /api/products/:id (Bearer token)",
      deleteProduct: "DELETE /api/products/:id (Bearer token)",
      getCategories: "GET /api/categories",
      getCategory: "GET /api/categories/:id",
      createCategory: "POST /api/categories (Bearer token)",
      updateCategory: "PUT /api/categories/:id (Bearer token)",
      deleteCategory: "DELETE /api/categories/:id (Bearer token)",
      getCart: "GET /api/cart (Bearer token)",
      addToCart: "POST /api/cart (Bearer token)",
      updateCartItem: "PUT /api/cart/:productId (Bearer token)",
      removeFromCart: "DELETE /api/cart/:productId (Bearer token)",
      clearCart: "DELETE /api/cart (Bearer token)",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cart", cartRoutes);

// Multer / other errors
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message:
        'Send exactly ONE file. Field name must be "image" (type: File). Do not pick 2 files in Postman.',
    });
  }
  res.status(400).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
