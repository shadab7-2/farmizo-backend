const express = require("express");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Controllers
|--------------------------------------------------------------------------
| These handle the actual business logic
*/
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
} = require("../controllers/auth.controller");

/*
|--------------------------------------------------------------------------
| Auth Middleware
|--------------------------------------------------------------------------
| Protects private routes by verifying JWT
| Exported as a single function
*/
const {protect} = require("../middlewares/auth.middleware");

/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/

// POST /api/auth/register
// Register new user
router.post("/register", registerUser);

// POST /api/auth/login
// Login user and return token
router.post("/login", loginUser);

// POST /api/auth/logout
// Logout user and clear auth cookie
router.post("/logout", logoutUser);

// GET /api/auth/me
// Get logged-in user profile (protected)
router.get("/me", protect, getMe);

module.exports = router;
