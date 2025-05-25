import * as membershipService from "../services/membership.service.js";

// Create Membership
export const createMembership = async (req, res) => {
  try {
    const membership = await membershipService.createMembershipService(
      req.body
    );
    res.status(201).json({
      success: true,
      message: "Membership created successfully",
      data: membership,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get All Memberships
export const getAllMemberships = async (req, res) => {
  try {
    const memberships = await membershipService.getAllMembershipsService(
      req.query
    );
    res.status(200).json({
      success: true,
      message: "Memberships retrieved successfully",
      data: memberships,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get Membership by ID
export const getMembershipById = async (req, res) => {
  try {
    const membership = await membershipService.getMembershipByIdService(
      req.params.id
    );
    res.status(200).json({
      success: true,
      message: "Membership retrieved successfully",
      data: membership,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Membership
export const updateMembership = async (req, res) => {
  try {
    const membership = await membershipService.updateMembershipService(
      req.params.id,
      req.body
    );
    res.status(200).json({
      success: true,
      message: "Membership updated successfully",
      data: membership,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete Membership
export const deleteMembership = async (req, res) => {
  try {
    await membershipService.deleteMembershipService(req.params.id);
    res.status(200).json({
      success: true,
      message: "Membership deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
