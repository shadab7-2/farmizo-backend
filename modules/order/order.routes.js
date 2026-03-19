const express = require("express");
const { protect } = require("../../middlewares/auth.middleware");
const { adminOnly } = require("../../middlewares/admin.middleware");
const controller = require("./order.controller");

const router = express.Router();

router.post("/", protect, controller.createOrder);
router.get("/my", protect, controller.getMyOrders);
router.get("/:id/invoice", protect, controller.downloadInvoice);
router.get("/:id", protect, controller.getOrderById);

router.get("/", protect, adminOnly, controller.getAllOrders);
router.put("/:id/status", protect, adminOnly, controller.updateOrderStatus);
router.post("/:id/resend-invoice", protect, adminOnly, controller.resendInvoiceEmail);

module.exports = router;
