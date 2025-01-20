import jwt from "jsonwebtoken";
import User from "../mongodb/models/user.js"; // Assuming you're using the User model

// Protect Middleware to authenticate the user
export const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from the header
      token = req.headers.authorization.split(" ")[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // JWT_SECRET should be in your environment variables

      // Attach the user to the request object
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

// Admin-Only Middleware to restrict access to admins
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next(); // If the user is an admin, proceed to the next middleware or route handler
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};
