const jwt = require("jsonwebtoken");
const { User } = require("../model");
const JWT_SECRET = process.env.JWT_SECRET;

exports.auth = async (req, res, next) => {
  try {
    // Try to get token from Authorization header or cookies
    let token = null;
    const header = req.headers.authorization || "";

    if (header.startsWith("Bearer ")) {
      token = header.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User not found" });

    // Attach user id and role to request
    req.user = { id: user._id, role: user.role };

    next();
  } catch (err) {
    res.status(401).json({
      message: "Your session has expired. Please login again to continue.",
    });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

// Add optionalAuth: attaches req.user when a valid token is present but does not block if missing/invalid

exports.optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    const header = req.headers.authorization || "";

    if (header.startsWith("Bearer ")) {
      token = header.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (user) {
      req.user = { id: user._id, role: user.role };
    }

    return next();
  } catch (err) {
    // If token invalid/expired, proceed without user

    return next();
  }
};
