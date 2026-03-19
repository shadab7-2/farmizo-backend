const express = require("express");
const controller = require("./coupon.controller");

const router = express.Router();

router.post("/apply", controller.applyCoupon);

module.exports = router;
