const express = require("express");
const { adminOnly } = require("../middlewares/admin.middleware");
const {downloadInvoice} = require("../controllers/order.controller");

const router = express.Router();

const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  resendInvoiceEmail,
} = require("../controllers/order.controller");

const { protect } = require("../middlewares/auth.middleware");

// ==========================
// User Order Routes
// ==========================

// POST /api/orders
router.post("/", protect, createOrder);

// GET /api/orders/my
router.get("/my", protect, getMyOrders);

//download Invoice
router.get("/:id/invoice", protect, downloadInvoice);

// GET /api/orders/:id
router.get("/:id", protect, getOrderById);

// ==========================
// Admin Order Routes
// ==========================

// GET /api/orders
router.get("/", protect, adminOnly, getAllOrders);

// PUT /api/orders/:id/status
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

// POST /api/orders/:id/resend-invoice (Admin)
router.post("/:id/resend-invoice", protect, adminOnly, resendInvoiceEmail);

module.exports = router;
