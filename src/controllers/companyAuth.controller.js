const { Company } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize"); // 🆕 أضف هذا الاستيراد

/**
 * @desc [Public] تسجيل دخول الشركة
 * @route POST /api/companies/login
 * @access Public
 */
exports.loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "البريد الإلكتروني وكلمة المرور مطلوبان",
      });
    }

    const company = await Company.findOne({ where: { email } });

    if (!company || !company.is_approved) {
      return res.status(401).json({
        message: "بيانات تسجيل الدخول غير صحيحة",
      });
    }

    // التحقق من وجود كلمة مرور
    if (!company.password) {
      return res.status(401).json({
        message: "لم يتم تعيين كلمة مرور لحسابك. يرجى استخدام رابط التعيين",
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "بيانات تسجيل الدخول غير صحيحة",
      });
    }

    const token = jwt.sign(
      {
        company_id: company.company_id,
        role: "company",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      company: {
        company_id: company.company_id,
        name: company.name,
        email: company.email,
      },
    });
  } catch (error) {
    console.error("Company login error:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء تسجيل الدخول",
    });
  }
};

/**
 * @desc [Public] تعيين كلمة مرور الشركة (أول مرة)
 * @route POST /api/companies/set-password
 * @access Public
 */
exports.setCompanyPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "التوكن وكلمة المرور مطلوبان",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      });
    }

    const company = await Company.findOne({
      where: {
        set_password_token: token,
        set_password_expires: { [Op.gt]: new Date() },
      },
    });

    if (!company) {
      return res.status(400).json({
        message: "الرابط غير صالح أو منتهي الصلاحية",
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // تحديث الشركة
    await company.update({
      password: hashedPassword,
      password_set_at: new Date(),
      set_password_token: null,
      set_password_expires: null,
    });

    return res.json({
      message: "تم تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
    });

  } catch (error) {
    console.error("Error setting password:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء تعيين كلمة المرور",
    });
  }
};

/**
 * @desc [Private/Company] تغيير كلمة مرور الشركة
 * @route PUT /api/companies/change-password
 * @access Private (Company)
 */
exports.changeCompanyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const company = req.company;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "كلمة المرور الحالية والجديدة مطلوبتان",
      });
    }

    // التحقق من كلمة المرور الحالية
    const isMatch = await bcrypt.compare(currentPassword, company.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "كلمة المرور الحالية غير صحيحة",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
      });
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await company.update({
      password: hashedPassword,
      password_set_at: new Date(),
    });

    return res.json({
      message: "تم تغيير كلمة المرور بنجاح",
    });

  } catch (error) {
    console.error("Error changing password:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء تغيير كلمة المرور",
    });
  }
};