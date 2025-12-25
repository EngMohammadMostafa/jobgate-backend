// file: src/controllers/companyRequests.controller.js (المُصلَح)
const { CompanyRequest, Company } = require("../models");
const sequelize = require("../config/db.config");
const { successResponse } = require("../utils/responseHandler");

/**
 * @desc [Public] تقديم طلب تسجيل شركة جديد
 * @route POST /api/company-requests
 * @access Public
 */
exports.createRequest = async (req, res) => {
  try {
    const { name, email, phone, license_doc_url, description, logo_url } = req.body;

    // التحقق من الحقول الإجبارية
    if (!name || !email || !license_doc_url) {
      return res.status(400).json({ 
        message: "الاسم، البريد الإلكتروني، ورابط الرخصة إجباريون." 
      });
    }

    // 1. التأكد من عدم وجود شركة مسجلة بنفس البريد الإلكتروني مسبقاً
    const existingCompany = await Company.findOne({
      where: { email }
    });
    if (existingCompany) {
      return res.status(400).json({ 
        message: "هذا البريد الإلكتروني مسجل بالفعل كشركة معتمدة." 
      });
    }

    // 2. التأكد من عدم وجود طلب قيد الانتظار بنفس الإيميل
    const existingRequest = await CompanyRequest.findOne({
      where: { email, status: "pending" }
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "هناك بالفعل طلب قيد المراجعة بهذا البريد الإلكتروني."
      });
    }

    // 3. إنشاء الطلب
    const request = await CompanyRequest.create({
      name,
      email,
      phone,
      license_doc_url,
      description,
      logo_url
    });

    return successResponse(
      res,
      { request_id: request.request_id, status: request.status },
      "تم إرسال طلب التسجيل بنجاح، سيتم مراجعته",
      201
    );
  } catch (error) {
    // خطأ تكرار الإيميل في جدول الطلبات
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "هذا البريد الإلكتروني موجود بالفعل كطلب سابق أو شركة."
      });
    }
    console.error("Error creating company request:", error);
    return res.status(500).json({ 
      message: "حدث خطأ أثناء إنشاء الطلب", 
      error: error.message 
    });
  }
};

/**
 * @desc [Admin] عرض جميع طلبات التسجيل
 * @route GET /api/company-requests
 * @access Private (Admin)
 */
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await CompanyRequest.findAll({
      order: [['created_at', 'DESC']]
    });
    return successResponse(res, requests);
  } catch (error) {
    console.error("Error getting all requests:", error);
    return res.status(500).json({ 
      message: "حدث خطأ أثناء جلب الطلبات", 
      error: error.message 
    });
  }
};

/**
 * @desc [Admin] عرض تفاصيل طلب محدد
 * @route GET /api/company-requests/:id
 * @access Private (Admin)
 */
exports.getRequestById = async (req, res) => {
  try {
    const request = await CompanyRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    return successResponse(res, request);
  } catch (error) {
    console.error("Error getting request by ID:", error);
    return res.status(500).json({ 
      message: "حدث خطأ أثناء جلب الطلب", 
      error: error.message 
    });
  }
};

/**
 * @desc [Admin] الموافقة على طلب تسجيل شركة
 * @route PUT /api/company-requests/approve/:id
 * @access Private (Admin)
 */
exports.approveRequest = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const request = await CompanyRequest.findByPk(req.params.id, {
      transaction: t
    });
    
    if (!request) {
      await t.rollback();
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    
    if (request.status !== "pending") {
      await t.rollback();
      return res.status(400).json({ message: "تم معالجة هذا الطلب مسبقاً." });
    }

    // 1. إنشاء حساب الشركة
    const newCompany = await Company.create(
      {
        name: request.name,
        email: request.email,
        phone: request.phone,
        license_doc_url: request.license_doc_url,
        logo_url: request.logo_url,
        description: request.description,
        is_approved: true
      },
      { transaction: t }
    );

    // 2. تحديث حالة الطلب
    request.status = "approved";
    request.approved_company_id = newCompany.company_id;
    await request.save({ transaction: t });

    await t.commit();
    
    return successResponse(res, {
      company: newCompany,
      request: request
    }, "تمت الموافقة على الطلب وإنشاء حساب الشركة بنجاح");
    
  } catch (error) {
    await t.rollback();
    console.error("Error approving request:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء الموافقة على الطلب",
      error: error.message
    });
  }
};

/**
 * @desc [Admin] رفض طلب تسجيل شركة
 * @route PUT /api/company-requests/reject/:id
 * @access Private (Admin)
 */
exports.rejectRequest = async (req, res) => {
  try {
    const request = await CompanyRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "تم معالجة هذا الطلب مسبقاً (مقبول أو مرفوض سابقًا)."
      });
    }

    const { admin_review_notes } = req.body;
    if (!admin_review_notes) {
      return res.status(400).json({
        message: "ملاحظات المسؤول (admin_review_notes) مطلوبة لرفض الطلب."
      });
    }

    request.status = "rejected";
    request.admin_review_notes = admin_review_notes;
    await request.save();

    return successResponse(res, request, "تم رفض الطلب بنجاح");
    
  } catch (error) {
    console.error("Error rejecting request:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء رفض الطلب",
      error: error.message
    });
  }
};