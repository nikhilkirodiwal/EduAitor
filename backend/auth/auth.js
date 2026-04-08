import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains role, school_id etc
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
