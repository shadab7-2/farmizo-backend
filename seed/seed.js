require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../config/db");

const User = require("../models/User");
const Product = require("../models/Product");

const users = require("./users");
const products = require("./products");

const seedData = async () => {
  try {
    await connectDB();

    console.log("🔥 Clearing database...");

    await User.deleteMany();
    await Product.deleteMany();

    console.log("👤 Seeding users...");
    await User.insertMany(users);

    console.log("🌱 Seeding products...");
    await Product.insertMany(products);

    console.log("✅ Database seeded successfully");

    process.exit();
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

seedData();
