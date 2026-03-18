// Import mongoose to connect with MongoDB
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load env from project root so seeding works regardless of cwd
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Function to connect to MongoDB
const connectDB = async () => {
    try{
        // Using the MONGODB_CONNECTION_STRING from the .env file
      let connect= await mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
       console.log(`✅ MongoDB Connected Successfully at ${connect.connection.host}`);
    }catch(err){
     console.error("❌ MongoDB Connection Failed:", err.message);
     // Stop the server if DB connection fails
    process.exit(1);
    }
}

module.exports = connectDB; 



