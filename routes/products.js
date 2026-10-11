const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const authenticate = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// GET /api/products
// Public: view all products
router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: 1 });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id
// Public: view one product
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// POST /api/products
// Admin only: create a product
router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id
// Admin only: update a product
router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id
// Admin only: delete a product
router.delete("/:id", authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found.",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;