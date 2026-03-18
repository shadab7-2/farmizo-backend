const Product = require("../models/product.model");
const Order = require("../models/order.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const couponService = require("./coupon.service");

// ==========================
// Create Order
// ==========================
exports.createOrder = async (userId, payload) => {
  const { items, shippingAddress, couponCode, orderNotes } = payload;
  const requiredShippingFields = [
    "fullName",
    "phone",
    "street",
    "city",
    "state",
    "pincode",
    "country",
  ];

  if (!userId) {
    throw new ApiError(401, "Not authorized");
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Cart is empty");
  }

  const isShippingIncomplete = requiredShippingFields.some((field) => {
    const value = shippingAddress?.[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (isShippingIncomplete) {
    throw new ApiError(400, "Shipping address is incomplete");
  }

  if (
    couponCode !== undefined &&
    couponCode !== null &&
    typeof couponCode !== "string"
  ) {
    throw new ApiError(400, "Invalid coupon code");
  }

  const normalizedCouponCode = String(couponCode || "").trim();

  let orderItems = [];
  let subtotal = 0;
  const decrementedItems = [];
  let discountAmount = 0;
  let appliedCouponCode = "";
  let appliedCouponId = null;
  let couponUsageIncremented = false;

  const paymentMethod = String(payload.paymentMethod || "cod").toLowerCase();
  const paymentStatus = String(payload.paymentStatus || (paymentMethod === "cod" ? "pending" : "pending")).toLowerCase();
  const razorpayOrderId = payload.razorpayOrderId || "";
  const razorpayPaymentId = payload.razorpayPaymentId || "";
  const refundStatus = payload.refundStatus || "none";
  const notes = typeof orderNotes === "string" ? orderNotes : "";

  try {
    for (const item of items) {
      const productId = item.productId || item.product?._id || item.product || item._id;
      const quantity = Number(item?.quantity);

      if (!productId) {
        throw new ApiError(400, "Invalid cart item");
      }

      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new ApiError(400, "Invalid item quantity");
      }

      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          isActive: true,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
        { new: true },
      );

      if (!product) {
        const exists = await Product.findById(productId).select("name stock isActive");
        if (!exists || !exists.isActive) {
          throw new ApiError(404, "Product not found");
        }
        throw new ApiError(400, `${exists.name || "Product"} out of stock`);
      }

      const itemTotal = product.price * quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0],
        price: product.price,
        quantity,
      });

      decrementedItems.push({ productId: product._id, quantity });
    }
    if (normalizedCouponCode) {
      const couponResult = await couponService.validateCoupon({
        code: normalizedCouponCode,
        cartTotal: subtotal,
      });
      discountAmount = couponResult.discountAmount;
      appliedCouponCode = couponResult.coupon.code;
      appliedCouponId = couponResult.coupon._id;
      await couponService.incrementUsage(appliedCouponId);
      couponUsageIncremented = true;
    }
  } catch (error) {
    if (decrementedItems.length > 0) {
      await Promise.all(
        decrementedItems.map((item) =>
          Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity },
          }),
        ),
      );
    }
    if (couponUsageIncremented && appliedCouponId) {
      await couponService.decrementUsage(appliedCouponId);
    }
    throw error;
  }

  const shippingCost = subtotal > 500 ? 0 : 60;
  const finalAmount = Math.max(subtotal - discountAmount, 0) + shippingCost;

  // Create Order with timeline
  let order;
  try {
    order = await Order.create({
      user: userId,
      items: orderItems,
      shippingAddress,
      subtotal,
      discountAmount,
      shippingCost,
      finalAmount,
      totalAmount: finalAmount,
      couponCode: appliedCouponCode,
      orderNotes: notes,
      orderStatus: "placed",
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      refundStatus,
      statusTimeline: [
        {
          status: "placed",
          date: new Date(),
        },
      ],
    });
  } catch (error) {
    await Promise.all(
      decrementedItems.map((item) =>
        Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        }),
      ),
    );
    if (couponUsageIncremented && appliedCouponId) {
      await couponService.decrementUsage(appliedCouponId);
    }
    throw error;
  }

  return order;
};

// Keep backward compatibility with existing controller call
exports.create = exports.createOrder;

// ==========================
// Get Orders For User
// ==========================
exports.getByUser = async (userId) => {
  const orders = await Order.find({
    user: userId,
  }).sort({ createdAt: -1 });

  return orders;
};

// ==========================
// Get Order By ID
// ==========================
exports.getById = async (orderId, userId) => {
  const order = await Order.findById(
    orderId
  ).populate("items.product");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.user.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "Not authorized to view this order"
    );
  }

  return order;
};

// ==========================
// Get All Orders (Admin)
// ==========================
exports.getAll = async (query = {}) => {
  const allowedStatuses = [
    "placed",
    "confirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const statusFilter = String(query.status || "all").toLowerCase();
  const dateFilter = String(query.dateFilter || "all").toLowerCase();
  const rawSearch = String(query.search || "").trim();
  const normalizedSearch = rawSearch.replace(/^#/, "");

  const filter = {};

  if (statusFilter !== "all" && allowedStatuses.includes(statusFilter)) {
    filter.orderStatus = statusFilter;
  }

  if (dateFilter !== "all") {
    const now = new Date();
    let startDate = null;

    if (dateFilter === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    if (dateFilter === "this_week") {
      const day = now.getDay();
      const weekStartOffset = day === 0 ? 6 : day - 1;
      startDate = new Date(now);
      startDate.setDate(now.getDate() - weekStartOffset);
      startDate.setHours(0, 0, 0, 0);
    }

    if (dateFilter === "this_month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    if (startDate) {
      filter.createdAt = { $gte: startDate };
    }
  }

  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchRegex = new RegExp(escapedSearch, "i");
    const orFilters = [
      { "shippingAddress.fullName": searchRegex },
      { "shippingAddress.phone": searchRegex },
    ];

    if (mongoose.Types.ObjectId.isValid(normalizedSearch)) {
      orFilters.push({ _id: normalizedSearch });
    }

    const matchedUsers = await User.find({
      $or: [{ name: searchRegex }, { email: searchRegex }],
    }).select("_id");

    if (matchedUsers.length > 0) {
      orFilters.push({
        user: { $in: matchedUsers.map((user) => user._id) },
      });
    }

    filter.$or = orFilters;
  }

  const [orders, filteredCount, allOrdersCount, allStatusBuckets] = await Promise.all([
    Order.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
    Order.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const statusCounts = allStatusBuckets.reduce((acc, bucket) => {
    if (bucket?._id) {
      acc[bucket._id] = bucket.count;
    }
    return acc;
  }, {});

  const summary = {
    totalOrders: allOrdersCount,
    pendingOrders:
      (statusCounts.placed || 0) +
      (statusCounts.confirmed || 0) +
      (statusCounts.shipped || 0) +
      (statusCounts.out_for_delivery || 0),
    deliveredOrders: statusCounts.delivered || 0,
    cancelledOrders: statusCounts.cancelled || 0,
  };

  return {
    orders,
    pagination: {
      page,
      limit,
      totalItems: filteredCount,
      totalPages: Math.max(1, Math.ceil(filteredCount / limit)),
    },
    summary,
  };
};

exports.getAdminById = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate("user", "name email")
    .populate("items.product");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return order;
};

// ==========================
// Update Order Status (Admin)
// ==========================
exports.updateStatus = async (
  orderId,
  status
) => {
  const allowedStatuses = [
    "placed",
    "confirmed",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
  ];

  const normalizedStatus = String(status || "").toLowerCase();

  if (!allowedStatuses.includes(normalizedStatus)) {
    throw new ApiError(
      400,
      "Invalid order status"
    );
  }

  const timelineEntry = {
    status: normalizedStatus,
    date: new Date(),
  };

  // Use atomic update to avoid full-document validation on legacy/incomplete orders.
  const order = await Order.findByIdAndUpdate(
    orderId,
    {
      $set: { orderStatus: normalizedStatus },
      $push: { statusTimeline: timelineEntry },
    },
    { new: true },
  );

  if (!order) {
    throw new ApiError(
      404,
      "Order not found"
    );
  }

  return order;
};
