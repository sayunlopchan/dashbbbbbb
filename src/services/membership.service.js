const Membership = require("../models/Membership.model");

/**
 * Validate color data
 */
const validateColorData = (colorData) => {
  if (!colorData) return true; // colorData is optional
  
  if (colorData.type === 'simple') {
    if (!colorData.color || !/^#[0-9A-Fa-f]{6}$/.test(colorData.color)) {
      throw new Error("Invalid simple color format. Must be a valid hex color (e.g., #3498db)");
    }
  } else if (colorData.type === 'gradient') {
    if (!colorData.color1 || !colorData.color2 || !colorData.direction) {
      throw new Error("Gradient requires color1, color2, and direction");
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorData.color1) || !/^#[0-9A-Fa-f]{6}$/.test(colorData.color2)) {
      throw new Error("Invalid gradient colors. Must be valid hex colors (e.g., #3498db)");
    }
    const validDirections = ['to right', 'to bottom', '135deg', '45deg'];
    if (!validDirections.includes(colorData.direction)) {
      throw new Error("Invalid gradient direction");
    }
  } else {
    throw new Error("Invalid color type. Must be 'simple' or 'gradient'");
  }
  
  return true;
};

/**
 * Create a new membership
 */
const createMembershipService = async (membershipData) => {
  try {
    // Validate input
    if (
      !membershipData.title ||
      !membershipData.price ||
      !membershipData.duration
    ) {
      throw new Error("Title, price, and duration are required");
    }

    // Validate color data if provided
    if (membershipData.colorData) {
      validateColorData(membershipData.colorData);
    }

    // Check if membership with same title already exists
    const existingMembership = await Membership.findOne({
      title: membershipData.title,
    });
    if (existingMembership) {
      throw new Error("A membership with this title already exists");
    }

    // Create new membership
    const membership = new Membership(membershipData);
    await membership.save();

    return membership;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Get all memberships
 */
const getAllMembershipsService = async (query = {}) => {
  try {
    // Remove filtering by active status
    return await Membership.find();
  } catch (error) {
    throw new Error("Error fetching memberships");
  }
};

/**
 * Get membership by ID
 */
const getMembershipByIdService = async (id) => {
  try {
    const membership = await Membership.findById(id);
    if (!membership) {
      throw new Error("Membership not found");
    }
    return membership;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Update membership
 */
const updateMembershipService = async (id, updateData) => {
  try {
    // Prevent updating title to an existing title
    if (updateData.title) {
      const existingMembership = await Membership.findOne({
        title: updateData.title,
        _id: { $ne: id },
      });
      if (existingMembership) {
        throw new Error("A membership with this title already exists");
      }
    }

    // Validate color data if provided
    if (updateData.colorData) {
      validateColorData(updateData.colorData);
    }

    // Update membership
    const membership = await Membership.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!membership) {
      throw new Error("Membership not found");
    }

    return membership;
  } catch (error) {
    throw new Error(error.message);
  }
};

/**
 * Delete membership
 */
const deleteMembershipService = async (id) => {
  try {
    const membership = await Membership.findByIdAndDelete(id);
    if (!membership) {
      throw new Error("Membership not found");
    }
    return membership;
  } catch (error) {
    throw new Error(error.message);
  }
};

module.exports = {
  createMembershipService,
  getAllMembershipsService,
  getMembershipByIdService,
  updateMembershipService,
  deleteMembershipService
};
