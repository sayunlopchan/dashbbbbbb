// services/trainer.service.js
const Trainer = require("../models/Trainer.model");
const generateTrainerId = require("../utils/idgenerator/generateTrainerId");
const mongoose = require("mongoose");

// Custom error class for service-level errors
class TrainerServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "TrainerServiceError";
  }
}

// Create Trainer Service
const createTrainerService = async (data) => {
  try {
    // Generate unique trainer ID
    const trainerId = await generateTrainerId();

    // Create trainer with generated ID
    const trainerData = {
      ...data,
      trainerId,
      joinDate: data.joinDate || new Date() // Ensure joinDate is set
    };

    return await Trainer.create(trainerData);
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
const getAllTrainersService = async (query = {}) => {
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
const getTrainerByTrainerIdService = async (trainerId) => {
  const trainer = await Trainer.findOne({ trainerId });

  if (!trainer) {
    throw new TrainerServiceError("Trainer not found", 404);
  }

  return trainer;
};

// Update Trainer by TrainerId
const updateTrainerByTrainerIdService = async (trainerId, data) => {
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
const deleteTrainerByTrainerIdService = async (trainerId) => {
  const deletedTrainer = await Trainer.findOneAndDelete({ trainerId });

  if (!deletedTrainer) {
    throw new TrainerServiceError("Trainer not found", 404);
  }

  return deletedTrainer;
};

// Assign member to trainer (multiple allowed)
const assignMemberToTrainerService = async (trainerId, memberData) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const trainer = await Trainer.findOne({ trainerId });
    if (!trainer) {
      throw new TrainerServiceError("Trainer not found", 404);
    }

    // Find member and get their details
    const Member = require("../models/Member.model");
    const member = await Member.findOne({ memberId: memberData.memberId });
    if (!member) {
      throw new TrainerServiceError("Member not found", 404);
    }

    // Check if member is already assigned to this trainer (active)
    if (trainer.assignedMembers && trainer.assignedMembers.some(m => m.memberId === memberData.memberId && !m.removedDate)) {
      throw new TrainerServiceError("Member is already assigned to this trainer", 409);
    }

    // Add to assignedMembers
    const newAssignment = {
      memberId: member.memberId,
      fullName: member.fullName,
      assignedDate: new Date(),
      status: "active",
      removedDate: null
    };
    trainer.assignedMembers = trainer.assignedMembers || [];
    trainer.assignedMembers.push(newAssignment);

    // Add to assignedMemberHistory
    trainer.assignedMemberHistory = trainer.assignedMemberHistory || [];
    trainer.assignedMemberHistory.push({
      memberId: member.memberId,
      fullName: member.fullName,
      assignedDate: newAssignment.assignedDate,
      removedDate: null
    });

    // Also update the member's personalTrainers and assignedPersonalTrainerHistory
    if (!member.personalTrainers) member.personalTrainers = [];
    if (!member.personalTrainers.some(pt => pt.trainerId === trainerId && !pt.removedDate)) {
      const ptAssignment = {
        trainerId: trainerId,
        trainerFullName: trainer.fullName,
        assignedDate: newAssignment.assignedDate,
        removedDate: null
      };
      member.personalTrainers.push(ptAssignment);
      member.assignedPersonalTrainerHistory = member.assignedPersonalTrainerHistory || [];
      member.assignedPersonalTrainerHistory.push({
        trainerId: trainerId,
        trainerFullName: trainer.fullName,
        assignedDate: newAssignment.assignedDate,
        removedDate: null
      });
    }

    await trainer.save({ session });
    await member.save({ session });

    await session.commitTransaction();
    return trainer;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in assignMemberToTrainerService:", error);
    throw error instanceof TrainerServiceError ? error : new TrainerServiceError(`Failed to assign member to trainer: ${error.message}`, 500);
  } finally {
    session.endSession();
  }
};

// Remove member from trainer (by memberId)
const removeMemberFromTrainerService = async (trainerId, memberId) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const trainer = await Trainer.findOne({ trainerId });
    if (!trainer) {
      throw new TrainerServiceError("Trainer not found", 404);
    }

    // Remove from assignedMembers (set removedDate)
    let found = false;
    if (Array.isArray(trainer.assignedMembers)) {
      trainer.assignedMembers.forEach(m => {
        if (m.memberId === memberId && !m.removedDate) {
          m.removedDate = new Date();
          found = true;
        }
      });
      // Remove from active assignedMembers (keep only those without removedDate)
      trainer.assignedMembers = trainer.assignedMembers.filter(m => !m.removedDate);
    }

    // Update assignedMemberHistory (set removedDate)
    if (Array.isArray(trainer.assignedMemberHistory)) {
      trainer.assignedMemberHistory.forEach(hist => {
        if (hist.memberId === memberId && !hist.removedDate) {
          hist.removedDate = new Date();
        }
      });
    }

    // Also clear the member's personalTrainers and assignedPersonalTrainerHistory for this trainer
    const Member = require("../models/Member.model");
    const member = await Member.findOne({ memberId: memberId });
    if (member) {
      if (Array.isArray(member.personalTrainers)) {
        member.personalTrainers.forEach(pt => {
          if (pt.trainerId === trainerId && !pt.removedDate) {
            pt.removedDate = new Date();
          }
        });
        // Remove from active personalTrainers
        member.personalTrainers = member.personalTrainers.filter(pt => !pt.removedDate);
      }
      if (Array.isArray(member.assignedPersonalTrainerHistory)) {
        member.assignedPersonalTrainerHistory.forEach(hist => {
          if (hist.trainerId === trainerId && !hist.removedDate) {
            hist.removedDate = new Date();
          }
        });
      }
      await member.save({ session });
    }

    if (!found) {
      throw new TrainerServiceError("Member is not assigned to this trainer", 404);
    }

    await trainer.save({ session });
    await session.commitTransaction();
    return trainer;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in removeMemberFromTrainerService:", error);
    throw error instanceof TrainerServiceError ? error : new TrainerServiceError(`Failed to remove member from trainer: ${error.message}`, 500);
  } finally {
    session.endSession();
  }
};

// Get trainer with assigned members
const getTrainerWithMembersService = async (trainerId) => {
  try {
    const trainer = await Trainer.findOne({ trainerId });
    if (!trainer) {
      throw new TrainerServiceError("Trainer not found", 404);
    }

    return trainer;
  } catch (error) {
    console.error("Error in getTrainerWithMembersService:", error);
    throw error instanceof TrainerServiceError ? error : new TrainerServiceError(`Failed to get trainer with members: ${error.message}`, 500);
  }
};

// Get all trainers with their assigned members
const getAllTrainersWithMembersService = async () => {
  try {
    const trainers = await Trainer.find({}).select('trainerId fullName email status assignedMembers');
    return trainers;
  } catch (error) {
    console.error("Error in getAllTrainersWithMembersService:", error);
    throw new TrainerServiceError(`Failed to get trainers with members: ${error.message}`, 500);
  }
};

// Update member status in trainer's assigned members
const updateMemberStatusInTrainerService = async (trainerId, memberId, status) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const trainer = await Trainer.findOne({ trainerId });
    if (!trainer) {
      throw new TrainerServiceError("Trainer not found", 404);
    }

    const member = trainer.assignedMembers.find(
      member => member.memberId === memberId
    );

    if (!member) {
      throw new TrainerServiceError("Member is not assigned to this trainer", 404);
    }

    member.status = status;

    // If status is inactive, we might want to clear the member's personal trainer assignment
    if (status === "inactive") {
      const Member = require("../models/Member.model");
      const memberDoc = await Member.findOne({ memberId: memberId });
      if (memberDoc && memberDoc.personalTrainer && memberDoc.personalTrainer.trainerId === trainerId) {
        memberDoc.personalTrainer = {
          trainerId: null,
          trainerFullName: null,
          assignedDate: null
        };
        await memberDoc.save({ session });
      }
    }

    await trainer.save({ session });
    await session.commitTransaction();
    return trainer;
  } catch (error) {
    await session.abortTransaction();
    console.error("Error in updateMemberStatusInTrainerService:", error);
    throw error instanceof TrainerServiceError ? error : new TrainerServiceError(`Failed to update member status: ${error.message}`, 500);
  } finally {
    session.endSession();
  }
};

module.exports = {
  createTrainerService,
  getAllTrainersService,
  getTrainerByTrainerIdService,
  updateTrainerByTrainerIdService,
  deleteTrainerByTrainerIdService,
  assignMemberToTrainerService,
  removeMemberFromTrainerService,
  getTrainerWithMembersService,
  getAllTrainersWithMembersService,
  updateMemberStatusInTrainerService
};
