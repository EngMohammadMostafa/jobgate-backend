// file: src/controllers/email.controller.js

// افتراض نماذج قاعدة البيانات والدوال المساعدة
const { EmailNotification, Company } = require("../models"); // EmailNotification تم توحيده ليكون سجل الإيميلات الرئيسي
const sendEmailUtil = require("../utils/sendEmail"); // دالة مساعدة لإرسال الإيميل الخارجي
const { successResponse } = require("../utils/responseHandler");

//  دوال إدارة البريد الإلكتروني (Admin Email Management)

/**
 * @desc [Admin Only] إرسال بريد إلكتروني مخصص وتسجيله
 * يُستخدم للإرسالات العامة غير المرتبطة بشركة محددة.
 * @route POST /api/admin/email/send/custom
 * @access Admin
 */
exports.sendCustomEmail = async (req, res) => {
  const { recipient, subject, body } = req.body;
  const adminId = req.user.user_id; // افتراض وجود ID المسؤول من JWT

  if (!recipient || !subject || !body) {
    return res
      .status(400)
      .json({ message: "المستلم، الموضوع، والنص إجباريون." });
  }

  let isSent = false;
  let sent_at = null;
  let status = "failed";
  let error_message = null;

  // 1. محاولة الإرسال الخارجي
  try {
    await sendEmailUtil(recipient, subject, body);
    isSent = true;
    sent_at = new Date();
    status = "sent";
  } catch (err) {
    console.error("External email send failed:", err);
    error_message = err.message;
  }

  // 2. تسجيل العملية في قاعدة البيانات باستخدام EmailNotification
  try {
    const emailRecord = await EmailNotification.create({
      sender_id: adminId, // من المسؤول الذي أرسله
      recipient_email: recipient,
      subject,
      body,
      status, // 'sent' أو 'failed'
      sent_at,
      error_message, // تسجيل رسالة الخطأ إذا فشل
    });

    const statusMessage = isSent
      ? "تم الإرسال والتسجيل بنجاح."
      : "فشل الإرسال الخارجي، تم التسجيل داخلياً بحالة 'failed'.";

    return successResponse(
      res,
      {
        email_id: emailRecord.id, // استخدام id النموذج الموحد
        is_sent: isSent,
      },
      statusMessage
    );
  } catch (error) {
    console.error("Error creating email log:", error);
    return res.status(500).json({
      message: "فشل في عملية إرسال أو تسجيل البريد الإلكتروني.",
      error: error.message,
    });
  }
};

 //   إرسال إيميل لشركة
 
/**
 * @desc [Admin Only] يرسل بريداً إلكترونياً إلى شركة محددة أو إيميل عام.
 * @route POST /api/admin/email/send/company
 * @access Private (يتطلب Admin)
 */
exports.sendEmailToCompany = async (req, res) => {
  const { target_company_id, recipient_email, subject, body } = req.body;
  const adminId = req.user.user_id; // افتراض وجود ID المسؤول

  let company = null;
  let finalRecipient = recipient_email;
  let error_message = null;
  let status = "pending_failure"; // حالة أولية في حال الفشل قبل الوصول لشركة

  try {
    if (target_company_id) {
      company = await Company.findByPk(target_company_id);
      if (!company) {
        status = "failed_company_not_found";
        throw new Error("الشركة المستهدفة غير موجودة.");
      }
      // إذا كان الإيميل غير محدد، استخدم إيميل الشركة
      finalRecipient = recipient_email || company.email;
    }

    if (!finalRecipient) {
      status = "failed_no_recipient";
      throw new Error("يجب تحديد بريد إلكتروني مستقبِل.");
    }

    // 1. محاولة الإرسال الخارجي
    await sendEmailUtil(finalRecipient, subject, body); // دالة الإرسال الفعلية
    status = "sent";

    // 2. تسجيل العملية (النجاح)
    const newEmail = await EmailNotification.create({
      sender_id: adminId,
      company_id: target_company_id || null,
      recipient_email: finalRecipient,
      subject,
      body,
      status: "sent",
      sent_at: new Date(),
    });

    return successResponse(
      res,
      { email_id: newEmail.id },
      `تم إرسال البريد الإلكتروني إلى ${finalRecipient} بنجاح.`
    );
  } catch (error) {
    console.error("فشل في إرسال البريد الإلكتروني:", error);
    error_message = error.message;

    //   تسجيل الفشل
    // يتم إنشاء سجل هنا حتى في حالة فشل التحقق الأولي (مثل عدم وجود Recipient أو Company)
    EmailNotification.create({
      sender_id: adminId,
      company_id: target_company_id || null,
      recipient_email: finalRecipient || "UNKNOWN",
      subject,
      body,
      status: status === "sent" ? "failed" : status, // قد يكون failed من sendEmailUtil أو status من الفشل الأولي
      error_message: error_message,
    }).catch((logError) =>
      console.error("فشل في تسجيل إخفاق الإيميل:", logError)
    );

    return res.status(500).json({
      message: "فشل في عملية إرسال البريد الإلكتروني.",
      error: error.message,
    });
  }
};

 //   عرض السجلات
 
/**
 * @desc [Admin Only] عرض سجلات رسائل البريد الإلكتروني المرسلة (الموحدة).
 * @route GET /api/admin/email/logs
 * @access Private (يتطلب Admin)
 */
exports.listSentEmails = async (req, res) => {
  try {
    const emails = await EmailNotification.findAll({
      order: [["created_at", "DESC"]],
      limit: 50,
      // تضمين معلومات الشركة (إذا كانت موجودة)
      include: Company ? [{ model: Company, attributes: ["name"] }] : [],
    });
    return successResponse(res, emails);
  } catch (error) {
    console.error("فشل في جلب سجلات الإيميلات:", error);
    return res.status(500).json({ message: "فشل في جلب السجلات." });
  }
};
