
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const authenticate = require("../middleware/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select(
      "_id name email role createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/", async (req, res, next) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        message: "Name is required.",
      });
    }

    const cleanName = name.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must be between 2 and 100 characters.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { name: cleanName } },
      { new: true, runValidators: true }
    ).select("_id name email role createdAt updatedAt");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({
        message: "New password must be between 8 and 72 characters.",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const currentPasswordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!currentPasswordMatches) {
      return res.status(400).json({
        message: "Current password is incorrect.",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
