const express = require("express");
const mongoose = require("mongoose");
const ShoppingList = require("../models/ShoppingList");
const authenticate = require("../middleware/auth");

const router = express.Router();

const allowedFields = [
  "title",
  "store",
  "targetDate",
  "budget",
  "notes",
  "items",
  "status",
];

function pickAllowedFields(body) {
  const result = {};

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
}

function calculateTotals(items) {
  if (!Array.isArray(items)) {
    const error = new Error("Items must be an array.");
    error.status = 400;
    throw error;
  }

  let totalCost = 0;

  const calculatedItems = items.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      const error = new Error("Each item must be a valid object.");
      error.status = 400;
      throw error;
    }

    const unitPrice = Number(item.unitPrice);
    const quantity = Number(item.quantity);

    if (
      item.unitPrice === "" ||
      item.quantity === "" ||
      !Number.isFinite(unitPrice) ||
      !Number.isFinite(quantity) ||
      unitPrice < 0 ||
      quantity < 0
    ) {
      const error = new Error(
        "Each item must have a valid, non-negative unit price and quantity."
      );
      error.status = 400;
      throw error;
    }

    const totalPrice =
      Math.round(
        (unitPrice * quantity + Number.EPSILON) * 100
      ) / 100;

    totalCost += totalPrice;

    return {
      ...item,
      unitPrice,
      quantity,
      totalPrice,
    };
  });

  totalCost =
    Math.round((totalCost + Number.EPSILON) * 100) / 100;

  return {
    items: calculatedItems,
    totalCost,
  };
}

// All shopping-list routes require authentication.
router.use(authenticate);

// GET /api/lists
// Return only the current user's lists.
router.get("/", async (req, res, next) => {
  try {
    const lists = await ShoppingList.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json(lists);
  } catch (error) {
    next(error);
  }
});

// GET /api/lists/:id
// Return a list only if it belongs to the current user.
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const list = await ShoppingList.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!list) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

// POST /api/lists
// Create a list owned by the current user.
router.post("/", async (req, res, next) => {
  try {
    const fields = pickAllowedFields(req.body);

    const listData = {
      ...fields,
      owner: req.user.id,
    };

    if (fields.items !== undefined) {
      const totals = calculateTotals(fields.items);
      listData.items = totals.items;
      listData.totalCost = totals.totalCost;
    }

    const list = await ShoppingList.create(listData);

    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

// PUT /api/lists/:id
// Update only a list belonging to the current user.
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const fields = pickAllowedFields(req.body);

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "No valid shopping-list fields were provided.",
      });
    }

    const list = await ShoppingList.findOne({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!list) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    list.set(fields);

    // Always recalculate totals from the list's actual items.
    const totals = calculateTotals(list.items);
    list.items = totals.items;
    list.totalCost = totals.totalCost;

    await list.save();

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/lists/:id
// Delete only a list belonging to the current user.
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!list) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    res.status(200).json({
      message: "Shopping list deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;