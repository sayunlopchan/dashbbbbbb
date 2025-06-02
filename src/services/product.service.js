const Product = require('../models/product.model');
const generateProductId = require('../utils/idgenerator/generateProductId');

// Create a new product
const createProduct = async (productData) => {
  try {
    const productId = await generateProductId();
    const product = new Product({
      ...productData,
      productId,
      status: productData.stock > 0 ? 'in-stock' : 'out-of-stock'
    });
    return await product.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('A product with this name already exists');
    }
    throw error;
  }
};

// Get all products with optional filtering
const getAllProducts = async (filters = {}) => {
  try {
    const query = {};

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { productId: { $regex: filters.search, $options: 'i' } }
      ];
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.price = {};
      if (filters.minPrice !== undefined) {
        query.price.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.price.$lte = filters.maxPrice;
      }
    }

    return await Product.find(query).sort({ createdAt: -1 });
  } catch (error) {
    throw error;
  }
};

// Search products by name, description, or productId
const searchProducts = async (query) => {
  try {
    const searchRegex = new RegExp(query, 'i');
    return await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { productId: searchRegex }
      ]
    })
    .select('productId name price stock status')
    .limit(10)
    .sort({ name: 1 });
  } catch (error) {
    throw error;
  }
};

// Get a product by productId
const getProductById = async (productId) => {
  try {
    return await Product.findOne({ productId });
  } catch (error) {
    throw error;
  }
};

// Update a product
const updateProduct = async (productId, updateData) => {
  try {
    const product = await Product.findOne({ productId });
    if (!product) {
      return null;
    }

    // Update stock status if stock is being modified
    if (updateData.stock !== undefined) {
      updateData.status = updateData.stock > 0 ? 'in-stock' : 'out-of-stock';
    }

    Object.assign(product, updateData);
    return await product.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('A product with this name already exists');
    }
    throw error;
  }
};

// Delete a product
const deleteProduct = async (productId) => {
  try {
    return await Product.findOneAndDelete({ productId });
  } catch (error) {
    throw error;
  }
};

// Update product stock
const updateProductStock = async (productId, quantity, operation = 'decrease') => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    const product = await Product.findOne({ productId }).session(session);
    if (!product) {
      throw new Error('Product not found');
    }

    if (operation === 'decrease') {
      if (product.stock < quantity) {
        throw new Error('Insufficient stock available');
      }
      product.stock -= quantity;
    } else {
      product.stock += quantity;
    }

    // Update status based on new stock level
    product.status = product.stock > 0 ? 'in-stock' : 'out-of-stock';
    
    await product.save({ session });
    await session.commitTransaction();
    return product;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateProductStock
};

