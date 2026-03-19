const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { adminOnly } = require("../../middlewares/admin.middleware");
const validate = require("../../middlewares/validate.middleware");
const { createProductSchema, updateProductSchema } = require("./product.validation");
const controller = require("./product.controller");

const router = express.Router();

router.post("/", protect, adminOnly, validate({ body: createProductSchema }), controller.createProduct);
router.put("/:id", protect, adminOnly, validate({ body: updateProductSchema }), controller.updateProduct);
router.delete("/:id", protect, adminOnly, controller.deleteProduct);

router.get("/", controller.getAllProducts);
router.get("/search", controller.searchProducts);
router.get("/:slug/related", controller.getRelatedProducts);

router.get("/:id/reviews", controller.getProductReviews);
router.post("/:id/reviews", protect, controller.createProductReview);
router.put("/:id/reviews", protect, controller.updateProductReview);
router.delete("/:id/reviews", protect, controller.deleteProductReview);

router.get("/:slug", controller.getProductBySlug);

module.exports = router;
