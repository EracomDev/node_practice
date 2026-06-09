const Cart = require("../Models/Cart");
const Product = require("../Models/Product");

const formatCart = (cart) => {
  const items = cart.items.map((item) => {
    const product = item.product;
    const lineTotal = product.price * item.quantity;

    return {
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
      },
      quantity: item.quantity,
      lineTotal,
    };
  });

  const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    _id: cart._id,
    user: cart.user,
    items,
    totalItems,
    totalAmount,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

// GET /api/cart — logged-in user ka cart
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await cart.populate("items.product");

    res.json({
      success: true,
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Get Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// POST /api/cart — cart mein product add karo
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Please send productId.",
      });
    }

    const qty = quantity === undefined || quantity === null || quantity === "" ? 1 : Number(quantity);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock.`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQty = existingItem.quantity + qty;

      if (product.stock < newQty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available in stock.`,
        });
      }

      existingItem.quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    await cart.populate("items.product");

    res.status(201).json({
      success: true,
      message: "Product added to cart.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Add To Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// PUT /api/cart/:productId — item ki quantity update karo
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity === undefined || quantity === null || quantity === "") {
      return res.status(400).json({
        success: false,
        message: "Please send quantity.",
      });
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1.",
      });
    }

    const product = await Product.findById(req.params.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock.`,
      });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find(
      (entry) => entry.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart.",
      });
    }

    item.quantity = qty;
    await cart.save();
    await cart.populate("items.product");

    res.json({
      success: true,
      message: "Cart item updated.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Update Cart Item Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// DELETE /api/cart/:productId — cart se ek product hatao
const removeFromCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart.",
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.json({
      success: true,
      message: "Product removed from cart.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Remove From Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// DELETE /api/cart — poora cart khali karo
const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: "Cart cleared.",
      cart: formatCart(cart),
    });
  } catch (error) {
    console.error("Clear Cart Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
};
