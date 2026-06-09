const express = require("express");
const router = express.Router();
const protect = require("../Middleware/authMiddleware");
const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../Controllers/categoryController");

// Public — token ki zaroorat nahi
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Private — pehle protect middleware (login token chahiye)
router.post("/", protect, createCategory);
router.put("/:id", protect, updateCategory);
router.delete("/:id", protect, deleteCategory);

module.exports = router;
