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

module.exports = {
  createTrainer,
  getAllTrainers,
  getTrainerById,
  updateTrainer,
  deleteTrainer,
};
