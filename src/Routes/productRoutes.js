const express = require("express");
const router = express.Router();
const protect = require("../Middleware/authMiddleware");
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../Controllers/productController");

// Public — token ki zaroorat nahi
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Private — pehle protect middleware (login token chahiye)
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
