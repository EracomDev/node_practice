const Product = require("../Models/Product");

// POST /api/products — naya product banao (login required)
const createProduct = async (req, res) => {
  try {
    let { name, description, price, category, stock } = req.body;

    if (!name || price === undefined || price === null || price === "") {
      return res.status(400).json({
        success: false,
        message: "Please send name and price.",
      });
    }

    name = name.trim();

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Product name must be at least 2 characters.",
      });
    }

    price = Number(price);

    if (isNaN(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number (0 or more).",
      });
    }

    if (stock !== undefined && stock !== null && stock !== "") {
      stock = Number(stock);
      if (isNaN(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a valid number (0 or more).",
        });
      }
    }

    const product = await Product.create({
      name,
      description: description ? description.trim() : "",
      price,
      category: category ? category.trim() : "General",
      stock: stock ?? 0,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/products — saare products list karo (public)
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Get All Products Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/products/:id — ek product ki details (public)
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// PUT /api/products/:id — product update karo (login required)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const { name, description, price, category, stock } = req.body;

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Product name must be at least 2 characters.",
        });
      }
      product.name = trimmed;
    }

    if (description !== undefined) {
      product.description = description.trim();
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Price must be a valid number (0 or more).",
        });
      }
      product.price = numPrice;
    }

    if (category !== undefined) {
      product.category = category.trim();
    }

    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a valid number (0 or more).",
        });
      }
      product.stock = numStock;
    }

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// DELETE /api/products/:id — product delete karo (login required)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Product Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
