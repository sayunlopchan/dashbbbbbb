const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/**
 * Register a new user
 */
const registerUserService = async (data) => {
  const { username, email, password } = data;

  // Validate input
  if (!username || !email || !password) {
    throw new Error("All fields are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    throw new Error("User already exists with this email or username");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    username,
    email,
    password: hashedPassword,
  });

  // Save user
  await user.save();

  // Return user without password
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
};

/**
 * Login user
 */
const loginUserService = async (data) => {
  const { email, password } = data;

  // Validate input
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Normalize email (trim and lowercase)
  const normalizedEmail = email.trim().toLowerCase();

  // Find user with case-insensitive email
  const user = await User.findOne({
    email: {
      $regex: new RegExp(`^${normalizedEmail}$`, "i"),
    },
  });

  // Detailed error handling
  if (!user) {
    throw new Error("No account found with this email address");
  }

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Incorrect password");
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  // Return token and user info
  return {
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  };
};

module.exports = {
  registerUserService,
  loginUserService
};
