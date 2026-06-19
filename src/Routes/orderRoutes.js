const express = require("express");
const router = express.Router();
const protect = require("../Middleware/authMiddleware");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../Controllers/orderController");

// Sab order routes private hain — login token chahiye
router.post("/", protect, placeOrder);
router.get("/", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;
