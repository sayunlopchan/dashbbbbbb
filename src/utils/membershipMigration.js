const Membership = require("../models/Membership.model");

/**
 * Migration script to add default color data to existing memberships
 */
const migrateMembershipColors = async () => {
  try {
    console.log("Starting membership color migration...");
    
    // Find all memberships without colorData
    const membershipsWithoutColor = await Membership.find({
      $or: [
        { colorData: { $exists: false } },
        { colorData: null }
      ]
    });

    console.log(`Found ${membershipsWithoutColor.length} memberships without color data`);

    if (membershipsWithoutColor.length === 0) {
      console.log("No memberships need migration");
      return;
    }

    // Default color schemes based on membership title
    const defaultColors = {
      silver: {
        type: 'gradient',
        color1: '#C0C0C0',
        color2: '#808080',
        direction: '135deg'
      },
      gold: {
        type: 'gradient',
        color1: '#FFD700',
        color2: '#FFA500',
        direction: '135deg'
      },
      diamond: {
        type: 'gradient',
        color1: '#B9F2FF',
        color2: '#87CEEB',
        direction: '135deg'
      },
      platinum: {
        type: 'gradient',
        color1: '#E5E4E2',
        color2: '#BCC6CC',
        direction: '135deg'
      },
      bronze: {
        type: 'gradient',
        color1: '#CD7F32',
        color2: '#8B4513',
        direction: '135deg'
      }
    };

    // Update each membership with default color data
    for (const membership of membershipsWithoutColor) {
      const titleLower = membership.title.toLowerCase();
      let colorData = defaultColors.silver; // default fallback

      // Find matching color scheme
      for (const [key, colors] of Object.entries(defaultColors)) {
        if (titleLower.includes(key)) {
          colorData = colors;
          break;
        }
      }

      // Update membership with color data
      await Membership.findByIdAndUpdate(membership._id, {
        colorData: colorData
      });

      console.log(`Updated membership "${membership.title}" with color data`);
    }

    console.log("Membership color migration completed successfully");
  } catch (error) {
    console.error("Error during membership color migration:", error);
    throw error;
  }
};

/**
 * Reset all membership colors to default
 */
const resetMembershipColors = async () => {
  try {
    console.log("Resetting all membership colors to default...");
    
    const memberships = await Membership.find({});
    
    const defaultColors = {
      silver: {
        type: 'gradient',
        color1: '#C0C0C0',
        color2: '#808080',
        direction: '135deg'
      },
      gold: {
        type: 'gradient',
        color1: '#FFD700',
        color2: '#FFA500',
        direction: '135deg'
      },
      diamond: {
        type: 'gradient',
        color1: '#B9F2FF',
        color2: '#87CEEB',
        direction: '135deg'
      },
      platinum: {
        type: 'gradient',
        color1: '#E5E4E2',
        color2: '#BCC6CC',
        direction: '135deg'
      },
      bronze: {
        type: 'gradient',
        color1: '#CD7F32',
        color2: '#8B4513',
        direction: '135deg'
      }
    };

    for (const membership of memberships) {
      const titleLower = membership.title.toLowerCase();
      let colorData = defaultColors.silver; // default fallback

      // Find matching color scheme
      for (const [key, colors] of Object.entries(defaultColors)) {
        if (titleLower.includes(key)) {
          colorData = colors;
          break;
        }
      }

      // Update membership with color data
      await Membership.findByIdAndUpdate(membership._id, {
        colorData: colorData
      });

      console.log(`Reset membership "${membership.title}" with default color data`);
    }

    console.log("Membership color reset completed successfully");
  } catch (error) {
    console.error("Error during membership color reset:", error);
    throw error;
  }
};

module.exports = {
  migrateMembershipColors,
  resetMembershipColors
}; 