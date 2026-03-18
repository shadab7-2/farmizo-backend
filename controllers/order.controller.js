const orderService = require("../services/order.service");
const Order = require("../models/order.model");
const ApiError = require("../utils/ApiError");
const generateInvoice = require("../utils/invoiceGenerator");
const emailService = require("../services/email.service");

// ==========================
// Create Order
// ==========================
exports.createOrder = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    const shippingAddress = { ...(req.body.shippingAddress || {}) };

    // Normalize legacy clients
    if (!shippingAddress.street && shippingAddress.address) {
      shippingAddress.street = shippingAddress.address;
    }

    const requiredShippingFields = [
      "fullName",
      "phone",
      "street",
      "city",
      "state",
      "pincode",
      "country",
    ];

    const isShippingIncomplete = requiredShippingFields.some((field) => {
      const value = shippingAddress[field];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (isShippingIncomplete) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is incomplete",
      });
    }

    // Strict validation
    if (!/^\d{10}$/.test(String(shippingAddress.phone).trim())) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits",
      });
    }
    
    if (!/^\d{6}$/.test(String(shippingAddress.pincode).trim())) {
      return res.status(400).json({
        success: false,
        message: "Pincode must be exactly 6 digits",
      });
    }

    const hasInvalidQuantity = req.body.items.some((item) => {
      const quantity = Number(item?.quantity);
      return !Number.isFinite(quantity) || quantity <= 0;
    });

    if (hasInvalidQuantity) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item quantity",
      });
    }

    const order = await orderService.createOrder(req.user._id, {
      items: req.body.items,
      shippingAddress,
      couponCode: req.body.couponCode,
    });

    // Fire-and-forget: send order confirmation + invoice emails
    emailService.sendOrderConfirmation(order).catch(() => {});
    emailService.sendInvoiceEmail(order).catch(() => {});

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Get My Orders
// ==========================
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getByUser(req.user._id);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Get Order By ID
// ==========================
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getById(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
//Genrate invoice

exports.downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email role")
      .lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const isOwner = String(order.user?._id || "") === String(req.user?._id || "");
    const isAdmin = req.user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, "You are not allowed to download this invoice");
    }

    generateInvoice(order, res);
  } catch (err) {
    next(err);
  }
};
// ==========================
// Get All Orders (Admin)
// ==========================
exports.getAllOrders = async (req, res, next) => {
  try {
    const result = await orderService.getAll(req.query);

    res.status(200).json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
      summary: result.summary,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Get Single Order (Admin)
// ==========================
exports.getOrderByIdAdmin = async (req, res, next) => {
  try {
    const order = await orderService.getAdminById(req.params.id);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Update Order Status (Admin)
// ==========================
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateStatus(req.params.id, status);

    // Realtime emit is optional; skip safely when socket server is not attached.
    if (global.io?.to) {
      global.io.to(order._id.toString()).emit("orderStatusUpdated", {
        orderId: order._id,
        status: order.orderStatus,
        timeline: order.statusTimeline,
      });
    }

    // Fire-and-forget: send status-specific email notification
    const normalizedStatus = String(order.orderStatus || "").toLowerCase();
    if (normalizedStatus === "shipped") {
      emailService.sendShippingNotification(order).catch(() => {});
    } else if (normalizedStatus === "delivered") {
      emailService.sendDeliveredNotification(order).catch(() => {});
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// ==========================
// Resend Invoice Email (Admin)
// ==========================
exports.resendInvoiceEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email role")
      .lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    await emailService.sendInvoiceEmail(order);

    res.status(200).json({
      success: true,
      message: "Invoice email sent successfully",
    });
  } catch (err) {
    next(err);
  }
};
