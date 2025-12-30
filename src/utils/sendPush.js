const admin = require("../config/firebase.config");
const { User } = require("../models"); // لافتراض استرجاع الرمز من DB

const sendPush = async (user_id, title, message) => {
  try {
    // 1. استرجاع رمز الجهاز (Registration Token)
    const user = await User.findByPk(user_id, {
      attributes: ["fcm_token"], // يجب أن يكون لديك حقل fcm_token في جدول المستخدمين
    });

    if (!user || !user.fcm_token) {
      console.warn(
        `[FCM] فشل: لم يتم العثور على رمز FCM للمستخدم ID: ${user_id}`
      );
      return false;
    }

    const registrationToken = user.fcm_token;

    // 2. إعداد حمولة الرسالة
    const payload = {
      notification: {
        title: title,
        body: message,
      },
      data: {
        // بيانات مخصصة يتم التعامل معها في تطبيق الهاتف
        type: "GENERAL_NOTIFICATION",
        user_id: String(user_id),
      },
    };

    // 3. إرسال الرسالة
    const response = await admin
      .messaging()
      .sendToDevice(registrationToken, payload);

    if (response.failureCount > 0) {
      // معالجة الأخطاء (مثل الرمز غير الصالح)
      console.error(
        `[FCM] فشل الإرسال إلى ${user_id}. الأخطاء:`,
        response.results[0].error
      );
      return false;
    }

    console.log(`[FCM] تم الإرسال بنجاح إلى المستخدم ID: ${user_id}.`);
    return true;
  } catch (error) {
    console.error(`[FCM ERROR] فشل في إرسال الإشعار لـ ${user_id}:`, error);
    return false;
  }
};

module.exports = sendPush;
