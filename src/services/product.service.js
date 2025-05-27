import Product from '../models/product.model.js';

// Create a new product
export const createProduct = async (data) => {
  return await Product.create({
    name: data.name,
    price: data.price,
    description: data.description,
    stock: data.stock,
    category: data.category
  });
};

// Get all products
export const getAllProducts = async () => {
  return await Product.find();
};

// Get product by ID
export const getProductById = async (id) => {
  return await Product.findById(id);
};

// Update product by ID
export const updateProduct = async (id, data) => {
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
export const deleteProduct = async (id) => {
  return await Product.findByIdAndDelete(id);
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct
};

