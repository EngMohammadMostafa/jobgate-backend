const Company = require("../models/company.model");

//   إنشاء شركة جديدة
exports.createCompany = async (req, res) => {
  try {
    const { name, email, phone, logo_url, description } = req.body;
    const newCompany = await Company.create({
      name,
      email,
      phone,
      logo_url,
      description,
    });
    res
      .status(201)
      .json({ message: "تم إنشاء الشركة بنجاح", company: newCompany });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء الشركة", error: error.message });
  }
};
//   عرض جميع الشركات
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll();
    res.status(200).json(companies);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب الشركات", error: error.message });
  }
};

//   عرض تفاصيل شركة واحدة
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });
    res.status(200).json(company);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب الشركة", error: error.message });
  }
};

//   تعديل بيانات شركة
exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });

    const { name, email, phone, logo_url, description, is_verified } = req.body;
    await company.update({
      name,
      email,
      phone,
      logo_url,
      description,
      is_verified,
    });

    res.status(200).json({ message: "تم تحديث بيانات الشركة بنجاح", company });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تحديث الشركة", error: error.message });
  }
};

//   حذف شركة
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ message: "الشركة غير موجودة" });

    await company.destroy();
    res.status(200).json({ message: "تم حذف الشركة بنجاح" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء حذف الشركة", error: error.message });
  }
};
