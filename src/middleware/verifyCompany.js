// file: src/middleware/verifyCompany.js
const { Company } = require("../models");

const verifyCompany = async (req, res, next) => {
  try {
    // نفترض أن الـ JWT يحتوي على company_id بعد تسجيل الدخول
    const companyId = req.companyId || req.user?.company_id;
    
    if (!companyId) {
      return res.status(403).json({ message: "صلاحية شركة مطلوبة" });
    }

    const company = await Company.findByPk(companyId);
    if (!company || !company.is_approved) {
      return res.status(403).json({ message: "الشركة غير معتمدة أو غير موجودة" });
    }

    req.company = company;
    next();
  } catch (error) {
    return res.status(500).json({ message: "خطأ في التحقق من صلاحية الشركة" });
  }
};

module.exports = verifyCompany;