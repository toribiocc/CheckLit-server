
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [2, "Product name must contain at least 2 characters."],
      maxlength: [100, "Product name cannot exceed 100 characters."],
    },
    category: {
      type: String,
      required: [true, "Product category is required."],
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required."],
      min: [0, "Unit price cannot be negative."],
    },
    unit: {
      type: String,
      required: [true, "Product unit is required."],
      trim: true,
      maxlength: [40, "Product unit cannot exceed 40 characters."],
    },
    icon: {
      type: String,
      default: "🛒",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Product description cannot exceed 500 characters."],
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: 1 });

module.exports = mongoose.model("Product", productSchema);
