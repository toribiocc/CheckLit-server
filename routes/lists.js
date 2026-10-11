
const express = require("express");
const mongoose = require("mongoose");
const ShoppingList = require("../models/ShoppingList");
const Product = require("../models/Product");
const authenticate = require("../middleware/auth");

const router = express.Router();

const editableFields = [
  "title",
  "store",
  "targetDate",
  "budget",
  "notes",
  "items",
];

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function pickAllowedFields(body) {
  const fields = {};

  for (const field of editableFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      fields[field] = body[field];
    }
  }

  return fields;
}

function validateListFields(fields, isCreate = false) {
  if (
    (isCreate || Object.prototype.hasOwnProperty.call(fields, "title")) &&
    (typeof fields.title !== "string" ||
      !fields.title.trim() ||
      fields.title.trim().length > 150)
  ) {
    throw createError(
      "Shopping-list title is required and cannot exceed 150 characters."
    );
  }

  for (const field of ["store", "targetDate", "notes"]) {
    if (!Object.prototype.hasOwnProperty.call(fields, field)) {
      continue;
    }

    if (typeof fields[field] !== "string") {
      throw createError(`${field} must be a string.`);
    }

    fields[field] = fields[field].trim();
  }

  if (
    Object.prototype.hasOwnProperty.call(fields, "store") &&
    fields.store.length > 150
  ) {
    throw createError("Store name cannot exceed 150 characters.");
  }

  if (
    Object.prototype.hasOwnProperty.call(fields, "notes") &&
    fields.notes.length > 2000
  ) {
    throw createError("Notes cannot exceed 2000 characters.");
  }

  if (Object.prototype.hasOwnProperty.call(fields, "title")) {
    fields.title = fields.title.trim();
  }

  if (Object.prototype.hasOwnProperty.call(fields, "budget")) {
    const budget = Number(fields.budget);

    if (
      fields.budget === "" ||
      fields.budget === null ||
      !Number.isFinite(budget) ||
      budget < 0
    ) {
      throw createError("Budget must be a valid non-negative number.");
    }

    fields.budget = budget;
  }

  return fields;
}

function getExistingItem(list, input, index) {
  if (!list) return null;

  const suppliedId = String(input.id || input._id || "");

  if (suppliedId) {
    const matchedById = list.items.find(
      (item) => item._id && item._id.toString() === suppliedId
    );

    if (matchedById) return matchedById;
  }

  const productId = String(input.productId || "");

  if (productId) {
    const matchedByProduct = list.items.find(
      (item) => String(item.productId || "") === productId
    );

    if (matchedByProduct) return matchedByProduct;
  }

  const legacyItem = list.items[index];

  if (
    legacyItem &&
    !legacyItem.productId &&
    !productId &&
    legacyItem.name === input.name
  ) {
    return legacyItem;
  }

  return null;
}

async function prepareItems(inputItems, existingList = null) {
  if (!Array.isArray(inputItems)) {
    throw createError("Items must be an array.");
  }

  const prepared = [];

  for (let index = 0; index < inputItems.length; index += 1) {
    const input = inputItems[index];

    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw createError("Each shopping-list item must be an object.");
    }

    const productId = String(input.productId || "").trim();
    const quantity = Number(input.quantity);

    if (
      input.quantity === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      throw createError("Each item quantity must be greater than zero.");
    }

    if (
      input.completed !== undefined &&
      typeof input.completed !== "boolean"
    ) {
      throw createError("The purchased status must be a boolean.");
    }

    const previous = getExistingItem(existingList, input, index);

    let product = null;

    if (productId && mongoose.isValidObjectId(productId)) {
      product = await Product.findById(productId);
    }

    if (!product && !previous) {
      throw createError(
        "A selected product no longer exists in the catalog. Refresh the catalog and select an available product."
      );
    }

    if (!product && previous && productId !== String(previous.productId || "")) {
      throw createError(
        "The selected product is not available in the catalog."
      );
    }

    if (!product && previous && previous.productId && !productId) {
      throw createError("The selected item is missing its product identifier.");
    }

    if (!product && previous && !previous.productId && productId) {
      throw createError("The selected item could not be verified.");
    }

    const completed =
      input.completed === undefined
        ? Boolean(previous?.completed)
        : input.completed;

    let purchaseDate = null;

    if (completed) {
      if (previous?.completed && previous.purchaseDate) {
        purchaseDate = previous.purchaseDate;
      } else {
        purchaseDate = new Date();
      }
    }

    const item = {
      ...(previous?._id ? { _id: previous._id } : {}),
      productId: product
        ? product._id.toString()
        : String(previous.productId || ""),
      name: product ? product.name : previous.name,
      category: product ? product.category : previous.category,
      unitPrice: product ? product.unitPrice : previous.unitPrice,
      quantity,
      unit: product ? product.unit : previous.unit,
      totalPrice: roundCurrency(
        (product ? product.unitPrice : previous.unitPrice) * quantity
      ),
      completed,
      purchaseDate,
    };

    prepared.push(item);
  }

  const mergedItems = [];
  const productIndexes = new Map();

  for (const item of prepared) {
    const productId = String(item.productId || "");

    if (!productId) {
      mergedItems.push(item);
      continue;
    }

    if (!productIndexes.has(productId)) {
      productIndexes.set(productId, mergedItems.length);
      mergedItems.push(item);
      continue;
    }

    const existingIndex = productIndexes.get(productId);
    const existing = mergedItems[existingIndex];

    existing.quantity = roundCurrency(existing.quantity + item.quantity);
    existing.completed = existing.completed && item.completed;
    existing.purchaseDate =
      existing.completed
        ? existing.purchaseDate || item.purchaseDate
        : null;
    existing.totalPrice = roundCurrency(
      existing.unitPrice * existing.quantity
    );
  }

  return mergedItems;
}

function recalculateListStatus(list) {
  const items = list.items || [];
  const completedCount = items.filter((item) => item.completed).length;

  if (items.length === 0 || completedCount === 0) {
    list.status = "Pending";
  } else if (completedCount === items.length) {
    list.status = "Completed";
  } else {
    list.status = "In Progress";
  }
}

router.use(authenticate);

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

router.post("/", async (req, res, next) => {
  try {
    const fields = validateListFields(pickAllowedFields(req.body), true);

    const items = await prepareItems(
      fields.items === undefined ? [] : fields.items
    );

    const list = new ShoppingList({
      ...fields,
      items,
      owner: req.user.id,
    });

    recalculateListStatus(list);
    await list.save();

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

    const fields = validateListFields(pickAllowedFields(req.body));

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid shopping-list field to update.",
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

    if (Object.prototype.hasOwnProperty.call(fields, "items")) {
      list.items = await prepareItems(fields.items, list);
      delete fields.items;
    }

    list.set(fields);
    recalculateListStatus(list);

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
      id: list._id.toString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
