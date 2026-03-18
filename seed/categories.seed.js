require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/category.model");

const categories = [
  {
    name: "Plants",
    slug: "plants",
    description: "Indoor and outdoor plants from trusted nurseries",
    image: "https://images.pexels.com/photos/14832690/pexels-photo-14832690.jpeg",
    types: ["Indoor", "Outdoor", "Medicinal", "Flowering"],
  },
  {
    name: "Seeds",
    slug: "seeds",
    description: "High quality seeds for farming and gardening",
    image: "https://images.pexels.com/photos/8013848/pexels-photo-8013848.jpeg",
    types: ["Vegetable", "Fruit", "Flower", "Grain"],
  },
  {
    name: "Fertilizers",
    slug: "fertilizers",
    description: "Organic and chemical fertilizers",
    image: "https://images.pexels.com/photos/3777622/pexels-photo-3777622.jpeg",
    types: ["Organic", "Chemical", "Compost", "Bio Fertilizer"],
  },
  {
    name: "Agri Products",
    slug: "agriproducts",
    description: "Pesticides, soil and farming essentials",
    image: "https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg",
    types: ["Pesticide", "Soil", "Growth Booster"],
  },
  {
    name: "Pots & Planters",
    slug: "pots",
    description: "Decorative pots and planters",
    image: "https://images.pexels.com/photos/33238049/pexels-photo-33238049.jpeg",
    types: ["Plastic", "Ceramic", "Clay", "Hanging"],
  },
  {
    name: "Garden Tools",
    slug: "tools",
    description: "Professional gardening tools",
    image: "https://images.pexels.com/photos/6231990/pexels-photo-6231990.jpeg",
    types: ["Hand Tools", "Cutting Tools", "Watering Tools"],
  },
];

const seedCategories = async () => {
  try {
    await connectDB();

    console.log("🌱 Seeding categories...");

    await Category.deleteMany(); // reset
    await Category.insertMany(categories);

    console.log("✅ Categories seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
};

seedCategories();
