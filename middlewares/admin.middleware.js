const ApiError = require("../utils/ApiError");
const ROLES = require("../constants/roles");

const adminOnly  = (req, res, next) => {
  if (!req.user) {
    return next(
      new ApiError(401, "Not authenticated")
    );
  }

  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return next(
      new ApiError(
        403,
        "Admin access required"
      ) 
    );
  }

  next();
};

module.exports = {adminOnly  };  
