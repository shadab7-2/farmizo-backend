const { layout, orderItemsTable, priceSummary, ctaButton, SITE_URL } = require("./common");

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
      <a href="${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/orders/${orderId}/invoice" style="color:#0f766e;">Download Invoice</a>
    </p>
    <p style="margin:8px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
      We'll send you another email when your order ships.
    </p>`;

  return layout("Order Confirmed — Farmizo", body);
};
