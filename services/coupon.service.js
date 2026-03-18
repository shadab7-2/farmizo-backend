const Coupon = require("../models/coupon.model");
const ApiError = require("../utils/ApiError");

const normalizeCode = (code = "") => String(code).trim().toUpperCase();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const calculateDiscountAmount = (coupon, cartTotal) => {
  const total = toNumber(cartTotal, 0);
  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (total * coupon.discountValue) / 100;
    if (coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
    if (coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  }

  discountAmount = Math.max(0, Math.min(discountAmount, total));
  const finalTotal = Math.max(total - discountAmount, 0);

  return {
    discountAmount: Number(discountAmount.toFixed(2)),
    finalTotal: Number(finalTotal.toFixed(2)),
  };
};

const assertCouponIsUsable = (coupon, total) => {
  if (!coupon) {
    throw new ApiError(404, "Coupon invalid");
  }

  if (!coupon.isActive) {
    throw new ApiError(400, "Coupon inactive");
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(400, "Coupon expired");
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  if (total < coupon.minCartValue) {
    throw new ApiError(
      400,
      `Minimum order value not reached. Minimum is ${coupon.minCartValue}`,
    );
  }
};

const sanitizeCouponPayload = (payload = {}, { isUpdate = false, currentType = "" } = {}) => {
  const data = { ...payload };

  if (!isUpdate || data.code !== undefined) {
    data.code = normalizeCode(data.code);
    if (!data.code) {
      throw new ApiError(400, "Coupon code is required");
    }
  }

  if (!isUpdate || data.discountType !== undefined) {
    if (!["percentage", "fixed"].includes(data.discountType)) {
      throw new ApiError(400, "Invalid discount type");
    }
  }

  const effectiveType = data.discountType || currentType;

  if (!isUpdate || data.discountValue !== undefined) {
    data.discountValue = toNumber(data.discountValue, NaN);
    if (!Number.isFinite(data.discountValue) || data.discountValue <= 0) {
      throw new ApiError(400, "Discount value must be greater than 0");
    }

    if (effectiveType === "percentage" && data.discountValue > 100) {
      throw new ApiError(400, "Percentage discount cannot be more than 100");
    }
  }

  if (data.minCartValue !== undefined) {
    data.minCartValue = toNumber(data.minCartValue, NaN);
    if (!Number.isFinite(data.minCartValue) || data.minCartValue < 0) {
      throw new ApiError(400, "minCartValue must be 0 or greater");
    }
  }

  if (data.maxDiscount !== undefined) {
    data.maxDiscount = toNumber(data.maxDiscount, NaN);
    if (!Number.isFinite(data.maxDiscount) || data.maxDiscount < 0) {
      throw new ApiError(400, "maxDiscount must be 0 or greater");
    }
  }

  if (data.usageLimit !== undefined) {
    data.usageLimit = toNumber(data.usageLimit, NaN);
    if (!Number.isFinite(data.usageLimit) || data.usageLimit < 0) {
      throw new ApiError(400, "usageLimit must be 0 or greater");
    }
  }

  if (!isUpdate || data.expiresAt !== undefined) {
    const expiry = new Date(data.expiresAt);
    if (Number.isNaN(expiry.getTime())) {
      throw new ApiError(400, "Invalid coupon expiry date");
    }
    data.expiresAt = expiry;
  }

  return data;
};

exports.validateCoupon = async ({ code, cartTotal }) => {
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) {
    throw new ApiError(400, "Coupon code is required");
  }

  const total = Number(cartTotal);
  if (!Number.isFinite(total) || total <= 0) {
    throw new ApiError(400, "Invalid cart total");
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });
  assertCouponIsUsable(coupon, total);

  const { discountAmount, finalTotal } = calculateDiscountAmount(coupon, total);

  return {
    success: true,
    coupon,
    discountAmount,
    finalTotal,
  };
};

exports.incrementUsage = async (couponId) => {
  const updated = await Coupon.findOneAndUpdate(
    {
      _id: couponId,
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      $expr: {
        $or: [
          { $eq: ["$usageLimit", 0] },
          { $lt: ["$usedCount", "$usageLimit"] },
        ],
      },
    },
    { $inc: { usedCount: 1 } },
    { new: true },
  );

  if (!updated) {
    throw new ApiError(400, "Coupon usage limit reached");
  }

  return updated;
};

exports.decrementUsage = async (couponId) => {
  await Coupon.findOneAndUpdate(
    { _id: couponId, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};

exports.createCoupon = async (payload) => {
  const coupon = await Coupon.create(sanitizeCouponPayload(payload));
  return coupon;
};

exports.getAllCoupons = async () => {
  return Coupon.find().sort({ createdAt: -1 });
};

exports.updateCoupon = async (id, payload) => {
  const existing = await Coupon.findById(id).select("discountType");
  if (!existing) {
    throw new ApiError(404, "Coupon not found");
  }

  const nextPayload = sanitizeCouponPayload(payload, {
    isUpdate: true,
    currentType: existing.discountType,
  });

  const coupon = await Coupon.findByIdAndUpdate(id, nextPayload, { new: true, runValidators: true });
  return coupon;
};

exports.deleteCoupon = async (id) => {
  const deleted = await Coupon.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Coupon not found");
  }
  return deleted;
};
