const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    default: 'No description provided',
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'out_of_stock'],
    default: 'active'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if product is in stock
productSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

// Method to update stock status
productSchema.methods.updateStockStatus = function() {
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.status === 'out_of_stock') {
    this.status = 'active';
  }
};

// Pre-save middleware to update stock status
productSchema.pre('save', function(next) {
  this.updateStockStatus();
  next();
});

// Index for faster queries
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, status: 1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
