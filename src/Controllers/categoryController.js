const Category = require("../Models/Category");

// POST /api/categories — nayi category banao (login required)
const createCategory = async (req, res) => {
  try {
    let { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Please send category name.",
      });
    }

    name = name.trim();

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category name must be at least 2 characters.",
      });
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists.",
      });
    }

    const category = await Category.create({
      name,
      description: description ? description.trim() : "",
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
    });
  } catch (error) {
    console.error("Create Category Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/categories — saari categories list karo (public)
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Get All Categories Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// GET /api/categories/:id — ek category ki details (public)
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error("Get Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// PUT /api/categories/:id — category update karo (login required)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const { name, description } = req.body;

    if (name !== undefined) {
      const trimmed = name.trim();
      if (trimmed.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Category name must be at least 2 characters.",
        });
      }

      const existing = await Category.findOne({
        name: trimmed,
        _id: { $ne: category._id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Category with this name already exists.",
        });
      }

      category.name = trimmed;
    }

    if (description !== undefined) {
      category.description = description.trim();
    }

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully.",
      category,
    });
  } catch (error) {
    console.error("Update Category Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

// DELETE /api/categories/:id — category delete karo (login required)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Category Error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong.",
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
