// ==============================
// Generic Email Sender (SendGrid)
// ==============================
const sgMail = require("@sendgrid/mail");

// Initialize SendGrid with API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn("⚠️  SendGrid API Key is missing from environment variables.");
}

/**
 * Send an email using SendGrid (fire-and-forget safe).
 * Logs errors instead of throwing to avoid breaking the main request flow.
 *
 * @param {Object}  options
 * @param {string}  options.to          - Recipient email
 * @param {string}  options.subject     - Email subject
 * @param {string}  options.html        - HTML body
 * @param {Array}   [options.attachments] - SendGrid attachment array format
 */
const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  try {
    if (!to || !subject || !html) {
      console.warn("⚠️  sendEmail: missing required fields (to, subject, html)");
      return;
    }

    const msg = {
      to,
      from: process.env.EMAIL_FROM || "noreply@farmizo.com",
      subject,
      html,
    };

    if (attachments && attachments.length > 0) {
      msg.attachments = attachments.map((att) => ({
        content: att.content.toString("base64"), // SendGrid requires base64 string for content
        filename: att.filename,
        type: att.contentType || "application/pdf",
        disposition: "attachment",
      }));
    }

    const [response] = await sgMail.send(msg);
    console.log(`📧 SendGrid Email sent to ${to} — Status: ${response.statusCode}`);
  } catch (err) {
    if (err.response) {
      console.error(`❌ SendGrid email send failed to ${to}:`, err.response.body);
    } else {
      console.error(`❌ SendGrid email send failed to ${to}:`, err.message);
    }
  }
};

module.exports = sendEmail;
