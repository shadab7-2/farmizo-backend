const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(2)}`;
};

const safeText = (value, fallback = "-") => {
  const asString = value === undefined || value === null ? "" : String(value);
  return asString.trim() || fallback;
};

const drawHeader = (doc, order) => {
  const logoPath = path.join(__dirname, "..", "public", "farmizo-logo.png");

  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 40, { width: 110 });
  } else {
    doc.fontSize(22).fillColor("#0f766e").text("Farmizo", 50, 52);
  }

  doc.fontSize(10).fillColor("#4b5563").text("Fresh produce & agri supplies", 50, 74);

  const invoiceNumber = `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString();

  doc.fontSize(12).fillColor("#111827").text("Invoice", 400, 40, { align: "right" });
  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text(`Invoice No: ${invoiceNumber}`, { align: "right" })
    .text(`Order ID: ${order._id}`, { align: "right" })
    .text(`Order Date: ${orderDate}`, { align: "right" });

  doc.moveTo(50, 110).lineTo(545, 110).stroke("#e5e7eb");
};

const drawAddresses = (doc, order) => {
  const billing = order.shippingAddress || {};
  const customerName = safeText(billing.fullName || order.user?.name || "-");
  const customerPhone = safeText(billing.phone);
  const customerEmail = safeText(billing.email || order.user?.email || "-");

  doc.fontSize(12).fillColor("#111827").text("Billing / Shipping", 50, 130);

  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text(customerName, 50, 150)
    .text(customerEmail, 50)
    .text(customerPhone, 50)
    .text(safeText(billing.street || billing.address), 50)
    .text(`${safeText(billing.city)} - ${safeText(billing.pincode)}`, 50);

  doc.fontSize(12).fillColor("#111827").text("Payment", 320, 130);

  doc
    .fontSize(10)
    .fillColor("#4b5563")
    .text(`Method: ${safeText(order.paymentMethod, "COD")}`, 320, 150)
    .text(`Status: ${safeText(order.paymentStatus, "pending")}`, 320)
    .text(`Order Status: ${safeText(order.orderStatus, "placed")}`, 320);
};

const drawTableHeader = (doc, y) => {
  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text("Product Name", 50, y)
    .text("Quantity", 280, y, { width: 60, align: "right" })
    .text("Unit Price", 360, y, { width: 80, align: "right" })
    .text("Total Price", 460, y, { width: 90, align: "right" });

  doc.moveTo(50, y + 14).lineTo(545, y + 14).stroke("#e5e7eb");
};

const drawTableRow = (doc, y, item) => {
  doc
    .fontSize(10)
    .fillColor("#111827")
    .text(safeText(item.name), 50, y, { width: 210 })
    .text(Number(item.quantity || 0), 280, y, { width: 60, align: "right" })
    .text(formatCurrency(item.price || 0), 360, y, { width: 80, align: "right" })
    .text(formatCurrency(Number(item.price || 0) * Number(item.quantity || 0)), 460, y, {
      width: 90,
      align: "right",
    });
};

const drawSummary = (doc, order, startY) => {
  const rows = [
    { label: "Subtotal", value: order.subtotal ?? order.totalAmount ?? 0 },
    { label: "Shipping", value: order.shippingCost ?? 0 },
    { label: "Discount", value: order.discountAmount ?? 0, isNegative: true },
    { label: "Tax", value: order.taxAmount ?? 0 },
  ];

  const summaryY = startY + 20;
  const valueX = 460;

  doc.moveTo(320, summaryY - 10).lineTo(545, summaryY - 10).stroke("#e5e7eb");

  rows.forEach((row, index) => {
    const y = summaryY + index * 16;
    doc.fontSize(10).fillColor("#4b5563").text(row.label, 320, y);
    const display = row.isNegative ? `- ${formatCurrency(row.value)}` : formatCurrency(row.value);
    doc.fontSize(10).fillColor("#111827").text(display, valueX, y, { width: 90, align: "right" });
  });

  const totalY = summaryY + rows.length * 16 + 4;
  doc.fontSize(11).fillColor("#111827").text("Total Amount", 320, totalY);
  doc
    .fontSize(12)
    .fillColor("#0f766e")
    .text(formatCurrency(order.finalAmount ?? order.totalAmount ?? 0), valueX, totalY - 2, {
      width: 90,
      align: "right",
    });
};

const drawFooter = (doc) => {
  doc.moveTo(50, 760).lineTo(545, 760).stroke("#e5e7eb");
  doc
    .fontSize(10)
    .fillColor("#6b7280")
    .text("Thank you for shopping with Farmizo", 50, 770, { align: "center", width: 495 });
};

const generateInvoice = (order, res) => {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=invoice-${order._id}.pdf`);

  doc.pipe(res);

  drawHeader(doc, order);
  drawAddresses(doc, order);

  const tableTop = 240;
  drawTableHeader(doc, tableTop);

  let y = tableTop + 24;
  order.items.forEach((item) => {
    drawTableRow(doc, y, item);
    y += 18;
  });

  drawSummary(doc, order, y);
  drawFooter(doc);

  doc.end();
};

// ==============================
// Generate Invoice as Buffer
// (for email attachments)
// ==============================
const generateInvoiceBuffer = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      drawHeader(doc, order);
      drawAddresses(doc, order);

      const tableTop = 240;
      drawTableHeader(doc, tableTop);

      let y = tableTop + 24;
      (order.items || []).forEach((item) => {
        drawTableRow(doc, y, item);
        y += 18;
      });

      drawSummary(doc, order, y);
      drawFooter(doc);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateInvoice;
module.exports.generateInvoiceBuffer = generateInvoiceBuffer;

