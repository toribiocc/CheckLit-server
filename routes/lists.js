const express = require("express");
const mongoose = require("mongoose");
const ShoppingList = require("../models/ShoppingList");
const authenticate = require("../middleware/auth");

const router = express.Router();

// Fields users are allowed to set or update
const allowedFields = [
  "title",
  "store",
  "targetDate",
  "budget",
  "notes",
  "items",
  "totalCost",
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

// All list endpoints require authentication.
router.use(authenticate);

// GET /api/lists
// Return only lists belonging to the logged-in user.
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
// Return one list only if it belongs to the logged-in user.
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
// Create a list owned by the logged-in user.
router.post("/", async (req, res, next) => {
  try {
    const fields = pickAllowedFields(req.body);

    const list = await ShoppingList.create({
      ...fields,
      owner: req.user.id,
    });

    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

// PUT /api/lists/:id
// Update only a list belonging to the logged-in user.
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const fields = pickAllowedFields(req.body);

    // Do not allow an empty or unrelated update.
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
    await list.save();

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/lists/:id
// Delete only a list belonging to the logged-in user.
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