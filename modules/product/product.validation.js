const { z } = require("zod");

const createProductSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }),
  price: z.number().positive({ message: "Price must be greater than 0" }),
  category: z.string().trim().min(1, { message: "Category is required" }),
  stock: z.number().min(0, { message: "Stock cannot be negative" }),
  description: z.string().trim().optional(),
});

const updateProductSchema = createProductSchema.partial();

module.exports = {
  createProductSchema,
  updateProductSchema,
};
