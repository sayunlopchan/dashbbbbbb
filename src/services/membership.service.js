const Membership = require("../models/membership.model");

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
