// controllers/trainer.controller.js
const trainerService = require("../services/trainer.service");
const asyncHandler = require("../utils/asyncHandler");

// Create Trainer
const createTrainer = asyncHandler(async (req, res) => {
  const trainer = await trainerService.createTrainerService(req.body);

  res.status(201).json({
    success: true,
    message: "Trainer created successfully",
    data: trainer,
  });
});

// Get All Trainers with Pagination
const getAllTrainers = asyncHandler(async (req, res) => {
  // Parse query parameters with defaults
  const { page = 1, sort = "-createdAt", status, ...filter } = req.query;

  // Prepare options for service
  const options = {
    page: parseInt(page),
    sort,
    status,
    ...filter,
  };

  // Fetch paginated results
  const result = await trainerService.getAllTrainersService(options);

  res.status(200).json({
    success: true,
    data: result.docs,
    pagination: result.pagination,
  });
});

// Get Trainer by ID
const getTrainerById = asyncHandler(async (req, res) => {
  const trainer = await trainerService.getTrainerByTrainerIdService(
    req.params.trainerId
  );

  res.status(200).json({
    success: true,
    data: trainer,
  });
});

// Update Trainer
const updateTrainer = asyncHandler(async (req, res) => {
  const updated = await trainerService.updateTrainerByTrainerIdService(
    req.params.trainerId,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Trainer updated successfully",
    data: updated,
  });
});

// Delete Trainer
const deleteTrainer = asyncHandler(async (req, res) => {
  await trainerService.deleteTrainerByTrainerIdService(req.params.trainerId);

  res.status(200).json({
    success: true,
    message: "Trainer deleted successfully",
  });
});

// Assign member to trainer
const assignMemberToTrainer = asyncHandler(async (req, res) => {
  const { trainerId } = req.params;
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({
      success: false,
      message: "Member ID is required"
    });
  }

  const trainer = await trainerService.assignMemberToTrainerService(trainerId, {
    memberId
  });

  res.status(200).json({
    success: true,
    message: "Member assigned to trainer successfully",
    data: trainer
  });
});

// Remove member from trainer
const removeMemberFromTrainer = asyncHandler(async (req, res) => {
  const { trainerId, memberId } = req.params;

  const trainer = await trainerService.removeMemberFromTrainerService(trainerId, memberId);

  res.status(200).json({
    success: true,
    message: "Member removed from trainer successfully",
    data: trainer
  });
});

// Get trainer with assigned members
const getTrainerWithMembers = asyncHandler(async (req, res) => {
  const { trainerId } = req.params;

  const trainer = await trainerService.getTrainerWithMembersService(trainerId);

  res.status(200).json({
    success: true,
    data: trainer
  });
});

// Get all trainers with their assigned members
const getAllTrainersWithMembers = asyncHandler(async (req, res) => {
  const trainers = await trainerService.getAllTrainersWithMembersService();

  res.status(200).json({
    success: true,
    data: trainers
  });
});

// Update member status in trainer
const updateMemberStatusInTrainer = asyncHandler(async (req, res) => {
  const { trainerId, memberId } = req.params;
  const { status } = req.body;

  if (!status || !["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be 'active' or 'inactive'"
    });
  }

  const trainer = await trainerService.updateMemberStatusInTrainerService(trainerId, memberId, status);

  res.status(200).json({
    success: true,
    message: "Member status updated successfully",
    data: trainer
  });
});

module.exports = {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
  assignMemberToTrainer,
  removeMemberFromTrainer,
  getTrainerWithMembers,
  getAllTrainersWithMembers,
  updateMemberStatusInTrainer
};
