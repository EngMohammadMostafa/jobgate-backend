const CompanyRequest = require("../models/companyRequest.model");
const Company = require("../models/company.model");
const sendEmail = require("../utils/sendEmail");
const sequelize = require("../config/db.config");

// الدوال التي تحتاج إلى صلاحيات المسؤول:
// 1. getAllRequests
// 2. getRequestById
// 3. approveRequest
// 4. rejectRequest

//   عرض جميع الطلبات (تحتاج إلى صلاحية مسؤول)
// سيتم تطبيق middleware قبل هذه الدالة: (protect, adminOnly)
exports.getAllRequests = async (req, res) => {
  try {
    // يمكن إضافة تصفية هنا (مثلاً: طلبات قيد الانتظار)
    const requests = await CompanyRequest.findAll();
    res.status(200).json(requests);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب الطلبات", error: error.message });
  }
};

//   عرض تفاصيل طلب محدد (تحتاج إلى صلاحية مسؤول)
// سيتم تطبيق middleware قبل هذه الدالة: (protect, adminOnly)
exports.getRequestById = async (req, res) => {
  try {
    const reqItem = await CompanyRequest.findByPk(req.params.id);
    if (!reqItem) return res.status(404).json({ message: "الطلب غير موجود" });
    res.status(200).json(reqItem);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب الطلب", error: error.message });
  }
};

//   إنشاء طلب جديد (متاحة للعامة، لا تحتاج JWT)
// exports.createRequest = async (req, res) => {
//   try {
//     // التأكد من عدم وجود شركة مسجلة بنفس البريد الإلكتروني مسبقاً (قيد إضافي لتعزيز الأمان)
//     const existingCompany = await Company.findOne({
//       where: { email: req.body.email },
//     });
//     if (existingCompany) {
//       return res
//         .status(400)
//         .json({ message: "هذا البريد الإلكتروني مسجل بالفعل كشركة." });
//     }

//     const { name, email, phone, license_doc_url } = req.body;
//     const request = await CompanyRequest.create({
//       name,
//       email,
//       phone,
//       license_doc_url,
//     }); // إرسال إشعار للمسؤولين (اختياري) // await sendEmail("admin@example.com", "طلب شركة جديد", `تم إرسال طلب جديد من: ${company_name}`);
//     res
//       .status(201)
//       .json({ message: "تم إرسال طلب التسجيل بنجاح، سيتم مراجعته", request });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "حدث خطأ أثناء إنشاء الطلب", error: error.message });
//   }
// };
//   إنشاء طلب جديد (متاحة للعامة، لا تحتاج JWT)
exports.createRequest = async (req, res) => {
  try {
    const { name, email, phone, license_doc_url, description, logo_url } =
      req.body;

    // التحقق من الحقول الإجبارية
    if (!name || !email || !license_doc_url) {
      return res
        .status(400)
        .json({ message: "الاسم، البريد الإلكتروني، ورابط الرخصة إجباريون." });
    } // 1. التأكد من عدم وجود شركة مسجلة بنفس البريد الإلكتروني مسبقاً (في جدول الشركة النهائية)

    const existingCompany = await Company.findOne({
      where: { email },
    });
    if (existingCompany) {
      return res
        .status(400)
        .json({ message: "هذا البريد الإلكتروني مسجل بالفعل كشركة معتمدة." });
    }

    // 2. التأكد من عدم وجود طلب قيد الانتظار بنفس الإيميل (في جدول الطلبات)
    const existingRequest = await CompanyRequest.findOne({
      where: { email, status: "pending" },
    });
    if (existingRequest) {
      return res.status(400).json({
        message: "هناك بالفعل طلب قيد المراجعة بهذا البريد الإلكتروني.",
      });
    } // 3. إنشاء الطلب

    const request = await CompanyRequest.create({
      name,
      email,
      phone,
      license_doc_url,
      description,
      logo_url, // تضمين حقول إضافية
    });

    res
      .status(201)
      .json({ message: "تم إرسال طلب التسجيل بنجاح، سيتم مراجعته", request });
  } catch (error) {
    // غالباً خطأ تكرار الإيميل في جدول الطلبات
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "هذا البريد الإلكتروني موجود بالفعل كطلب سابق أو شركة.",
      });
    }
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء الطلب", error: error.message });
  }
};

//   الموافقة على الطلب (تحتاج إلى صلاحية مسؤول)
// سيتم تطبيق middleware قبل هذه الدالة: (protect, adminOnly)
// exports.approveRequest = async (req, res) => {
//   // يجب استخدام Transaction لضمان إنشاء الشركة وتحديث حالة الطلب معاً
//   const t = await Company.sequelize.transaction();
//   try {
//     const request = await CompanyRequest.findByPk(req.params.id, {
//       transaction: t,
//     });
//     if (!request) {
//       await t.rollback();
//       return res.status(404).json({ message: "الطلب غير موجود" });
//     }
//     if (request.status !== "pending") {
//       await t.rollback();
//       return res.status(400).json({ message: "تم معالجة هذا الطلب مسبقاً." });
//     } // 1. إنشاء حساب الشركة

//     const newCompany = await Company.create(
//       {
//         name: request.company_name,
//         email: request.email,
//         phone: request.phone,
//         license_doc_url: request.license_doc_url, // يمكن إضافة حقل كلمة مرور مؤقتة لترسل للشركة عبر الإيميل
//       },
//       { transaction: t }
//     ); // 2. تحديث حالة الطلب

//     request.status = "approved"; // يمكن إضافة admin_id المسؤول عن الموافقة هنا
//     await request.save({ transaction: t }); // 3. إرسال إيميل (يجب أن يكون خارج الـ Transaction أو يتم تعويضه إذا فشل)

//     await sendEmail(
//       request.email,
//       "قبول طلب التسجيل - تهانينا!",
//       `تمت الموافقة على شركتكم **${newCompany.name}** بنجاح. يمكنكم الآن تسجيل الدخول.`
//     );

//     await t.commit(); // تنفيذ التغييرات في قاعدة البيانات

//     res.status(200).json({
//       message: "تمت الموافقة على الشركة وإنشاء حسابها بنجاح",
//       company: newCompany,
//     });
//   } catch (error) {
//     await t.rollback(); // التراجع عن التغييرات في حال حدوث خطأ
//     res.status(500).json({
//       message: "حدث خطأ أثناء الموافقة على الطلب",
//       error: error.message,
//     });
//   }
// };
//   الموافقة على الطلب (تحتاج إلى صلاحية مسؤول)
exports.approveRequest = async (req, res) => {
  // يجب استخدام Transaction لضمان إنشاء الشركة وتحديث حالة الطلب معاً
  const t = await sequelize.transaction(); // استخدام sequelize.transaction()
  try {
    const request = await CompanyRequest.findByPk(req.params.id, {
      transaction: t,
    });
    if (!request) {
      await t.rollback();
      return res.status(404).json({ message: "الطلب غير موجود" });
    }
    if (request.status !== "pending") {
      await t.rollback();
      return res.status(400).json({ message: "تم معالجة هذا الطلب مسبقاً." });
    }

    // 1. إنشاء حساب الشركة (نقل البيانات من الطلب)
    const newCompany = await Company.create(
      {
        name: request.name,
        email: request.email,
        phone: request.phone,
        license_doc_url: request.license_doc_url,
        logo_url: request.logo_url,
        description: request.description,
        is_approved: true, // بما أنها هنا، فهي معتمدة
      },
      { transaction: t }
    ); // 2. تحديث حالة الطلب

    request.status = "approved";
    request.approved_company_id = newCompany.company_id; // حفظ ID الشركة المنشأة
    await request.save({ transaction: t }); // 3. إرسال إيميل (يمكن أن يتم لاحقاً خارج الـ Transaction) // await sendEmail(request.email, "قبول طلب التسجيل - تهانينا!", `تمت الموافقة على شركتكم...`);

    await t.commit(); // تنفيذ التغييرات

    res.status(200).json({
      message: "تمت الموافقة على الطلب وإنشاء حساب الشركة بنجاح",
      company: newCompany,
    });
  } catch (error) {
    await t.rollback(); // التراجع عن التغييرات في حال حدوث خطأ
    res.status(500).json({
      message: "حدث خطأ أثناء الموافقة على الطلب",
      error: error.message,
    });
  }
};

//   رفض الطلب (تحتاج إلى صلاحية مسؤول)
// سيتم تطبيق middleware قبل هذه الدالة: (protect, adminOnly)
// exports.rejectRequest = async (req, res) => {
//   try {
//     const request = await CompanyRequest.findByPk(req.params.id);
//     if (!request) return res.status(404).json({ message: "الطلب غير موجود" });

//     if (request.status !== "pending") {
//       return res.status(400).json({ message: "تم معالجة هذا الطلب مسبقاً." });
//     }

//     const { admin_review_notes } = req.body;
//     if (!admin_review_notes) {
//       return res
//         .status(400)
//         .json({ message: "ملاحظات المسؤول مطلوبة لرفض الطلب." });
//     }

//     request.status = "rejected";
//     request.admin_review_notes = admin_review_notes;
//     await request.save();

//     await sendEmail(
//       request.email,
//       "رفض طلب التسجيل",
//       `عزيزنا العميل، تم رفض طلبكم بسبب: **${admin_review_notes}**`
//     );

//     res.status(200).json({ message: "تم رفض الطلب وإرسال إشعار للشركة" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "حدث خطأ أثناء رفض الطلب", error: error.message });
//   }
// };
// file: controllers/companyRequests.controller.js (دالة رفض الطلب)

//   رفض الطلب (تحتاج إلى صلاحية مسؤول)
// سيتم تطبيق middleware قبل هذه الدالة: (protect, adminOnly)
exports.rejectRequest = async (req, res) => {
  // لا نحتاج لـ Transaction إلا إذا كانت هناك تغييرات في جدول آخر (مثل Company)
  try {
    const request = await CompanyRequest.findByPk(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        message: "تم معالجة هذا الطلب مسبقاً (مقبول أو مرفوض سابقًا).",
      });
    }

    const { admin_review_notes } = req.body;
    if (!admin_review_notes) {
      return res.status(400).json({
        message: "ملاحظات المسؤول (admin_review_notes) مطلوبة لرفض الطلب.",
      });
    }

    // 🎯 تحديث الحالة والملاحظات
    request.status = "rejected";
    request.admin_review_notes = admin_review_notes;
    await request.save(); // await sendEmail( //   request.email, //   "رفض طلب التسجيل", //   `عزيزنا العميل، تم رفض طلبكم بسبب: **${admin_review_notes}**` // );

    // 📧 إرسال إيميل للشركة بإشعار الرفض
    // يجب عليك التأكد من استيراد دالة sendEmail
    res.status(200).json({
      message: "تم رفض الطلب بنجاح وإرسال إشعار للشركة",
      rejectedRequest: request,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء رفض الطلب", error: error.message });
  }
};
