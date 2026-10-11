
const express = require("express");
const mongoose = require("mongoose");
const Category = require("../models/Category");
const Product = require("../models/Product");
const ShoppingList = require("../models/ShoppingList");
const authenticate = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        message: "Category name is required.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description:
        typeof description === "string" ? description.trim() : "",
    });

    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found.",
      });
    }

    const previousName = category.name;

    if (Object.prototype.hasOwnProperty.call(req.body, "name")) {
      if (
        typeof req.body.name !== "string" ||
        !req.body.name.trim()
      ) {
        return res.status(400).json({
          message: "Category name must be a non-empty string.",
        });
      }

      category.name = req.body.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "description")) {
      if (typeof req.body.description !== "string") {
        return res.status(400).json({
          message: "Category description must be a string.",
        });
      }

      category.description = req.body.description.trim();
    }

    if (
      !Object.prototype.hasOwnProperty.call(req.body, "name") &&
      !Object.prototype.hasOwnProperty.call(req.body, "description")
    ) {
      return res.status(400).json({
        message: "Provide a category name or description to update.",
      });
    }

    await category.save();

    if (previousName !== category.name) {
      const previousNamePattern = {
        $regex: `^${escapeRegex(previousName)}$`,
        $options: "i",
      };

      await Promise.all([
        Product.updateMany(
          { category: previousNamePattern },
          { $set: { category: category.name } }
        ),
        ShoppingList.updateMany(
          { "items.category": previousNamePattern },
          {
            $set: {
              "items.$[item].category": category.name,
            },
          },
          {
            arrayFilters: [
              { "item.category": previousNamePattern },
            ],
          }
        ),
      ]);
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
});

router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(404).json({
          message: "Category not found.",
        });
      }

      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          message: "Category not found.",
        });
      }

      const categoryPattern = {
        $regex: `^${escapeRegex(category.name)}$`,
        $options: "i",
      };

      const assignedProduct = await Product.findOne({
        category: categoryPattern,
      }).select("_id");

      if (assignedProduct) {
        return res.status(409).json({
          message:
            "This category cannot be deleted while products are assigned to it. Reassign or delete those products first.",
        });
      }

      await Category.deleteOne({ _id: category._id });

      res.status(200).json({
        message: "Category deleted successfully.",
        id: category._id.toString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
