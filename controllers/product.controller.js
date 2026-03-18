const productService = require("../services/product.service");

const normalizeBody = (body = {}) => {
  const payload = { ...body };

  if (typeof payload.isActive === "string") {
    payload.isActive = payload.isActive === "true";
  }

  if (typeof payload.existingImages === "string") {
    try {
      payload.images = JSON.parse(payload.existingImages);
    } catch {
      payload.images = [];
    }
    delete payload.existingImages;
  }

  if (typeof payload.existingImagePublicIds === "string") {
    try {
      payload.imagePublicIds = JSON.parse(payload.existingImagePublicIds);
    } catch {
      payload.imagePublicIds = [];
    }
    delete payload.existingImagePublicIds;
  }

  return payload;
};

exports.getAllProductsAdmin = async (req, res, next) => {
  try {
    const products = await productService.getAllAdmin();

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Get All Products
// ==========================
exports.getAllProducts = async (req, res, next) => {
  try {
    const result = await productService.getAll(req.query);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Get Related Products
// ==========================
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const products = await productService.getRelatedProducts(slug);

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================
// Get Product By Slug
// ==========================
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await productService.getBySlug(slug);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.searchProducts = async (req, res, next) => {
  try {
    const result = await productService.search(req.query);

    res.status(200).json({
      success: true,
      data: result.products,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductByIdAdmin = async (req, res, next) => {
  try {
    const product = await productService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Create Product (Admin)
// ==========================
exports.createProduct = async (req, res, next) => {
  try {
    const payload = normalizeBody(req.body);
    const createdProduct = await productService.create(payload, req.files || []);

    res.status(201).json({
      success: true,
      message: "Product created",
      data: createdProduct,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Update Product (Admin)
// ==========================
exports.updateProduct = async (req, res, next) => {
  try {
    const payload = normalizeBody(req.body);
    const updated = await productService.update(
      req.params.id,
      payload,
      req.files || [],
    );

    res.status(200).json({
      success: true,
      message: "Product updated",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Delete Product (Admin)
// ==========================
exports.deleteProduct = async (req, res, next) => {
  try {
    await productService.remove(req.params.id);

    res.status(200).json({
      success: true,
      message: "Product deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ==========================
// Product Reviews
// ==========================
exports.getProductReviews = async (req, res, next) => {
  try {
    const data = await productService.getReviews(req.params.id, req.query);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.createProductReview = async (req, res, next) => {
  try {
    const data = await productService.createReview(req.params.id, req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Review added",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProductReview = async (req, res, next) => {
  try {
    const data = await productService.updateReview(req.params.id, req.user, req.body);

    res.status(200).json({
      success: true,
      message: "Review updated",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProductReview = async (req, res, next) => {
  try {
    const data = await productService.deleteReview(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Review deleted",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProductReviewAdmin = async (req, res, next) => {
  try {
    const data = await productService.deleteReviewAsAdmin(req.params.reviewId);

    res.status(200).json({
      success: true,
      message: "Review removed by admin",
      data,
    });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviewsAdmin = async (req, res, next) => {
  try {
    const result = await productService.getAllReviewsForAdmin(req.query);

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProductReviewsBulkAdmin = async (req, res, next) => {
  try {
    const reviewIds = Array.isArray(req.body?.reviewIds) ? req.body.reviewIds : [];
    const data = await productService.deleteReviewsAsAdmin(reviewIds);

    res.status(200).json({
      success: true,
      message: `Deleted ${data.deletedCount} review(s)`,
      data,
    });
  } catch (error) {
    next(error);
  }
};
