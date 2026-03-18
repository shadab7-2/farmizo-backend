const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { adminOnly } = require("../middlewares/admin.middleware");
const {
  getOverviewAnalytics,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
} = require("../controllers/adminAnalytics.controller");

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get("/overview", getOverviewAnalytics);
router.get("/sales", getSalesAnalytics);
router.get("/products", getProductAnalytics);
router.get("/customers", getCustomerAnalytics);

module.exports = router;
