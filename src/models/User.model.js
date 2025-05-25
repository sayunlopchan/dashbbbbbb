import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Add index for case-insensitive email search
    indexes: [
      { email: 1, unique: true },
      { username: 1 }
    ],
  }
);

// Ensure email is always lowercase
userSchema.pre("save", function (next) {
  this.email = this.email.toLowerCase().trim();
  next();
});

// Remove password when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Use mongoose.models to prevent model overwrite
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
