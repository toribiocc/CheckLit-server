
const express = require("express");
const mongoose = require("mongoose");
const ShoppingList = require("../models/ShoppingList");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const lists = await ShoppingList.find().sort({ createdAt: -1 });
    res.status(200).json(lists);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const list = await ShoppingList.findById(req.params.id);

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

router.post("/", async (req, res, next) => {
  try {
    const list = await ShoppingList.create(req.body);
    res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const list = await ShoppingList.findById(req.params.id);

    if (!list) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

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

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        list.set(field, req.body[field]);
      }
    }

    await list.save();

    res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({
        message: "Shopping list not found.",
      });
    }

    const list = await ShoppingList.findByIdAndDelete(req.params.id);

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
