const authService = require("../services/auth.service");

// Register
const register = async (req, res) => {
  try {
    const user = await authService.registerUserService(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// login
const login = async (req, res) => {
  try {
    const { token, user } = await authService.loginUserService(req.body);

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      // maxAge: 10 * 1000, // 10 seconds
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

// Logout
const logout = (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Verify Token
const verifyToken = (req, res) => {
  // If the request reaches here, it means the token is valid
  // The authenticate middleware would have already checked the token
  res.status(200).json({
    success: true,
    message: "Token is valid",
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  verifyToken,
};
