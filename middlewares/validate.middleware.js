const { ZodError } = require("zod");
const apiResponse = require("../utils/apiResponse");

const validate =
  (schemas = {}) =>
  (req, res, next) => {
    try {
      const { body, query, params } = schemas;

      if (body) {
        const parsed = body.safeParse(req.body);
        if (!parsed.success) throw parsed.error;
        req.body = parsed.data;
      }

      if (query) {
        const parsed = query.safeParse(req.query);
        if (!parsed.success) throw parsed.error;
        req.query = parsed.data;
      }

      if (params) {
        const parsed = params.safeParse(req.params);
        if (!parsed.success) throw parsed.error;
        req.params = parsed.data;
      }

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formatted = err.errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        }));
        return res.status(400).json(
          apiResponse({
            success: false,
            message: "Validation failed",
            error: formatted,
            status: 400,
          }),
        );
      }
      return next(err);
    }
  };

module.exports = validate;
