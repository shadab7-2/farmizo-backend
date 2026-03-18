const { layout, ctaButton, SITE_URL } = require("./common");

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
