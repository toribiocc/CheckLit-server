
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required."],
      trim: true,
      minlength: [2, "Category name must contain at least 2 characters."],
      maxlength: [50, "Category name cannot exceed 50 characters."],
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [250, "Category description cannot exceed 250 characters."],
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.pre("validate", function () {
  if (this.name) {
    this.name = this.name.trim();
    this.normalizedName = this.name.toLowerCase();
  }
});

module.exports = mongoose.model("Category", categorySchema);
