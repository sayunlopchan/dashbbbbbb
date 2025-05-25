import jwt from "jsonwebtoken";

/**
 * Authentication middleware
 */
export const authenticate = (req, res, next) => {
  // Get token from cookies or Authorization header
  const token =
    req.cookies.token ||
    (req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  // Check if the request is for a page or an API
  const isPageRequest = req.headers.accept?.includes("text/html");
  const isAPIRequest = req.headers.accept?.includes("application/json");

  if (!token) {
    // If it's an API request, return JSON error
    if (isAPIRequest) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token provided",
      });
    }

    // For page requests, redirect to unauthorized page
    return res.status(401).redirect("/unauthorized");
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    // If it's an API request, return JSON error
    if (isAPIRequest) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }

    // For page requests, redirect to unauthorized page
    return res.status(401).redirect("/unauthorized");
  }
};
