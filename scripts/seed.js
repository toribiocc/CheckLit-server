const dns = require("node:dns");

// Use the same DNS servers configured in app.js
dns.setServers(["1.1.1.1", "8.8.8.8"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function seedAdmin() {
  try {
    const {
      MONGO_URI,
      ADMIN_NAME,
      ADMIN_EMAIL,
      ADMIN_PASSWORD,
    } = process.env;

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env.");
    }

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set in .env."
      );
    }

    if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
      throw new Error(
        "ADMIN_PASSWORD must be between 8 and 72 characters."
      );
    }

    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const email = ADMIN_EMAIL.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const admin = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          name: ADMIN_NAME.trim(),
          email,
          password: hashedPassword,
          role: "admin",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    console.log(`Admin account ready: ${admin.email}`);
    console.log("Role: admin");
  } catch (error) {
    console.error("Failed to seed admin account:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seedAdmin();