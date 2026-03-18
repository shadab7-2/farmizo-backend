// ============================================================
// Farmizo — Shared HTML Email Template Utilities
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

module.exports = {
  BRAND_COLOR,
  BRAND_NAME,
  SUPPORT_EMAIL,
  SITE_URL,
  layout,
  ctaButton,
  orderItemsTable,
  priceSummary,
};
