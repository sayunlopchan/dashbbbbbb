const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Membership title is required"],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Membership price is required"],
      min: [0, "Price cannot be negative"],
    },
    duration: {
      type: String,
      required: [true, "Membership duration is required"],
    },
    colorData: {
      type: {
        type: String,
        enum: ['simple', 'gradient'],
        default: 'simple'
      },
      color: {
        type: String,
        validate: {
          validator: function(v) {
            if (this.colorData && this.colorData.type === 'simple') {
              return /^#[0-9A-Fa-f]{6}$/.test(v);
            }
            return true;
          },
          message: 'Color must be a valid hex color code (e.g., #3498db)'
        }
      },
      color1: {
        type: String,
        validate: {
          validator: function(v) {
            if (this.colorData && this.colorData.type === 'gradient') {
              return /^#[0-9A-Fa-f]{6}$/.test(v);
            }
            return true;
          },
          message: 'Color1 must be a valid hex color code (e.g., #3498db)'
        }
      },
      color2: {
        type: String,
        validate: {
          validator: function(v) {
            if (this.colorData && this.colorData.type === 'gradient') {
              return /^#[0-9A-Fa-f]{6}$/.test(v);
            }
            return true;
          },
          message: 'Color2 must be a valid hex color code (e.g., #2980b9)'
        }
      },
      direction: {
        type: String,
        enum: ['to right', 'to bottom', '135deg', '45deg'],
        default: 'to right'
      }
    }
  },
  {
    timestamps: true,
  }
);

// Validate price is a positive number
membershipSchema.path("price").validate(function (value) {
  return value >= 0;
}, "Price must be a non-negative number");

// Pre-save middleware to validate colorData
membershipSchema.pre('save', function(next) {
  if (this.colorData) {
    if (this.colorData.type === 'simple') {
      if (!this.colorData.color || !/^#[0-9A-Fa-f]{6}$/.test(this.colorData.color)) {
        return next(new Error('Invalid simple color format. Must be a valid hex color (e.g., #3498db)'));
      }
    } else if (this.colorData.type === 'gradient') {
      if (!this.colorData.color1 || !this.colorData.color2 || !this.colorData.direction) {
        return next(new Error('Gradient requires color1, color2, and direction'));
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(this.colorData.color1) || !/^#[0-9A-Fa-f]{6}$/.test(this.colorData.color2)) {
        return next(new Error('Invalid gradient colors. Must be valid hex colors (e.g., #3498db)'));
      }
      const validDirections = ['to right', 'to bottom', '135deg', '45deg'];
      if (!validDirections.includes(this.colorData.direction)) {
        return next(new Error('Invalid gradient direction'));
      }
    } else {
      return next(new Error('Invalid color type. Must be "simple" or "gradient"'));
    }
  }
  next();
});

// Pre-update middleware to validate colorData
membershipSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.colorData) {
    if (update.colorData.type === 'simple') {
      if (!update.colorData.color || !/^#[0-9A-Fa-f]{6}$/.test(update.colorData.color)) {
        return next(new Error('Invalid simple color format. Must be a valid hex color (e.g., #3498db)'));
      }
    } else if (update.colorData.type === 'gradient') {
      if (!update.colorData.color1 || !update.colorData.color2 || !update.colorData.direction) {
        return next(new Error('Gradient requires color1, color2, and direction'));
      }
      if (!/^#[0-9A-Fa-f]{6}$/.test(update.colorData.color1) || !/^#[0-9A-Fa-f]{6}$/.test(update.colorData.color2)) {
        return next(new Error('Invalid gradient colors. Must be valid hex colors (e.g., #3498db)'));
      }
      const validDirections = ['to right', 'to bottom', '135deg', '45deg'];
      if (!validDirections.includes(update.colorData.direction)) {
        return next(new Error('Invalid gradient direction'));
      }
    } else {
      return next(new Error('Invalid color type. Must be "simple" or "gradient"'));
    }
  }
  next();
});

const Membership = mongoose.model("Membership", membershipSchema);

module.exports = Membership;
