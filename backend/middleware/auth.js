const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: token missing" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure user still exists and attach minimal public info
    const user = await User.findById(decoded.id).select("name email role");
    if (!user) return res.status(401).json({ message: "Unauthorized: user not found" });

    req.user = { id: user._id.toString(), role: user.role, name: user.name, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
};
