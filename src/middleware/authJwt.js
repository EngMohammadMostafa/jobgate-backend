const jwt = require("jsonwebtoken");

exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers["authorization"];

    if (!token) {
      return res.status(401).json({ message: "يرجى تسجيل الدخول" });
    }

    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );

    req.user = decoded; // يتضمن id + role
    next();
  } catch (error) {
    return res.status(401).json({ message: "رمز JWT غير صالح" });
  }
};
