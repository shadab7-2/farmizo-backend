const express = require("express");
const controller = require("./auth.controller");
const { protect } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const { registerSchema, loginSchema } = require("./auth.validation");

const router = express.Router();

router.post("/register", validate({ body: registerSchema }), controller.register);
router.post("/login", validate({ body: loginSchema }), controller.login);
router.post("/logout", controller.logout);
router.post("/refresh", controller.refresh);
router.get("/me", protect, controller.getMe);

module.exports = router;
