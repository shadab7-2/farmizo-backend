const categoryService = require("../services/category.service");

/*
|--------------------------------------------------------------------------
| Get All Active Categories (Public)
|--------------------------------------------------------------------------
| GET /api/categories
*/
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await categoryService.getAllActive();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Get Category By Slug (Public)
|--------------------------------------------------------------------------
| GET /api/categories/:slug
*/
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const category = await categoryService.getBySlug(req.params.slug);

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Create Category (Admin)
|--------------------------------------------------------------------------
| POST /api/categories
*/
exports.createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Update Category (Admin)
|--------------------------------------------------------------------------
| PUT /api/categories/:id
*/
exports.updateCategory = async (req, res, next) => {
  try {
    const updated = await categoryService.update(
      req.params.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/*
|--------------------------------------------------------------------------
| Delete Category (Admin)
|--------------------------------------------------------------------------
| DELETE /api/categories/:id
*/
exports.deleteCategory = async (req, res, next) => {
  try {
    await categoryService.remove(req.params.id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
