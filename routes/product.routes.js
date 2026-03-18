const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { adminOnly } = require("../middlewares/admin.middleware");
const router = express.Router();

const {
  getAllProducts,
  searchProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  getRelatedProducts,
  createProductReview,
  updateProductReview,
  deleteProductReview,
  getProductReviews,
} = require("../controllers/product.controller");

// Public routes

// ==========================
// Admin Product Routes
// ==========================

// POST /api/products
router.post("/", protect, adminOnly, createProduct);

// PUT /api/products/:id
router.put("/:id", protect, adminOnly, updateProduct);

// DELETE /api/products/:id
router.delete("/:id", protect, adminOnly, deleteProduct);

// GET /api/products
router.get("/", getAllProducts);

// Search products
router.get("/search", searchProducts);

// Related products
router.get("/:slug/related", getRelatedProducts);

// Reviews
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);
router.put("/:id/reviews", protect, updateProductReview);
router.delete("/:id/reviews", protect, deleteProductReview);

// GET /api/products/:slug
router.get("/:slug", getProductBySlug);

module.exports = router;
