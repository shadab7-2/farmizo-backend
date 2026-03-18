const { layout, orderItemsTable, ctaButton, SITE_URL } = require("./common");

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
