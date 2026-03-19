const { z } = require("zod");

const email = z.string().trim().email({ message: "Invalid email address" });
const password = z.string().min(6, { message: "Password must be at least 6 characters" });

const registerSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  email,
  password,
  phone: z.string().trim().optional(),
});

const loginSchema = z.object({
  email,
  password,
});

module.exports = {
  registerSchema,
  loginSchema,
};
