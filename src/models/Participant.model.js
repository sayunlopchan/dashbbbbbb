const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      ref: "Event",
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      default: null,
    },
    participantInfo: {
      fullName: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      contact: {
        type: String,
        required: true,
        trim: true,
      },
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      },
    },
  }
);

// Ensure unique participation per event and email
ParticipantSchema.index(
  { event: 1, "participantInfo.email": 1 },
  { unique: true }
);

const Participant =
  mongoose.models.Participant ||
  mongoose.model("Participant", ParticipantSchema);

module.exports = Participant;
