const mongoose = require("mongoose");
const generateSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
|--------------------------------------------------------------------------
| Category Schema
|--------------------------------------------------------------------------
| This schema controls:
| - Category pages (/categories/plants)
| - Sidebar filters (types)
| - Homepage category cards
| - Product filtering
| - Admin enable/disable
*/

const categorySchema = new mongoose.Schema(
  {
    // Display name (UI)
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // URL friendly identifier
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // 🔥 faster queries
    },

    // Category description (SEO + UI)
    description: {
      type: String,
      default: "",
    },

    // Image shown on homepage & category page
    image: {
      type: String,
      required: true,
    },

    /*
    |--------------------------------------------------------------------------
    | Dynamic Filters
    |--------------------------------------------------------------------------
    | This powers the sidebar filter automatically
    | Example:
    | Plants -> ["Indoor","Outdoor","Medicinal"]
    | Seeds -> ["Vegetable","Flower","Herb"]
    */
    types: [
      {
        type: String,
        trim: true,
      },
    ],

    // For admin enable/disable category
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Order on homepage
    sortOrder: {
      type: Number,
      default: 0,
    },

    // SEO (important later)
    seoTitle: String,
    seoDescription: String,
  },
  {
    timestamps: true,
  }
);

/*
|--------------------------------------------------------------------------
| Prevent duplicate slugs case-insensitive
|--------------------------------------------------------------------------
*/
categorySchema.index({ slug: 1 }, { unique: true });

categorySchema.pre("validate", function () {
  if ((!this.slug || this.isModified("name")) && this.name) {
    this.slug = generateSlug(this.name);
  }
});

module.exports = mongoose.model("Category", categorySchema);
