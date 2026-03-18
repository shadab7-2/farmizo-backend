const express = require("express");

const router = express.Router();

// Health check route
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy 🚀",
  });
});

// Future routes
router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/products", require("./product.routes"));
router.use("/categories", require("./category.routes"));
router.use("/cart", require("./cart.routes"));
router.use("/orders", require("./order.routes"));
router.use("/coupons", require("./coupon.routes"));
router.use("/wishlist", require("./wishlist.routes"));
router.use("/payment", require("./payment.routes"));
router.use("/delivery", require("./delivery.routes"));

router.use("/admin/analytics", require("./adminAnalytics.routes"));
router.use("/admin", require("./admin.routes"));

module.exports = router;
