import { authenticate } from "./auth.middleware.js";

/**
 * Middleware to protect routes that require authentication
 */
export const protectRoute = (req, res, next) => {
  // Wrap authenticate to ensure it's called correctly
  try {
    authenticate(req, res, next);
  } catch (error) {
    console.error("Protection middleware error:", error);
    // Fallback redirect in case of unexpected errors
    res.status(401).redirect("/unauthorized");
  }
};
