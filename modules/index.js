const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
  });
});

router.use("/auth", require("./auth/auth.routes"));
router.use("/products", require("./product/product.routes"));
router.use("/orders", require("./order/order.routes"));
router.use("/coupons", require("./coupon/coupon.routes"));
router.use("/categories", require("./category/category.routes"));

// Legacy/other routes (kept intact)
router.use("/users", require("../routes/user.routes"));
router.use("/cart", require("../routes/cart.routes"));
router.use("/wishlist", require("../routes/wishlist.routes"));
router.use("/payment", require("../routes/payment.routes"));
router.use("/delivery", require("../routes/delivery.routes"));
router.use("/admin/analytics", require("../routes/adminAnalytics.routes"));
router.use("/admin", require("../routes/admin.routes"));

module.exports = router;
