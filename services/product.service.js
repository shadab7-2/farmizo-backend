const Product = require("../models/product.model");
const Category = require("../models/category.model");
const Order = require("../models/order.model");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} = require("../utils/cloudinary");

const generateSlug = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value, field, min = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min) {
    throw new ApiError(400, `${field} must be a valid number`);
  }
  return parsed;
};

const validateAndNormalizePayload = (
  payload = {},
  { isUpdate = false } = {},
) => {
  const data = { ...payload };
  const requiredFields = ["name", "description", "price"];

  if (!isUpdate) {
    requiredFields.forEach((field) => {
      if (
        data[field] === undefined ||
        data[field] === null ||
        String(data[field]).trim() === ""
      ) {
        throw new ApiError(400, `${field} is required`);
      }
    });

    const hasCategory =
      (data.categoryId !== undefined && String(data.categoryId).trim() !== "") ||
      (data.category !== undefined && String(data.category).trim() !== "");

    if (!hasCategory) {
      throw new ApiError(400, "categoryId is required");
    }
  }

  if (data.name !== undefined) {
    data.name = String(data.name).trim();
    if (!data.name) throw new ApiError(400, "name is required");
    data.slug = generateSlug(data.name);
    if (!data.slug) throw new ApiError(400, "name is invalid for slug generation");
  }

  if (data.description !== undefined) {
    data.description = String(data.description).trim();
    if (!data.description) throw new ApiError(400, "description is required");
  }

  if (data.category !== undefined) {
    data.category = String(data.category).trim();
  }

  if (data.categoryId !== undefined) {
    data.categoryId = String(data.categoryId).trim();
  }

  if (data.price !== undefined) {
    data.price = toNumber(data.price, "price", 0);
  }

  if (data.stock !== undefined) {
    data.stock = toNumber(data.stock, "stock", 0);
  }

  if (data.images !== undefined) {
    const imageList = Array.isArray(data.images)
      ? data.images
      : String(data.images)
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    data.images = imageList;
  }

  if (data.imagePublicIds !== undefined) {
    data.imagePublicIds = Array.isArray(data.imagePublicIds)
      ? data.imagePublicIds
          .map((item) => String(item).trim())
          .filter(Boolean)
      : [];
  }

  return data;
};

const uploadImages = async (files = []) => {
  if (!Array.isArray(files) || files.length === 0) return [];

  const uploads = await Promise.all(
    files.map((file) => uploadBufferToCloudinary(file.buffer)),
  );

  return uploads;
};

const createUniqueSlug = async (baseSlug, excludeId = null) => {
  if (!baseSlug) {
    throw new ApiError(400, "Invalid slug");
  }

  let slug = baseSlug;
  let count = 1;

  while (true) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const existing = await Product.findOne(query).select("_id");
    if (!existing) {
      return slug;
    }

    count += 1;
    slug = `${baseSlug}-${count}`;
  }
};

const productPopulate = {
  path: "categoryId",
  select: "name slug",
};

const withCategoryName = (product) => {
  if (!product) return product;

  const data =
    typeof product.toObject === "function"
      ? product.toObject()
      : { ...product };

  const categoryName = data?.categoryId?.name || data?.category || "";
  const categorySlug = data?.categoryId?.slug || data?.category || "";

  return {
    ...data,
    categoryName,
    categorySlug,
  };
};

const normalizeRatingValue = (value) => {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5");
  }
  return rating;
};

const normalizeCommentValue = (value) => {
  const comment = String(value || "").trim();
  if (!comment) {
    throw new ApiError(400, "Comment is required");
  }
  if (comment.length > 1200) {
    throw new ApiError(400, "Comment is too long");
  }
  return comment;
};

const recalculateProductRating = (product) => {
  const totalReviews = Array.isArray(product.reviews) ? product.reviews.length : 0;
  const totalRating = (product.reviews || []).reduce(
    (sum, review) => sum + Number(review.rating || 0),
    0,
  );

  product.numReviews = totalReviews;
  product.rating = totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(2)) : 0;
};

const ensureProductId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id");
  }
};

const ensureUserPurchasedProduct = async (userId, productId) => {
  const hasPurchased = await Order.exists({
    user: userId,
    orderStatus: { $ne: "cancelled" },
    "items.product": productId,
  });

  if (!hasPurchased) {
    throw new ApiError(403, "Only customers who purchased this product can review");
  }
};

const resolveCategoryForProduct = async (
  rawValue,
  { required = false } = {},
) => {
  if (
    rawValue === undefined ||
    rawValue === null ||
    String(rawValue).trim() === ""
  ) {
    if (required) {
      throw new ApiError(400, "categoryId is required");
    }
    return null;
  }

  const categoryInput = String(rawValue).trim();
  let category = null;

  if (mongoose.Types.ObjectId.isValid(categoryInput)) {
    category = await Category.findOne({
      _id: categoryInput,
      isActive: true,
    });
  }

  if (!category) {
    category = await Category.findOne({
      slug: categoryInput.toLowerCase(),
      isActive: true,
    });
  }

  if (!category) {
    category = await Category.findOne({
      name: categoryInput,
      isActive: true,
    });
  }

  if (!category) {
    throw new ApiError(400, "Invalid category");
  }

  return category;
};

// ==========================
// Get All Products (with filters + pagination)
// ==========================
exports.getAll = async (params) => {
  const {
    category,
    categoryId,
    type,
    q,
    minPrice,
    maxPrice,
    inStock,
    sort,
    page = 1,
    limit = 12,
  } = params;

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 12, 1);

  const query = { isActive: { $ne: false } };

  if (categoryId && mongoose.Types.ObjectId.isValid(categoryId)) {
    query.categoryId = categoryId;
  } else if (category) {
    const normalized = String(category).trim();
    const categoryDoc = await Category.findOne({
      slug: normalized.toLowerCase(),
      isActive: true,
    }).select("_id slug name");

    if (categoryDoc) {
      query.$or = [
        { categoryId: categoryDoc._id },
        { category: categoryDoc.slug },
        { category: categoryDoc.name },
      ];
    } else {
      query.category = normalized;
    }
  }

  if (type) {
    query.type = { $in: String(type).split(",") };
  }

  const priceFilter = {};
  if (minPrice !== undefined && minPrice !== "") {
    priceFilter.$gte = Number(minPrice);
  }
  if (maxPrice !== undefined && maxPrice !== "") {
    priceFilter.$lte = Number(maxPrice);
  }
  if (Object.keys(priceFilter).length > 0) {
    query.price = priceFilter;
  }

  if (inStock === "true" || inStock === true) {
    query.stock = { $gt: 0 };
  }

  const searchText = String(q || "").trim();
  const hasSearch = Boolean(searchText);
  if (hasSearch) {
    query.$text = { $search: searchText };
  }

  const projection = hasSearch
    ? { score: { $meta: "textScore" } }
    : undefined;

  let mongoQuery = Product.find(query, projection).populate(productPopulate);

  if (hasSearch && !sort) {
    mongoQuery = mongoQuery.sort({ score: { $meta: "textScore" }, createdAt: -1 });
  }

  if (sort === "low") {
    mongoQuery = mongoQuery.sort({ price: 1 });
  }

  if (sort === "high") {
    mongoQuery = mongoQuery.sort({ price: -1 });
  }

  const skip = (safePage - 1) * safeLimit;
  mongoQuery = mongoQuery.skip(skip).limit(safeLimit);

  const products = await mongoQuery;
  const total = await Product.countDocuments(query);

  return {
    products: products.map(withCategoryName),
    pagination: {
      totalProducts: total,
      totalPages: Math.ceil(total / safeLimit),
      currentPage: safePage,            
      limit: safeLimit,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    },
  };
};

exports.getAllAdmin = async () => {
  const products = await Product.find()
    .populate(productPopulate)
    .sort({ createdAt: -1 });

  return products.map(withCategoryName);
};

exports.search = async (params) => {
  const {
    q = "",
    page = 1,
    limit = 12,
  } = params;

  const searchText = String(q || "").trim();
  if (!searchText) {
    return {
      products: [],
      pagination: {
        totalProducts: 0,
        totalPages: 0,
        currentPage: Number(page) || 1,
        limit: Number(limit) || 12,
        total: 0,
        page: Number(page) || 1,
        pages: 0,
      },
    };
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.max(Number(limit) || 12, 1);
  const skip = (safePage - 1) * safeLimit;

  const query = {
    isActive: { $ne: false },
    $text: { $search: searchText },
  };

  const [products, total] = await Promise.all([
    Product.find(query, { score: { $meta: "textScore" } })
      .populate(productPopulate)
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    Product.countDocuments(query),
  ]);

  return {
    products: products.map(withCategoryName),
    pagination: {
      totalProducts: total,
      totalPages: Math.ceil(total / safeLimit),
      currentPage: safePage,
      limit: safeLimit,
      total,
      page: safePage,
      pages: Math.ceil(total / safeLimit),
    },
  };
};

exports.getRelatedProducts = async (slug) => {
  const currentProduct = await Product.findOne({ slug }).populate(productPopulate);

  if (!currentProduct) {
    throw new ApiError(404, "Product not found");
  }

  const relatedQuery = {
    _id: { $ne: currentProduct._id },
    isActive: { $ne: false },
  };

  if (currentProduct.categoryId?._id) {
    relatedQuery.$or = [
      { categoryId: currentProduct.categoryId._id },
      { category: currentProduct.categoryId.slug },
      { category: currentProduct.categoryId.name },
    ];
  } else {
    relatedQuery.category = currentProduct.category;
  }

  const related = await Product.find(relatedQuery)
    .populate(productPopulate)
    .limit(4)
    .sort({ createdAt: -1 });

  return related.map(withCategoryName);
};

// ==========================
// Get Product By Slug
// ==========================
exports.getBySlug = async (slug) => {
  const product = await Product.findOne({
    slug,
    isActive: { $ne: false },
  }).populate(productPopulate);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return withCategoryName(product);
};

exports.getById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await Product.findById(id).populate(productPopulate);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return withCategoryName(product);
};

exports.getReviews = async (productId, params = {}) => {
  ensureProductId(productId);

  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(Math.max(Number(params.limit) || 10, 1), 50);

  const product = await Product.findById(productId).select("reviews rating numReviews");
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const sortedReviews = [...(product.reviews || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const total = sortedReviews.length;
  const start = (page - 1) * limit;
  const reviews = sortedReviews.slice(start, start + limit).map((review) => ({
    _id: review._id,
    user: review.user,
    name: review.name,
    rating: Number(review.rating || 0),
    comment: review.comment,
    createdAt: review.createdAt,
    verifiedPurchase: true,
  }));

  return {
    productId,
    rating: Number(product.rating || 0),
    numReviews: Number(product.numReviews || 0),
    reviews,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.createReview = async (productId, user, payload = {}) => {
  ensureProductId(productId);
  if (!user?._id) {
    throw new ApiError(401, "Not authorized");
  }

  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError(404, "Product not found");
  }

  await ensureUserPurchasedProduct(user._id, product._id);

  const existingReview = (product.reviews || []).find(
    (review) => review.user.toString() === user._id.toString(),
  );
  if (existingReview) {
    throw new ApiError(409, "You have already reviewed this product");
  }

  product.reviews.push({
    user: user._id,
    name: user.name || "Customer",
    rating: normalizeRatingValue(payload.rating),
    comment: normalizeCommentValue(payload.comment),
    createdAt: new Date(),
  });

  recalculateProductRating(product);
  await product.save();

  return {
    rating: product.rating,
    numReviews: product.numReviews,
  };
};

exports.updateReview = async (productId, user, payload = {}) => {
  ensureProductId(productId);
  if (!user?._id) {
    throw new ApiError(401, "Not authorized");
  }

  const product = await Product.findById(productId);
  if (!product || product.isActive === false) {
    throw new ApiError(404, "Product not found");
  }

  await ensureUserPurchasedProduct(user._id, product._id);

  const review = (product.reviews || []).find(
    (item) => item.user.toString() === user._id.toString(),
  );
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  review.rating = normalizeRatingValue(payload.rating);
  review.comment = normalizeCommentValue(payload.comment);
  review.name = user.name || review.name;
  review.createdAt = review.createdAt || new Date();

  recalculateProductRating(product);
  await product.save();

  return {
    rating: product.rating,
    numReviews: product.numReviews,
  };
};

exports.deleteReview = async (productId, user) => {
  ensureProductId(productId);
  if (!user?._id) {
    throw new ApiError(401, "Not authorized");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const previousLength = product.reviews.length;
  product.reviews = product.reviews.filter(
    (review) => review.user.toString() !== user._id.toString(),
  );

  if (product.reviews.length === previousLength) {
    throw new ApiError(404, "Review not found");
  }

  recalculateProductRating(product);
  await product.save();

  return {
    rating: product.rating,
    numReviews: product.numReviews,
  };
};

exports.deleteReviewAsAdmin = async (reviewId) => {
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    throw new ApiError(400, "Invalid review id");
  }

  const product = await Product.findOne({ "reviews._id": reviewId });
  if (!product) {
    throw new ApiError(404, "Review not found");
  }

  product.reviews = product.reviews.filter(
    (review) => review._id.toString() !== reviewId.toString(),
  );

  recalculateProductRating(product);
  await product.save();

  return {
    productId: product._id,
    rating: product.rating,
    numReviews: product.numReviews,
  };
};

exports.deleteReviewsAsAdmin = async (reviewIds = []) => {
  if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
    throw new ApiError(400, "reviewIds must be a non-empty array");
  }

  const normalizedIds = [...new Set(reviewIds.map((id) => String(id).trim()).filter(Boolean))];
  const invalidId = normalizedIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidId) {
    throw new ApiError(400, `Invalid review id: ${invalidId}`);
  }

  const idsToDelete = new Set(normalizedIds);
  const products = await Product.find({
    "reviews._id": { $in: normalizedIds },
  }).select("_id reviews rating numReviews");

  if (!products.length) {
    return {
      deletedCount: 0,
      requestedCount: normalizedIds.length,
      updatedProducts: 0,
    };
  }

  let deletedCount = 0;
  for (const product of products) {
    const previousLength = product.reviews.length;
    product.reviews = product.reviews.filter(
      (review) => !idsToDelete.has(review._id.toString()),
    );

    const currentLength = product.reviews.length;
    if (currentLength !== previousLength) {
      deletedCount += previousLength - currentLength;
      recalculateProductRating(product);
      await product.save();
    }
  }

  return {
    deletedCount,
    requestedCount: normalizedIds.length,
    updatedProducts: products.length,
  };
};

exports.getAllReviewsForAdmin = async (params = {}) => {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(Math.max(Number(params.limit) || 10, 1), 50);
  const query = String(params.q || "").trim();
  const ratingFilter = Number(params.rating || 0);

  const pipeline = [{ $unwind: "$reviews" }];

  const match = {};
  if (query) {
    match.$or = [
      { "reviews.name": { $regex: query, $options: "i" } },
      { "reviews.comment": { $regex: query, $options: "i" } },
      { name: { $regex: query, $options: "i" } },
      { slug: { $regex: query, $options: "i" } },
    ];
  }

  if (ratingFilter >= 1 && ratingFilter <= 5) {
    match["reviews.rating"] = ratingFilter;
  }

  if (Object.keys(match).length > 0) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $sort: {
      "reviews.createdAt": -1,
      updatedAt: -1,
    },
  });

  pipeline.push({
    $facet: {
      data: [
        { $skip: (page - 1) * limit },
        { $limit: limit },
        {
          $project: {
            _id: 0,
            reviewId: "$reviews._id",
            productId: "$_id",
            productName: "$name",
            productSlug: "$slug",
            reviewerId: "$reviews.user",
            reviewerName: "$reviews.name",
            rating: "$reviews.rating",
            comment: "$reviews.comment",
            createdAt: "$reviews.createdAt",
          },
        },
      ],
      totalCount: [{ $count: "count" }],
    },
  });

  const result = await Product.aggregate(pipeline);
  const rows = result?.[0]?.data || [];
  const total = result?.[0]?.totalCount?.[0]?.count || 0;

  return {
    reviews: rows,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      limit,
    },
  };
};

// ==========================
// Create Product (Admin)
// ==========================
exports.create = async (payload, files = []) => {
  const data = validateAndNormalizePayload(payload, { isUpdate: false });

  const resolvedCategory = await resolveCategoryForProduct(
    data.categoryId || data.category,
    { required: true },
  );

  data.categoryId = resolvedCategory._id;
  data.category = resolvedCategory.slug;

  const uploadedImages = await uploadImages(files);

  if (uploadedImages.length) {
    data.images = [
      ...(data.images || []),
      ...uploadedImages.map((item) => item.url),
    ];
    data.imagePublicIds = [
      ...(data.imagePublicIds || []),
      ...uploadedImages.map((item) => item.publicId),
    ];
  }

  data.slug = await createUniqueSlug(data.slug);

  const createdProduct = await Product.create(data);
  const created = await Product.findById(createdProduct._id).populate(productPopulate);

  return withCategoryName(created);
};

// ==========================
// Update Product (Admin)
// ==========================
exports.update = async (id, updates, files = []) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw new ApiError(404, "Product not found");
  }

  const sanitizedUpdates = validateAndNormalizePayload(updates, { isUpdate: true });

  if (
    sanitizedUpdates.categoryId !== undefined ||
    sanitizedUpdates.category !== undefined
  ) {
    const resolvedCategory = await resolveCategoryForProduct(
      sanitizedUpdates.categoryId || sanitizedUpdates.category,
      { required: true },
    );

    sanitizedUpdates.categoryId = resolvedCategory._id;
    sanitizedUpdates.category = resolvedCategory.slug;
  }

  const uploadedImages = await uploadImages(files);

  if (sanitizedUpdates.slug) {
    sanitizedUpdates.slug = await createUniqueSlug(sanitizedUpdates.slug, id);
  }

  if (uploadedImages.length > 0) {
    const previousPublicIds = Array.isArray(existingProduct.imagePublicIds)
      ? existingProduct.imagePublicIds
      : [];

    await Promise.all(previousPublicIds.map((publicId) => deleteFromCloudinary(publicId)));

    sanitizedUpdates.images = uploadedImages.map((item) => item.url);
    sanitizedUpdates.imagePublicIds = uploadedImages.map((item) => item.publicId);
  }

  const product = await Product.findByIdAndUpdate(id, sanitizedUpdates, {
    new: true,
    runValidators: true,
  }).populate(productPopulate);

  return withCategoryName(product);
};

// ==========================
// Delete Product (Admin)
// ==========================
exports.remove = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product id");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const storedPublicIds =
    Array.isArray(product.imagePublicIds) && product.imagePublicIds.length
      ? product.imagePublicIds
      : (product.images || [])
          .map((url) => extractPublicIdFromUrl(url))
          .filter(Boolean);

  await Promise.all(
    storedPublicIds.map((publicId) => deleteFromCloudinary(publicId)),
  );

  await product.deleteOne();

  return true;
};
