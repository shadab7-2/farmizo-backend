const bcrypt = require("bcrypt");

module.exports = [
  {
    name: "Admin User",
    email: "admin@farmizo.com",
    password: bcrypt.hashSync("admin123", 10),
    role: "admin",
  },
  {
    name: "Test User",
    email: "user@farmizo.com",
    password: bcrypt.hashSync("user123", 10),
    role: "user",
  },
];
