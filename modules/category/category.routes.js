const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { adminOnly } = require("../../middlewares/admin.middleware");
const controller = require("./category.controller");

const router = express.Router();

router.get("/", controller.getCategories);
router.get("/:slug", controller.getCategoryBySlug);

router.post("/", protect, adminOnly, controller.createCategory);
router.put("/:id", protect, adminOnly, controller.updateCategory);
router.delete("/:id", protect, adminOnly, controller.deleteCategory);

module.exports = router;
