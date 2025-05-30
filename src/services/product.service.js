const Product = require('../models/product.model');

// Create a new product
const createProduct = async (data) => {
  return await Product.create({
    name: data.name,
    price: data.price,
    description: data.description,
    stock: data.stock,
    category: data.category
  });
};

// Get all products
const getAllProducts = async () => {
  return await Product.find();
};

// Get product by ID
const getProductById = async (id) => {
  return await Product.findById(id);
};

// Update product by ID
const updateProduct = async (id, data) => {
  return await Product.findByIdAndUpdate(
    id,
    {
      name: data.name,
      price: data.price,
      description: data.description,
      stock: data.stock,
      category: data.category
    },
    { new: true }
  );
};

// Delete product by ID
const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};

