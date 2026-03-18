const express = require("express");
const { applyCoupon } = require("../controllers/coupon.controller");

const router = express.Router();

router.post("/apply", applyCoupon);

module.exports = router;
