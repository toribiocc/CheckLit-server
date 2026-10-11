const mongoose = require("mongoose");

const categories = [
  "Vegetables",
  "Fruits",
  "Meat",
  "Seafood",
  "Seasonings",
  "Oils",
  "Dairy",
  "Bakery",
  "Snacks",
  "Beverage",
  "Other",
];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: categories,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
