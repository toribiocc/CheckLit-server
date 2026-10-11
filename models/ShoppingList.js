
const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    default: "",
    trim: true,
  },
  name: {
    type: String,
    required: [true, "Product name is required."],
    trim: true,
    maxlength: 150,
  },
  category: {
    type: String,
    required: [true, "Product category is required."],
    trim: true,
    maxlength: 50,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, "Unit price cannot be negative."],
    validate: {
      validator: Number.isFinite,
      message: "Unit price must be a valid number.",
    },
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.000001, "Quantity must be greater than zero."],
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
  purchaseDate: {
    type: Date,
    default: null,
  },
});

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
      required: [true, "Shopping-list title is required."],
      trim: true,
      minlength: [1, "Shopping-list title cannot be empty."],
      maxlength: 150,
    },
    store: {
      type: String,
      default: "",
      trim: true,
      maxlength: 150,
    },
    targetDate: {
      type: String,
      default: "",
      trim: true,
    },
    budget: {
      type: Number,
      default: 0,
      min: [0, "Budget cannot be negative."],
      max: [1000000, "Budget cannot exceed 1,000,000."],
      validate: {
        validator: Number.isFinite,
        message: "Budget must be a valid number.",
      },
    },
    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
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

shoppingListSchema.pre("validate", function () {
  let totalCost = 0;
  let completedCount = 0;

  for (const item of this.items) {
    const itemTotal =
      Math.round(
        (item.unitPrice * item.quantity + Number.EPSILON) * 100
      ) / 100;

    item.totalPrice = itemTotal;
    totalCost += itemTotal;

    if (item.completed) {
      completedCount += 1;
    } else {
      item.purchaseDate = null;
    }
  }

  this.totalCost =
    Math.round((totalCost + Number.EPSILON) * 100) / 100;

  if (this.items.length === 0 || completedCount === 0) {
    this.status = "Pending";
  } else if (completedCount === this.items.length) {
    this.status = "Completed";
  } else {
    this.status = "In Progress";
  }
});

shoppingListSchema.set("toJSON", {
  transform: (document, returned) => {
    if (returned._id) {
      returned.id = returned._id.toString();
    }

    if (Array.isArray(returned.items)) {
      returned.items = returned.items.map((item) => {
        if (item._id) {
          item.id = item._id.toString();
        }

        return item;
      });
    }

    return returned;
  },
});

module.exports = mongoose.model("ShoppingList", shoppingListSchema);
