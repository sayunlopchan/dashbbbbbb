const productService = require('../services/product.service');

// Create a product
const create = async (req, res) => {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Get all products with optional filtering
const getAll = async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      status: req.query.status,
      search: req.query.search,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined
    };

    const products = await productService.getAllProducts(filters);
    
    res.json({
      success: true,
      data: products,
      total: products.length
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Search products
const search = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: [],
        message: 'Search query must be at least 2 characters long'
      });
    }

    const products = await productService.searchProducts(q);
    res.json({
      success: true,
      data: products
    });
  } catch (err) {
    console.error('Error searching products:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get a product by ID
const getById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Update a product
const update = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.productId, req.body);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

// Delete a product
const remove = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.productId);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        error: 'Product not found' 
      });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully',
      data: product
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

module.exports = {
  create,
  getAll,
  search,
  getById,
  update,
  remove
};


    