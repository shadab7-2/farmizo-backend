const razorpay = require("../config/razorpay");
const Order = require("../models/order.model");
const ApiError = require("../utils/ApiError");

/* =========================================================
   Refund an order (admin)
========================================================= */
exports.refundOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) throw new ApiError(404, "Order not found");
    if (order.paymentStatus !== "paid" || !order.razorpayPaymentId) {
      throw new ApiError(400, "Refund allowed only for paid online orders");
    }

    const refund = await razorpay.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(order.totalAmount * 100),
      speed: "optimum",
    });

    order.paymentStatus = "refunded";
    order.refundStatus = "refunded";
    order.orderStatus = "cancelled";
    order.statusTimeline.push({ status: "cancelled", date: new Date() });
    await order.save();

    res.json({ success: true, data: { refund } });
  } catch (err) {
    next(err);
  }
};

/* =========================================================
   Payment analytics (admin)
========================================================= */
exports.getPaymentStats = async (req, res, next) => {
  try {
    const [statusAgg, methodAgg] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
      Order.aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    const totals = statusAgg.reduce(
      (acc, row) => {
        acc.totalOrders += row.count;
        acc.totalRevenue += row.revenue;
        if (row._id === "failed") acc.failedPayments = row.count;
        if (row._id === "refunded") acc.refundAmount += row.revenue;
        if (row._id === "paid") acc.successfulPayments = row.count;
        return acc;
      },
      { totalOrders: 0, totalRevenue: 0, failedPayments: 0, refundAmount: 0, successfulPayments: 0 },
    );

    const paymentMethodSplit = methodAgg.map((row) => ({
      method: row._id || "unknown",
      orders: row.count,
      revenue: row.revenue,
    }));

    const successRate =
      totals.totalOrders > 0 ? Number(((totals.successfulPayments / totals.totalOrders) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        totalRevenue: totals.totalRevenue,
        totalOrders: totals.totalOrders,
        failedPayments: totals.failedPayments,
        refundAmount: totals.refundAmount,
        successRate,
        paymentMethodSplit,
      },
    });
  } catch (err) {
    next(err);
  }
};
