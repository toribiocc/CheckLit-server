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
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
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
      validate: {
        validator: Number.isFinite,
        message: "Unit price must be a valid number.",
      },
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isFinite,
        message: "Quantity must be a valid number.",
      },
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
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
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
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
      validate: {
        validator: Number.isFinite,
        message: "Budget must be a valid number.",
      },
    },
    notes: {
      type: String,
      default: "",
      trim: true,
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

// Calculate item totals and the list total before validation.
shoppingListSchema.pre("validate", function () {
  let total = 0;

  for (const item of this.items) {
    const itemTotal = Math.round(
      (item.unitPrice * item.quantity + Number.EPSILON) * 100
    ) / 100;

    item.totalPrice = itemTotal;
    total += itemTotal;
  }

  this.totalCost =
    Math.round((total + Number.EPSILON) * 100) / 100;
});

shoppingListSchema.set("toJSON", {
  transform: (document, returned) => {
    if (returned._id) {
      returned.id = returned._id.toString();
    }

    return returned;
  },
});

module.exports = mongoose.model("ShoppingList", shoppingListSchema);