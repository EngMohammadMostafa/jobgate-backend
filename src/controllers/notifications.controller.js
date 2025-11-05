const Notification = require("../models/notification.model");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const sendEmail = require("../utils/sendEmail");

//   عرض جميع الإشعارات
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    return successResponse(res, "تم جلب جميع الإشعارات بنجاح", notifications);
  } catch (error) {
    return errorResponse(res, "حدث خطأ أثناء جلب الإشعارات", error);
  }
};

//   عرض إشعار معين حسب ID
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification)
      return errorResponse(res, "الإشعار المطلوب غير موجود", null, 404);

    return successResponse(res, "تم جلب الإشعار بنجاح", notification);
  } catch (error) {
    return errorResponse(res, "حدث خطأ أثناء جلب الإشعار", error);
  }
};

//   إنشاء إشعار جديد (من الأدمن فقط)
exports.createNotification = async (req, res) => {
  try {
    const { title, message, receiver_id, receiver_email } = req.body;

    // إنشاء الإشعار في قاعدة البيانات
    const notification = await Notification.create({
      title,
      message,
      receiver_id,
    });

    // إرسال بريد إلكتروني للمستلم
    if (receiver_email) {
      await sendEmail(
        receiver_email,
        `📩 ${title}`,
        `لقد تلقيت إشعارًا جديدًا:\n\n${message}`
      );
    }

    return successResponse(
      res,
      "تم إنشاء الإشعار وإرسال البريد بنجاح",
      notification,
      201
    );
  } catch (error) {
    return errorResponse(res, "حدث خطأ أثناء إنشاء الإشعار", error);
  }
};

//   تحديث إشعار
exports.updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification)
      return errorResponse(res, "الإشعار غير موجود", null, 404);

    const { title, message, receiver_id, is_read } = req.body;
    await notification.update({ title, message, receiver_id, is_read });

    return successResponse(res, "تم تحديث الإشعار بنجاح", notification);
  } catch (error) {
    return errorResponse(res, "حدث خطأ أثناء تحديث الإشعار", error);
  }
};

//   حذف إشعار
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification)
      return errorResponse(res, "الإشعار غير موجود", null, 404);

    await notification.destroy();
    return successResponse(res, "تم حذف الإشعار بنجاح");
  } catch (error) {
    return errorResponse(res, "حدث خطأ أثناء حذف الإشعار", error);
  }
};
