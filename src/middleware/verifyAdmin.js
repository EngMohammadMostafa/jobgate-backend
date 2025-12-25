module.exports = (req, res, next) => {
  if (!req.user || req.user.user_type !== "admin") {
    return res.status(403).json({ message: "ليس لديك صلاحية (أدمن فقط)" });
  }
  next();
};
