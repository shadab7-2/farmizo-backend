const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller.js");

const { protect } = require("../middlewares/auth.middleware.js");
const { adminOnly } = require("../middlewares/admin.middleware.js");
// (Later you can add isAdmin middleware)

/* =====================================================
   PUBLIC ROUTES
   ===================================================== */

// GET all categories
// /api/categories
router.get("/", getCategories);

// GET category by slug
// /api/categories/plants
router.get("/:slug", getCategoryBySlug);


/* =====================================================
   ADMIN ROUTES
   ===================================================== */

// Create category
// POST /api/categories
router.post("/", protect, adminOnly, createCategory);

// Update category
// PUT /api/categories/:id
router.put("/:id", protect, adminOnly, updateCategory);

// Delete category
// DELETE /api/categories/:id
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
