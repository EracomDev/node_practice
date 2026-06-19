const Cart = require("../Models/Cart");
const Order = require("../Models/Order");
const Product = require("../Models/Product");

const formatOrder = (order) => ({
  _id: order._id,
  user: order.user,
  items: order.items,
  totalItems: order.totalItems,
  totalAmount: order.totalAmount,
  status: order.status,
  shippingAddress: order.shippingAddress,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

const validateShippingAddress = (address) => {
  if (!address || typeof address !== "object") {
    return "Please send shippingAddress.";
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "pincode",
  ];

  for (const field of requiredFields) {
    if (!address[field] || String(address[field]).trim() === "") {
      return `Please send shippingAddress.${field}.`;
    }
  }

  return null;
};

const restoreStock = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }
};

// POST /api/orders — cart se order place karo
const placeOrder = async (req, res) => {
  const stockUpdates = [];

  try {
    const addressError = validateShippingAddress(req.body.shippingAddress);

    if (addressError) {
      return res.status(400).json({
        success: false,
        message: addressError,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Add products before placing an order.",
      });
    }

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Cart contains an invalid product. Please update your cart.",
        });
      }

      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${item.product.stock} items of "${item.product.name}" available in stock.`,
        });
      }
    }

    for (const item of cart.items) {
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: item.product._id,
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        await restoreStock(stockUpdates);

        return res.status(400).json({
          success: false,
          message: `Only ${item.product.stock} items of "${item.product.name}" available in stock.`,
        });
      }

      stockUpdates.push({
        product: item.product._id,
        quantity: item.quantity,
      });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      lineTotal: item.product.price * item.quantity,
    }));

    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = orderItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const shippingAddress = {
      fullName: req.body.shippingAddress.fullName.trim(),
      phone: req.body.shippingAddress.phone.trim(),
      addressLine1: req.body.shippingAddress.addressLine1.trim(),
      addressLine2: req.body.shippingAddress.addressLine2
        ? req.body.shippingAddress.addressLine2.trim()
        : "",
      city: req.body.shippingAddress.city.trim(),
      state: req.body.shippingAddress.state.trim(),
      pincode: req.body.shippingAddress.pincode.trim(),
    };

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalItems,
      totalAmount,
      shippingAddress,
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: formatOrder(order),
    });
  } catch (error) {
    if (stockUpdates.length > 0) {
      await restoreStock(stockUpdates);
    }

    console.error("Place Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/orders — logged-in user ke saare orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: orders.length,
      orders: orders.map(formatOrder),
    });
  } catch (error) {
    console.error("Get My Orders Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/orders/:id — ek order ki detail
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    res.json({
      success: true,
      order: formatOrder(order),
    });
  } catch (error) {
    console.error("Get Order By Id Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// PUT /api/orders/:id/cancel — pending order cancel karo
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled.",
      });
    }

    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be cancelled. Current status: ${order.status}.`,
      });
    }

    await restoreStock(order.items);

    order.status = "cancelled";
    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully.",
      order: formatOrder(order),
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
