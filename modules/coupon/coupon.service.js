const couponController = require("../../controllers/coupon.controller");

module.exports = {
  apply: (req, res, next) => couponController.applyCoupon(req, res, next),
};
