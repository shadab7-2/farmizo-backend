// ============================================================
// Cart Reminder — Cron Job
// Runs every hour, emails users who have items sitting in
// their cart for more than 24 hours.
// ============================================================
const cron = require("node-cron");
const Cart = require("../models/cart.model");
const { sendCartReminder } = require("../services/email.service");

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Run every hour at minute 0
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Cart reminder job started");

  try {
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    const staleCarts = await Cart.find({
      updatedAt: { $lte: cutoff },
      "items.0": { $exists: true }, // at least one item
    }).populate("user", "name email");

    if (staleCarts.length === 0) {
      console.log("📭 No stale carts found");
      return;
    }

    console.log(`📧 Sending cart reminders to ${staleCarts.length} user(s)...`);

    for (const cart of staleCarts) {
      if (!cart.user?.email) continue;
      await sendCartReminder(cart.user, cart.items);
    }

    console.log("✅ Cart reminder emails sent");
  } catch (err) {
    console.error("❌ Cart reminder job error:", err.message);
  }
});

console.log("🔁 Cart reminder cron job scheduled (every hour)");
