// services/trainer.service.js
import Trainer from "../models/Trainer.model.js";
import { generateTrainerId } from "../utils/idgenerator/generateTrainerId.js";

// Custom error class for service-level errors
class TrainerServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TrainerServiceError";
  }
}

// Pagination default options
const DEFAULT_PAGINATION_OPTIONS = {
  page: 1,
  sort: { createdAt: -1 },
};

// Create Trainer Service
export const createTrainerService = async (data) => {
  try {
    // Generate unique trainer ID
    const trainerId = await generateTrainerId();

    // Create trainer with generated ID
    return await Trainer.create({ ...data, trainerId });
  } catch (error) {
    // Handle specific mongoose validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      throw new TrainerServiceError(errorMessages, 400);
    }

    // Handle duplicate key error (unique constraints)
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new TrainerServiceError(
        `A trainer with this ${duplicateField} already exists`,
        409
      );
    }

    // Rethrow other unexpected errors
    throw error;
  }
};

// Get All Trainers with Pagination
export const getAllTrainersService = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 0; // Set to 0 to remove limit
  const skip = (page - 1) * limit;
  const sort = { createdAt: -1 };

  // Prepare filter conditions
  const filter = {};

  // Status filter
  if (query.status && ["active", "inactive"].includes(query.status)) {
    filter.status = query.status;
  }

  // Search filter
  if (query.search) {
    const searchRegex = new RegExp(query.search, "i");
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { specialization: searchRegex },
    ];
  }

  // Get total count
  const total = await Trainer.countDocuments(filter);
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  // Get paginated results
  const docs = await Trainer.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit || 0); // Set to 0 to remove limit

  return {
    docs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

// Get Trainer by TrainerId
export const getTrainerByTrainerIdService = async (trainerId) => {
  const trainer = await Trainer.findOne({ trainerId });

  if (!trainer) {
    throw new TrainerServiceError("Trainer not found", 404);
  }

  return trainer;
};

// Update Trainer by TrainerId
export const updateTrainerByTrainerIdService = async (trainerId, data) => {
  try {
    // Validate input
    if (!trainerId) {
      throw new TrainerServiceError("Trainer ID is required", 400);
    }

    // Prevent updating trainerId
    if (data.trainerId) {
      delete data.trainerId;
    }

    // Validate status if provided
    if (
      data.status &&
      !["active", "inactive"].includes(data.status.toLowerCase())
    ) {
      throw new TrainerServiceError(
        "Invalid status. Must be active or inactive",
        400
      );
    }

    // Perform update with validation
    const updatedTrainer = await Trainer.findOneAndUpdate({ trainerId }, data, {
      new: true,
      runValidators: true,
      context: "query",
    });

    if (!updatedTrainer) {
      throw new TrainerServiceError("Trainer not found", 404);
    }

    return updatedTrainer;
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      throw new TrainerServiceError(errorMessages, 400);
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      throw new TrainerServiceError(
        `A trainer with this ${duplicateField} already exists`,
        409
      );
    }

    // Rethrow or wrap other errors
    throw error instanceof TrainerServiceError
      ? error
      : new TrainerServiceError("Failed to update trainer", 500);
  }
};

// Delete Trainer by TrainerId
export const deleteTrainerByTrainerIdService = async (trainerId) => {
  const deletedTrainer = await Trainer.findOneAndDelete({ trainerId });

  if (!deletedTrainer) {
    throw new TrainerServiceError("Trainer not found", 404);
  }

  return deletedTrainer;
};
