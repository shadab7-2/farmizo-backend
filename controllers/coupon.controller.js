const couponService = require("../services/coupon.service");

exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;

    const result = await couponService.validateCoupon({ code, cartTotal });

    return res.status(200).json({
      success: true,
      discount: result.discountAmount,
      newTotal: result.finalTotal,
      coupon: {
        code: result.coupon.code,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.createCoupon(req.body);

    return res.status(201).json({
      success: true,
      message: "Coupon created",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCoupons = async (req, res, next) => {
  try {
    const coupons = await couponService.getAllCoupons();
    return res.status(200).json({
      success: true,
      data: coupons,
      count: coupons.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Coupon updated",
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    await couponService.deleteCoupon(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Coupon deleted",
    });
  } catch (error) {
    next(error);
  }
};
