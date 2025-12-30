// file: src/controllers/user.controller.js (الملف المُدمج والنهائي)

const {
  User,
  Company,
  JobPosting,
  Application,
  CV,
  sequelize,
  Admin,
} = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { successResponse } = require("../utils/responseHandler"); // نفترض وجودها

// افترض أن ملف الإعدادات يحوي JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || "your_secure_default_key";

//   دوال المصادقة (Authentication Functions)

/**
 * @desc [Public] تسجيل الدخول للمستخدم (Admin, Seeker)
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(404)
        .json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    }

    // التحقق من كلمة المرور
    const isMatch = await bcrypt.compare(password, user.hashed_password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة." });
    }

    // إنشاء JWT
    const token = jwt.sign(
      { user_id: user.user_id, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const responseUser = user.toJSON();
    delete responseUser.hashed_password;

    return successResponse(
      res,
      { token, user: responseUser },
      "تم تسجيل الدخول بنجاح."
    );
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "حدث خطأ أثناء تسجيل الدخول.", error: error.message });
  }
};

/**
 * @desc [Public] إنشاء حساب مستخدم باحث عن عمل جديد
 * @route POST /api/auth/register-jobseeker
 * @access Public
 */
exports.registerJobSeeker = async (req, res) => {
  const { full_name, email, password, phone, user_type } = req.body;

  // بدء عملية (Transaction) لضمان حفظ البيانات في الجدولين معاً
  const t = await sequelize.transaction();

  try {
    // 1. التحقق من وجود المستخدم مسبقاً
    let existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await t.rollback();
      return res.status(400).json({ message: "المستخدم مسجل مسبقاً." });
    }

    // 2. تشفير كلمة المرور
    const hashed_password = await bcrypt.hash(password, 10);

    // 3. إنشاء السجل في جدول المستخدمين العام (User)
    const user = await User.create(
      {
        full_name,
        email,
        hashed_password,
        phone,
        user_type: user_type === "admin" ? "admin" : "seeker",
        profile_completed: false,
      },
      { transaction: t }
    );

    // 4. إذا كان النوع "admin"، نقوم بإضافته في جدول الأدمن أيضاً
    if (user_type === "admin") {
      // نفترض أن اسم الموديل هو Admin وأن العلاقة هي user_id
      await Admin.create(
        {
          user_id: user.user_id,
          full_name,
          email,
          hashed_password,
          phone, // ربط السجل بالمستخدم الذي أنشئ للتو
          // أضف أي حقول إضافية خاصة بالأدمن هنا
        },
        { transaction: t }
      );
    }

    // تأكيد العملية وحفظ البيانات نهائياً
    await t.commit();

    // 5. إنشاء JWT
    const token = jwt.sign(
      { user_id: user.user_id, user_type: user.user_type },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const responseUser = user.toJSON();
    delete responseUser.hashed_password;

    return successResponse(
      res,
      { token, user: responseUser },
      "تم تسجيل الحساب بنجاح وإضافة البيانات في الجداول المختصة.",
      201
    );
  } catch (error) {
    // تراجع عن أي تغيير في حال حدوث خطأ
    await t.rollback();
    console.error("Registration error:", error);
    return res.status(500).json({
      message: "حدث خطأ أثناء عملية التسجيل.",
      error: error.message,
    });
  }
};

//   دوال الوصول العام (Public Access Functions)

/**
 * @desc [Public] عرض قائمة بالشركات المعتمدة
 * @route GET /api/companies
 * @access Public
 */
exports.listCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      attributes: ["company_id", "name", "logo_url", "description"],
      where: { is_approved: true }, // عرض الموافق عليها فقط
    });
    return successResponse(res, companies);
  } catch (error) {
    console.error("Error listing companies:", error);
    return res.status(500).json({ message: "فشل في جلب قائمة الشركات." });
  }
};

/**
 * @desc [Public] عرض جميع إعلانات الوظائف المنشورة والنشطة
 * @route GET /api/jobs
 * @access Public
 */
exports.listJobPostings = async (req, res) => {
  try {
    const jobPostings = await JobPosting.findAll({
      // نستخدم 'published' لتوحيد الحالة مع النموذج الثاني
      where: { status: "published" },
      attributes: [
        "job_id",
        "title",
        "location",
        "salary", // من النموذج الأول
        "salary_min", // من النموذج الثاني
        "salary_max", // من النموذج الثاني
        "form_type",
        "created_at",
      ],
      include: [
        {
          model: Company,
          attributes: ["company_id", "name", "logo_url"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return successResponse(res, jobPostings);
  } catch (error) {
    console.error("Error listing job postings:", error);
    return res
      .status(500)
      .json({ message: "فشل في جلب إعلانات الوظائف.", error: error.message });
  }
};

/**
 * @desc [Public] عرض تفاصيل وظيفة محددة
 * @route GET /api/jobs/:id
 * @access Public
 */
exports.getJobPostingDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const jobPosting = await JobPosting.findByPk(id, {
      where: {
        status: "published", // نستخدم "published"
      },
      include: [
        {
          model: Company,
          attributes: [
            "company_id",
            "name",
            "logo_url",
            "description",
            "email",
          ],
        },
        // [تضمين هيكل JobForm هنا إذا لزم الأمر، كما كان في النسخة الثانية]
      ],
    });

    if (!jobPosting) {
      return res
        .status(404)
        .json({ message: "الوظيفة غير موجودة أو غير متاحة حالياً." });
    }

    return successResponse(res, jobPosting);
  } catch (error) {
    console.error("Error getting job posting details:", error);
    return res
      .status(500)
      .json({ message: "فشل في جلب تفاصيل الوظيفة.", error: error.message });
  }
};

//   دوال الباحث عن عمل (Authenticated Job Seeker)

/**
 * @desc [Private] تقديم طلب وظيفة جديد (يدعم cv_id أو ملف مرفوع)
 * @route POST /api/user/applications
 * @access Private (يتطلب authJwt و middleware الرفع)
 */
exports.submitApplication = async (req, res) => {
  // دمج الحقول من كلا النموذجين
  const { job_id, cv_id, cover_letter, form_data } = req.body;
  const { user_id } = req.user;
  const uploadedFile = req.file;

  const t = await sequelize.transaction();
  try {
    // 1. التحقق من الوظيفة والتقديم المسبق
    const job = await JobPosting.findByPk(job_id, { transaction: t });
    if (!job || job.status !== "published") {
      await t.rollback();
      return res.status(404).json({ message: "الوظيفة غير موجودة أو مغلقة." });
    }

    const existingApplication = await Application.findOne({
      where: { user_id, job_id },
      transaction: t,
    });
    if (existingApplication) {
      await t.rollback();
      return res.status(400).json({ message: "لقد قدمت بالفعل لهذه الوظيفة." });
    }

    let finalCvId = cv_id;

    // 2. معالجة السيرة الذاتية (ملف مرفوع جديد أو cv_id مسجل)
    if (uploadedFile) {
      // رفع ملف جديد => إنشاء سجل CV
      const newCV = await CV.create(
        {
          user_id,
          file_url: uploadedFile.path,
          file_type: uploadedFile.mimetype,
          title: `مرفق لطلب وظيفة ${job_id} بتاريخ ${new Date()
            .toISOString()
            .slice(0, 10)}`,
        },
        { transaction: t }
      );
      finalCvId = newCV.cv_id;
    } else if (finalCvId) {
      // تحديد CV مُسجل => التحقق من ملكيته
      const userCv = await CV.findOne({
        where: { cv_id: finalCvId, user_id },
        transaction: t,
      });
      if (!userCv) {
        await t.rollback();
        return res.status(403).json({
          message: "السيرة الذاتية المحددة غير صالحة أو لا تخص المستخدم.",
        });
      }
    } else {
      // لا ملف ولا CV محدد
      await t.rollback();
      return res
        .status(400)
        .json({ message: "يجب إرفاق ملف CV أو تحديد CV مسجل." });
    }

    // 3. إنشاء طلب التقديم
    const application = await Application.create(
      {
        user_id,
        job_id,
        cv_id: finalCvId,
        cover_letter: cover_letter || null,
        form_data: form_data ? JSON.parse(form_data) : null, // دعم بيانات النموذج من النسخة الثانية
        status: "pending",
      },
      { transaction: t }
    );

    await t.commit();

    return successResponse(
      res,
      { application_id: application.application_id },
      "تم إرسال طلب التوظيف بنجاح.",
      201
    );
  } catch (error) {
    await t.rollback();
    // (يجب أن يتم التعامل مع حذف الملف المرفوع إذا فشلت العملية في middleware أو خدمة خارجية)

    console.error("Error submitting application:", error);
    return res
      .status(500)
      .json({ message: "فشل في إرسال الطلب.", error: error.message });
  }
};

/**
 * @desc [Private] عرض جميع طلبات التوظيف التي قدمها المستخدم الحالي
 * @route GET /api/user/applications
 * @access Private (يتطلب authJwt)
 */
exports.listUserApplications = async (req, res) => {
  const { user_id } = req.user;

  try {
    const applications = await Application.findAll({
      where: { user_id },
      attributes: [
        "application_id",
        "status",
        "submitted_at",
        "review_notes",
        "cover_letter", // أضفنا cover_letter
      ],
      include: [
        {
          model: JobPosting,
          attributes: ["job_id", "title", "status", "location"],
          include: [{ model: Company, attributes: ["name"] }],
        },
        {
          model: CV,
          attributes: ["cv_id", "title", "file_url"], // أضفنا file_url
        },
      ],
      order: [["submitted_at", "DESC"]],
    });

    return successResponse(res, applications);
  } catch (error) {
    console.error("Error listing user applications:", error);
    return res
      .status(500)
      .json({ message: "فشل في جلب طلبات التوظيف.", error: error.message });
  }
};
