const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

  const isMatch = await bcrypt.compare(password, user.hashed_password);
  if (!isMatch)
    return res.status(401).json({ message: "كلمة المرور غير صحيحة" });

  const token = jwt.sign(
    { id: user.id, role: "admin" },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );

  res.json({ message: "تم تسجيل الدخول بنجاح", token });
};

exports.logout = (req, res) => {
  res.json({ message: "تم تسجيل الخروج بنجاح" });
};
