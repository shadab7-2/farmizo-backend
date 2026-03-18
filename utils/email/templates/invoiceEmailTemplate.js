const { layout, orderItemsTable, priceSummary, ctaButton, SITE_URL } = require("./common");

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
