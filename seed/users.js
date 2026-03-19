const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");

// load env even when run from a different cwd
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MONGO_URI =
  process.env.MONGODB_CONNECTION_STRING || process.env.MONGO_URI || "";

const createAdmin = async () => {
  if (!MONGO_URI) {
    console.error(
      "❌ Missing MONGODB_CONNECTION_STRING or MONGO_URI in environment variables."
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);

  try {
    // ensure a single canonical admin account
    await User.deleteOne({ email: "admin@farmizo.com" });

    const admin = await User.create({
      name: "Admin",
      email: "admin@farmizo.com",
      // let the model pre-save hook hash this once
      password: "admin123",
      role: "admin",
    });

    console.log("Admin Created ✅", admin.email);
  } catch (err) {
    console.error("Failed to create admin:", err);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
};

createAdmin();
