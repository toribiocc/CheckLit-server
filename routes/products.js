
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Category = require("../models/Category");
const ShoppingList = require("../models/ShoppingList");
const authenticate = require("../middleware/auth");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

async function findCategory(name) {
  if (typeof name !== "string" || !name.trim()) {
    return null;
  }

  return Category.findOne({
    normalizedName: name.trim().toLowerCase(),
  });
}

function pickProductFields(body) {
  const fields = {};

  const allowedFields = [
    "name",
    "category",
    "unitPrice",
    "unit",
    "icon",
    "description",
  ];

  for (const field of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      fields[field] = body[field];
    }
  }

  return fields;
}

async function validateProductFields(fields, isCreate = false) {
  if (
    isCreate ||
    Object.prototype.hasOwnProperty.call(fields, "name")
  ) {
    if (
      typeof fields.name !== "string" ||
      fields.name.trim().length < 2 ||
      fields.name.trim().length > 100
    ) {
      throw Object.assign(
        new Error("Product name must contain 2 to 100 characters."),
        { status: 400 }
      );
    }

    fields.name = fields.name.trim();
  }

  if (
    isCreate ||
    Object.prototype.hasOwnProperty.call(fields, "category")
  ) {
    const category = await findCategory(fields.category);

    if (!category) {
      throw Object.assign(
        new Error("Select a category that exists in the database."),
        { status: 400 }
      );
    }

    fields.category = category.name;
  }

  if (
    isCreate ||
    Object.prototype.hasOwnProperty.call(fields, "unitPrice")
  ) {
    if (
      fields.unitPrice === "" ||
      fields.unitPrice === null ||
      !Number.isFinite(Number(fields.unitPrice)) ||
      Number(fields.unitPrice) < 0
    ) {
      throw Object.assign(
        new Error("Unit price must be a valid non-negative number."),
        { status: 400 }
      );
    }

    fields.unitPrice = Number(fields.unitPrice);
  }

  if (
    isCreate ||
    Object.prototype.hasOwnProperty.call(fields, "unit")
  ) {
    if (
      typeof fields.unit !== "string" ||
      !fields.unit.trim() ||
      fields.unit.trim().length > 40
    ) {
      throw Object.assign(
        new Error("Product unit is required and cannot exceed 40 characters."),
        { status: 400 }
      );
    }

    fields.unit = fields.unit.trim();
  }

  for (const field of ["icon", "description"]) {
    if (!Object.prototype.hasOwnProperty.call(fields, field)) {
      continue;
    }

    if (typeof fields[field] !== "string") {
      throw Object.assign(
        new Error(`${field} must be a string.`),
        { status: 400 }
      );
    }

    fields[field] = fields[field].trim();
  }

  if (
    typeof fields.description === "string" &&
    fields.description.length > 500
  ) {
    throw Object.assign(
      new Error("Product description cannot exceed 500 characters."),
      { status: 400 }
    );
  }

  return fields;
}

async function synchronizeProductPrices(productId, newPrice) {
  const productIdString = productId.toString();

  const lists = await ShoppingList.find({
    "items.productId": productIdString,
  });

  const updatedAt = new Date();

  for (const list of lists) {
    const rawList = list.toObject();

    const updatedItems = rawList.items.map((item) => {
      if (String(item.productId) !== productIdString) {
        return item;
      }

      const quantity = Number(item.quantity);

      return {
        ...item,
        unitPrice: newPrice,
        totalPrice: roundCurrency(newPrice * quantity),
      };
    });

    const totalCost = roundCurrency(
      updatedItems.reduce(
        (total, item) => total + Number(item.totalPrice || 0),
        0
      )
    );

    await ShoppingList.collection.updateOne(
      { _id: list._id },
      {
        $set: {
          items: updatedItems,
          totalCost,
          updatedAt,
        },
      }
    );
  }

  return lists.length;
}

router.get("/", async (req, res, next) => {
  try {
    const products = await Product.find().sort({ name: 1 });

    res.status(200).json(products);
  } catch (error) {
    next(error);
  }
});

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

router.post("/", authenticate, requireAdmin, async (req, res, next) => {
  try {
    const fields = pickProductFields(req.body);
    const validatedFields = await validateProductFields(fields, true);
    const product = await Product.create(validatedFields);

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticate, requireAdmin, async (req, res, next) => {
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

    const fields = pickProductFields(req.body);

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({
        message: "Provide at least one valid product field to update.",
      });
    }

    const validatedFields = await validateProductFields(fields);

    const previousPrice = product.unitPrice;

    product.set(validatedFields);
    await product.save();

    let updatedListsCount = 0;

    if (previousPrice !== product.unitPrice) {
      updatedListsCount = await synchronizeProductPrices(
        product._id,
        product.unitPrice
      );
    }

    res.status(200).json({
      ...product.toJSON(),
      updatedListsCount,
    });
  } catch (error) {
    next(error);
  }
});

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
      id: product._id.toString(),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
