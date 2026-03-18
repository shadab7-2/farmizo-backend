const Category = require("../models/category.model");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

const generateSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/*
|--------------------------------------------------------------------------
| Get All Active Categories (Public)
|--------------------------------------------------------------------------
| Used in:
| - Homepage
| - Navbar dropdown
| - Categories page
*/
exports.getAllActive = async () => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 });

  return categories;
};

/*
|--------------------------------------------------------------------------
| Get Category By Slug
|--------------------------------------------------------------------------
| Used in:
| - /categories/plants page
*/
exports.getBySlug = async (slug) => {
  const category = await Category.findOne({
    slug,
    isActive: true,
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

/*
|--------------------------------------------------------------------------
| Create Category (Admin)
|--------------------------------------------------------------------------
*/
exports.create = async (payload) => {
  const requiredFields = ["name", "image"];

  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new ApiError(400, `${field} is required`);
    }
  });

  const slug = generateSlug(payload.slug || payload.name);

  const exists = await Category.findOne({ slug });

  if (exists) {
    throw new ApiError(409, "Category slug already exists");
  }

  const category = await Category.create({
    ...payload,
    slug,
  });

  return category;
};

/*
|--------------------------------------------------------------------------
| Update Category (Admin)
|--------------------------------------------------------------------------
*/
exports.update = async (id, updates) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid category id");
  }

  const sanitizedUpdates = { ...updates };
  if (sanitizedUpdates.name || sanitizedUpdates.slug) {
    sanitizedUpdates.slug = generateSlug(
      sanitizedUpdates.slug || sanitizedUpdates.name,
    );

    const duplicate = await Category.findOne({
      slug: sanitizedUpdates.slug,
      _id: { $ne: id },
    });

    if (duplicate) {
      throw new ApiError(409, "Category slug already exists");
    }
  }

  const category = await Category.findByIdAndUpdate(
    id,
    sanitizedUpdates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

/*
|--------------------------------------------------------------------------
| Delete Category (Admin)
|--------------------------------------------------------------------------
| Soft delete (recommended)
*/
exports.remove = async (id) => {
  const category = await Category.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return true;
};
