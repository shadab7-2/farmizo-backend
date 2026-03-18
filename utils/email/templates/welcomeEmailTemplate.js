const { layout, ctaButton, SITE_URL } = require("./common");

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
