const { layout, orderItemsTable, priceSummary, ctaButton, SITE_URL } = require("./common");

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
