require("dotenv").config();

const connectDB = require("./config/db");
const app = require("./app");

const PORT = process.env.SERVER_PORT || 5000;

const start = async () => {
  await connectDB();

  // Start scheduled jobs
  require("./jobs/cartReminder.job");

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running at ${
        process.env.SERVER_URL || `http://localhost:${PORT}`
      }`
    );
  });
};

start();
