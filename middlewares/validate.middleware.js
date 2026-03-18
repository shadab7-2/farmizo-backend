const ApiError = require("../utils/ApiError");

const validateRequiredFields = (fields = [], source = "body") => (req, res, next) => {
  const payload = req?.[source] || {};

  const missing = fields.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });

  if (missing.length > 0) {
    return next(new ApiError(400, `Missing required field(s): ${missing.join(", ")}`));
  }

  return next();
};

module.exports = {
  validateRequiredFields,
};
