const asyncHandler = require("../../utils/asyncHandler");
const service = require("./coupon.service");

exports.applyCoupon = asyncHandler((req, res, next) => service.apply(req, res, next));
