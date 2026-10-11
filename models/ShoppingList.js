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

const shoppingItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
    },
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
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const shoppingListSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    store: {
      type: String,
      default: "",
      trim: true,
    },
    targetDate: {
      type: String,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
    },
    items: {
      type: [shoppingItemSchema],
      default: [],
    },
    totalCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

shoppingListSchema.set("toJSON", {
  transform: (document, returned) => {
    returned.id = returned._id.toString();
    return returned;
  },
});

module.exports = mongoose.model("ShoppingList", shoppingListSchema);
