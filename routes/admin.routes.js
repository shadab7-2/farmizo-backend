const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { adminOnly } = require("../middlewares/admin.middleware");

const {
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
} = require("../controllers/order.controller");
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/coupon.controller");
const {
  getAllProductsAdmin,
  getProductByIdAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductReviewAdmin,
  getProductReviewsAdmin,
  deleteProductReviewsBulkAdmin,
} = require("../controllers/product.controller");
const upload = require("../middlewares/upload.middleware");
const {
  getDashboardStats,
  getAdminCustomers,
  toggleCustomerStatus,
  deleteUser,
} = require("../controllers/admin.controller");
const {
  refundOrder,
  getPaymentStats,
} = require("../controllers/adminPayment.controller");

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/dashboard/stats", getDashboardStats);
router.get("/customers", getAdminCustomers);
router.patch("/customers/:id/toggle", toggleCustomerStatus);
router.delete("/users/:id", deleteUser);
router.get("/orders", getAllOrders);
router.get("/orders/:id", getOrderByIdAdmin);
router.patch("/orders/:id/status", updateOrderStatus);
router.put("/orders/:id/status", updateOrderStatus);
router.post("/coupons", createCoupon);
router.get("/coupons", getCoupons);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

router.get("/products", getAllProductsAdmin);
router.get("/products/:id", getProductByIdAdmin);
router.post("/products", upload.array("images", 6), createProduct);
router.put("/products/:id", upload.array("images", 6), updateProduct);
router.delete("/products/:id", deleteProduct);
router.get("/reviews", getProductReviewsAdmin);
router.delete("/reviews", deleteProductReviewsBulkAdmin);
router.delete("/reviews/:reviewId", deleteProductReviewAdmin);
router.post("/payments/refund/:orderId", refundOrder);
router.get("/payments/stats", getPaymentStats);

module.exports = router;
