// ============================================================
// Email Service — High-level email sending functions
// ============================================================
const sendEmail = require("../utils/email/sendEmail");
const {
  orderConfirmationTemplate,
  shippingUpdateTemplate,
  deliveredTemplate,
  invoiceEmailTemplate,
  welcomeEmailTemplate,
  cartReminderTemplate,
} = require("../utils/email/emailTemplates");
const { generateInvoiceBuffer } = require("../utils/invoiceGenerator");

// ── Order Confirmation ───────────────────────────────────────
exports.sendOrderConfirmation = async (order) => {
  const email = order.shippingAddress?.email || order.user?.email;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Order Confirmed — #${order._id}`,
    html: orderConfirmationTemplate(order),
  });
};

// ── Shipping Notification ────────────────────────────────────
exports.sendShippingNotification = async (order) => {
  const email = order.shippingAddress?.email || order.user?.email;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Your Order Has Shipped — #${order._id}`,
    html: shippingUpdateTemplate(order),
  });
};

// ── Delivered Notification ───────────────────────────────────
exports.sendDeliveredNotification = async (order) => {
  const email = order.shippingAddress?.email || order.user?.email;
  if (!email) return;

  await sendEmail({
    to: email,
    subject: `Order Delivered — #${order._id}`,
    html: deliveredTemplate(order),
  });
};

// ── Invoice Email (with PDF attachment) ──────────────────────
exports.sendInvoiceEmail = async (order) => {
  const email = order.shippingAddress?.email || order.user?.email;
  if (!email) return;

  let attachments = [];

  try {
    const pdfBuffer = await generateInvoiceBuffer(order);
    attachments = [
      {
        filename: `invoice-${order._id}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ];
  } catch (err) {
    console.error("❌ Invoice PDF generation failed:", err.message);
  }

  await sendEmail({
    to: email,
    subject: `Invoice for Order #${order._id}`,
    html: invoiceEmailTemplate(order),
    attachments,
  });
};

// ── Welcome Email ────────────────────────────────────────────
exports.sendWelcomeEmail = async (user) => {
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: `Welcome to Farmizo, ${user.name || "Friend"}! 🌱`,
    html: welcomeEmailTemplate(user),
  });
};

// ── Cart Reminder ────────────────────────────────────────────
exports.sendCartReminder = async (user, cartItems) => {
  if (!user?.email) return;

  await sendEmail({
    to: user.email,
    subject: "You left items in your cart — Farmizo 🛒",
    html: cartReminderTemplate(user, cartItems),
  });
};
