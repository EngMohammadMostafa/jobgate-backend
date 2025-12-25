const {
  User,
  Consultant,
  PushNotification, // تم استبدال Notification بـ PushNotification
  sequelize,
} = require("../models/index");
const { successResponse } = require("../utils/responseHandler");

const sendPushNotification = async (target_user_id, title, message) => {
  try {
    // 1. محاكاة إرسال إشعار الدفع الخارجي
    // في بيئة الإنتاج، يجب استبدال هذه السطور باستدعاء دالة إرسال حقيقية
    const isSent = true;

    // 2. تسجيل الإشعار في جدول PushNotification
    await PushNotification.create({
      user_id: target_user_id,
      title,
      message,
      is_sent: isSent,
      // يمكن إضافة sent_at إذا كان موجوداً في نموذج PushNotification
    });

    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
};

const requestConsultantUpgrade = async (req, res) => {
  const { user_id } = req.user;
  const {
    bio,
    expertise_fields,
    work_history_url,
    hourly_rate,
    clients_served,
  } = req.body;

  try {
    const user = await User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ message: "المستخدم غير موجود." });
    }
    if (user.upgrade_request_status === "Pending") {
      return res
        .status(400)
        .json({ message: "لديك طلب ترقية قيد المراجعة بالفعل." });
    }
    if (
      user.user_type === "consultant" ||
      user.upgrade_request_status === "Approved"
    ) {
      return res.status(400).json({ message: "أنت مسجل بالفعل كمستشار." });
    }

    // تحديث حالة طلب الترقية للمستخدم
    await user.update({ upgrade_request_status: "Pending" });

    // إرسال إشعار دفع للإداري للمراجعة (باستخدام الدالة الجديدة)
    await sendPushNotification(
      /* Admin User ID */ 1, // يجب استبداله بمعرف الإداري الفعلي
      "طلب ترقية جديد",
      `المستخدم ${user.full_name} (${user.email}) طلب ترقية إلى مستشار.`
    );

    return successResponse(
      res,
      { status: "Pending" },
      "تم إرسال طلب الترقية بنجاح. سيتم مراجعته من قبل الإدارة."
    );
  } catch (error) {
    console.error("Error requesting upgrade:", error);
    return res.status(500).json({ message: "فشل في إرسال طلب الترقية." });
  }
};

/**
 * @desc [Admin Only] مراجعة وقبول/رفض طلب ترقية
 * @route PUT /api/admin/upgrade/:user_id
 * @access Private (يتطلب Admin)
 */
const handleConsultantUpgrade = async (req, res) => {
  const { user_id } = req.params;
  const {
    action,
    bio,
    expertise_fields,
    work_history_url,
    hourly_rate,
    clients_served,
  } = req.body; // action: 'accept' or 'reject'

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user || user.upgrade_request_status !== "Pending") {
      await t.rollback();
      return res
        .status(404)
        .json({ message: "طلب الترقية غير موجود أو ليس قيد الانتظار." });
    }

    if (action === "accept") {
      // 1. تحديث حالة المستخدم ونوع الحساب
      await user.update(
        {
          upgrade_request_status: "Approved",
          user_type: "consultant",
        },
        { transaction: t }
      );

      // 2. إضافة سجل المستشار إلى جدول Consultants
      const consultant = await Consultant.create(
        {
          user_id,
          bio,
          expertise_fields,
          work_history_url,
          hourly_rate,
          clients_served,
        },
        { transaction: t }
      );

      // 3. إرسال إشعار دفع للمستخدم (باستخدام الدالة الجديدة)
      await sendPushNotification(
        user_id,
        "تهانينا! تمت الموافقة على ترقيتك",
        "تمت الموافقة على طلب ترقيتك وأصبحت الآن مستشاراً في المنصة."
      );

      await t.commit();
      return successResponse(
        res,
        consultant,
        "تم قبول الترقية بنجاح وتسجيل المستشار."
      );
    } else if (action === "reject") {
      // تحديث الحالة للرفض فقط
      await user.update(
        { upgrade_request_status: "Rejected" },
        { transaction: t }
      );

      // إرسال إشعار دفع للمستخدم (باستخدام الدالة الجديدة)
      await sendPushNotification(
        user_id,
        "تحديث طلب الترقية",
        "نعتذر، لم يتم قبول طلب ترقيتك إلى مستشار حالياً. يرجى مراجعة المتطلبات."
      );

      await t.commit();
      return successResponse(res, null, "تم رفض طلب الترقية.");
    } else {
      await t.rollback();
      return res.status(400).json({
        message: "الإجراء غير صالح (يجب أن يكون 'accept' أو 'reject').",
      });
    }
  } catch (error) {
    await t.rollback();
    console.error("Error handling upgrade request:", error);
    return res
      .status(500)
      .json({ message: "فشل في معالجة الطلب.", error: error.message });
  }
};

/**
 * @desc [Public/Admin/Company] عرض بروفايل المستشار
 * @route GET /api/consultants/:user_id
 * @access Public
 */
const getConsultantProfile = async (req, res) => {
  const { user_id } = req.params;

  try {
    const consultant = await Consultant.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          // عرض بيانات التواصل (الإيميل والهاتف) للجميع (حسب طلبك)
          attributes: ["user_id", "full_name", "phone", "email"],
        },
      ],
      attributes: [
        "consultant_id",
        "bio",
        "expertise_fields",
        "work_history_url",
        "hourly_rate",
        "clients_served",
      ],
    });

    if (!consultant) {
      return res
        .status(404)
        .json({ message: "المستشار غير موجود أو لم يتم تفعيله." });
    }

    // يجب أن يكون المستشار مُفعلاً (أي لديه سجل في جدول Consultants)
    return successResponse(res, consultant);
  } catch (error) {
    console.error("Error getting consultant profile:", error);
    return res.status(500).json({ message: "فشل في جلب تفاصيل المستشار." });
  }
};

/**
 * @desc [Private Seeker/Company] طلب استشارة للمستشار وإرسال إشعار
 * @route POST /api/consultants/:user_id/request-consultation
 * @access Private (يتطلب authJwt)
 */
const requestConsultation = async (req, res) => {
  const { user_id: consultant_user_id } = req.params;
  // requester_user_id يتم جلبه من middleware المصادقة (req.user)
  const { user_id: requester_user_id, full_name: requester_name } = req.user;
  const { message } = req.body;

  try {
    const consultant = await Consultant.findOne({
      where: { user_id: consultant_user_id },
    });
    const requesterUser = await User.findByPk(requester_user_id);

    if (!consultant) {
      return res
        .status(404)
        .json({ message: "المستشار غير موجود أو غير مُفعّل." });
    }

    // 1. إرسال الإشعار للمستشار (باستخدام الدالة الجديدة)
    const notificationTitle = `طلب استشارة جديد من ${requesterUser.full_name}`;
    const notificationMessage = `يرجى مراجعة الإيميل (${requesterUser.email}) أو الهاتف (${requesterUser.phone}) الخاص بالباحث لطلب استشارة. الرسالة: "${message}"`;

    await sendPushNotification(
      consultant.user_id,
      notificationTitle,
      notificationMessage
    );

    // 2. إرجاع بيانات التواصل مع المستشار للطالب
    const consultantUser = await User.findByPk(consultant_user_id, {
      attributes: ["email", "phone", "full_name"],
    });

    return successResponse(
      res,
      {
        consultant_info: {
          full_name: consultantUser.full_name,
          email: consultantUser.email,
          phone: consultantUser.phone,
        },
      },
      "تم إرسال الإشعار للمستشار بنجاح. إليك بيانات التواصل معه لبدء المحادثة."
    );
  } catch (error) {
    console.error("Error requesting consultation:", error);
    return res.status(500).json({ message: "فشل في إرسال طلب الاستشارة." });
  }
};

module.exports = {
  sendPushNotification,
  requestConsultation,
  getConsultantProfile,
  handleConsultantUpgrade,
  requestConsultantUpgrade,
};
