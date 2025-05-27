import productService from '../services/product.service.js';

// Create a product
export const create = async (req, res) => {
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
export const getAll = async (req, res) => {
  try {
    let products = await productService.getAllProducts();
    
    // Apply filters if provided
    const { category, stockStatus, priceRange, search } = req.query;
    
    if (category) {
      products = products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (stockStatus) {
      products = products.filter(product => {
        if (stockStatus === 'in-stock') return product.stock > 0;
        if (stockStatus === 'out-of-stock') return product.stock <= 0;
        if (stockStatus === 'low-stock') return product.stock > 0 && product.stock <= 10;
        return true;
      });
    }
    
    if (priceRange) {
      products = products.filter(product => {
        const price = product.price;
        if (priceRange === '0-50') return price >= 0 && price <= 50;
        if (priceRange === '51-100') return price >= 51 && price <= 100;
        if (priceRange === '101-200') return price >= 101 && price <= 200;
        if (priceRange === '201+') return price >= 201;
        return true;
      });
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(product =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }
    
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

// Get a product by ID
export const getById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
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
export const update = async (req, res) => {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
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
export const remove = async (req, res) => {
  try {
    const product = await productService.deleteProduct(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  create,
  getAll,
  getById,
  update,
  remove
};


    