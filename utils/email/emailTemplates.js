// ============================================================
// Farmizo — Branded HTML Email Templates
// ============================================================

const BRAND_COLOR = "#0f766e";
const BRAND_NAME = "Farmizo";
const SUPPORT_EMAIL = "support@farmizo.com";
const SITE_URL = process.env.CLIENT_URL || "http://localhost:3000";

// ── Shared Layout Wrapper ────────────────────────────────────
const layout = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;letter-spacing:1px;">🌱 ${BRAND_NAME}</h1>
              <p style="margin:6px 0 0;color:#d1fae5;font-size:13px;">Fresh produce &amp; agri supplies</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Need help? Contact us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin:6px 0 0;font-size:11px;color:#d1d5db;">
                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ── CTA Button ───────────────────────────────────────────────
const ctaButton = (text, href) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
  <tr>
    <td style="background:${BRAND_COLOR};border-radius:8px;">
      <a href="${href}"
         style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
        ${text}
      </a>
    </td>
  </tr>
</table>`;

// ── Order Items Table ────────────────────────────────────────
const orderItemsTable = (items) => {
  const rows = (items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        ${item.name || "Product"}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">
        ${item.quantity || 0}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:right;">
        ₹${Number(item.price || 0).toFixed(2)}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;font-weight:600;">
        ₹${(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
      </td>
    </tr>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
    <thead>
      <tr style="background:#f9fafb;">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Product</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
};

// ── Price Summary ────────────────────────────────────────────
const priceSummary = (order) => {
  const subtotal = Number(order.subtotal ?? order.totalAmount ?? 0);
  const shipping = Number(order.shippingCost ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  const total = Number(order.finalAmount ?? order.totalAmount ?? 0);

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr>
      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Subtotal</td>
      <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right;">₹${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td style="padding:4px 0;font-size:14px;color:#6b7280;">Shipping</td>
      <td style="padding:4px 0;font-size:14px;color:#374151;text-align:right;">${shipping === 0 ? "Free" : `₹${shipping.toFixed(2)}`}</td>
    </tr>
    ${discount > 0 ? `
    <tr>
      <td style="padding:4px 0;font-size:14px;color:#059669;">Discount</td>
      <td style="padding:4px 0;font-size:14px;color:#059669;text-align:right;">- ₹${discount.toFixed(2)}</td>
    </tr>` : ""}
    <tr>
      <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:#111827;border-top:1px solid #e5e7eb;">Total</td>
      <td style="padding:8px 0 0;font-size:16px;font-weight:700;color:${BRAND_COLOR};text-align:right;border-top:1px solid #e5e7eb;">₹${total.toFixed(2)}</td>
    </tr>
  </table>`;
};

// ============================================================
// 1. Order Confirmation Template
// ============================================================
exports.orderConfirmationTemplate = (order) => {
  const customerName = order.shippingAddress?.fullName || "Customer";
  const orderId = order._id;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Order Confirmed! 🎉</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${customerName}</strong>, thank you for your order!
    </p>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Order ID</p>
    <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">#${orderId}</p>
    ${orderItemsTable(order.items)}
    ${priceSummary(order)}
    ${ctaButton("View My Orders", `${SITE_URL}/orders`)}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      We'll send you another email when your order ships.
    </p>`;

  return layout("Order Confirmed — Farmizo", body);
};

// ============================================================
// 2. Shipping Update Template
// ============================================================
exports.shippingUpdateTemplate = (order) => {
  const customerName = order.shippingAddress?.fullName || "Customer";
  const orderId = order._id;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Your Order Has Shipped! 🚚</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${customerName}</strong>, great news — your Farmizo order is on its way!
    </p>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Order ID</p>
    <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">#${orderId}</p>
    ${orderItemsTable(order.items)}
    ${ctaButton("Track My Order", `${SITE_URL}/orders`)}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      We'll notify you again when it's delivered.
    </p>`;

  return layout("Order Shipped — Farmizo", body);
};

// ============================================================
// 3. Order Delivered Template
// ============================================================
exports.deliveredTemplate = (order) => {
  const customerName = order.shippingAddress?.fullName || "Customer";
  const orderId = order._id;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Order Delivered! 📦✅</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${customerName}</strong>, your Farmizo order has been delivered. We hope you love it!
    </p>
    <p style="margin:0 0 4px;font-size:14px;color:#6b7280;">Order ID</p>
    <p style="margin:0 0 16px;font-size:15px;color:#111827;font-weight:600;">#${orderId}</p>
    ${orderItemsTable(order.items)}
    ${priceSummary(order)}
    ${ctaButton("Shop Again", `${SITE_URL}/products`)}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Thank you for choosing Farmizo! 🌱
    </p>`;

  return layout("Order Delivered — Farmizo", body);
};

// ============================================================
// 4. Invoice Email Template
// ============================================================
exports.invoiceEmailTemplate = (order) => {
  const customerName = order.shippingAddress?.fullName || order.user?.name || "Customer";
  const orderId = order._id;

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Your Invoice 📄</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${customerName}</strong>, please find your invoice attached for Order <strong>#${orderId}</strong>.
    </p>
    ${orderItemsTable(order.items)}
    ${priceSummary(order)}
    ${ctaButton("View Order Details", `${SITE_URL}/orders`)}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      The invoice PDF is attached to this email.
    </p>`;

  return layout("Invoice — Farmizo", body);
};

// ============================================================
// 5. Welcome Email Template
// ============================================================
exports.welcomeEmailTemplate = (user) => {
  const name = user.name || "Friend";

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Welcome to Farmizo! 🌿</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${name}</strong>, we're thrilled to have you on board!
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
      Farmizo brings the freshest produce and quality agri supplies straight to your doorstep.
      Browse our catalog, discover seasonal favorites, and enjoy doorstep delivery.
    </p>
    <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#0f766e;font-weight:600;">🎁 New member perk</p>
      <p style="margin:6px 0 0;font-size:13px;color:#374151;">
        Free shipping on your first order over ₹500!
      </p>
    </div>
    ${ctaButton("Start Shopping", `${SITE_URL}/products`)}`;

  return layout("Welcome to Farmizo!", body);
};

// ============================================================
// 6. Cart Reminder Template
// ============================================================
exports.cartReminderTemplate = (user, cartItems) => {
  const name = user.name || "Friend";

  const itemsList = (cartItems || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        ${item.name || "Product"}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;text-align:center;">
        ${item.quantity || 1}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;text-align:right;font-weight:600;">
        ₹${Number(item.price || 0).toFixed(2)}
      </td>
    </tr>`
    )
    .join("");

  const body = `
    <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">You Left Something Behind! 🛒</h2>
    <p style="margin:0 0 20px;color:#6b7280;font-size:15px;">
      Hi <strong>${name}</strong>, it looks like you have items waiting in your cart.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:16px 0;">
      <thead>
        <tr style="background:#f9fafb;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;text-transform:uppercase;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;color:#6b7280;text-transform:uppercase;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsList}</tbody>
    </table>
    <p style="margin:0 0 8px;font-size:14px;color:#374151;">
      Complete your purchase before these fresh items run out!
    </p>
    ${ctaButton("Complete My Order", `${SITE_URL}/cart`)}
    <p style="margin:16px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      Enjoy free shipping on orders over ₹500.
    </p>`;

  return layout("Your Cart Misses You — Farmizo", body);
};
