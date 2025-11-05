// file: controllers/user.controller.js

const User = require("../models/user.model");
const Admin = require("../models/admin.model"); // استيراد نموذج Admin
const sequelize = require("../config/db.config");
const bcrypt = require("bcryptjs"); // مكتبة التشفير

// ----------------------------------------------------
// 🔍 دوال العرض (Reading Functions)
// ----------------------------------------------------

/**
 * @desc جلب جميع المستخدمين
 * @route GET /api/users
 * @access Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["hashed_password"] },
    });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب المستخدمين", error: error.message });
  }
};

/**
 * @desc جلب تفاصيل مستخدم معين
 * @route GET /api/users/:id
 * @access Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["hashed_password"] },
    });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء جلب المستخدم", error: error.message });
  }
};

// ----------------------------------------------------
// ✨ دالة الإنشاء (Create Function)
// ----------------------------------------------------

/**
 * @desc إنشاء مستخدم جديد (بما في ذلك Admin)
 * @route POST /api/users
 * @access Admin
 */
exports.createUser = async (req, res) => {
  const t = await sequelize.transaction(); // بدء المعاملة

  try {
    const { full_name, email, password, phone, user_type } = req.body; // التحقق من وجود المستخدم مسبقاً

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await t.rollback();
      return res
        .status(400)
        .json({ message: "البريد الإلكتروني مستخدم مسبقًا" });
    } // 1. تشفير كلمة المرور

    const hashed_password = await bcrypt.hash(password, 10); // 2. إنشاء سجل المستخدم الأساسي في جدول User
    const newUser = await User.create(
      {
        full_name,
        email,
        hashed_password,
        phone,
        user_type: user_type || "seeker",
      },
      { transaction: t }
    ); // 3. التحقق من النوع وإضافة سجل لجدول Admin

    if (newUser.user_type === "admin") {
      // إنشاء سجل في جدول Admin، باستخدام full_name كـ username
      await Admin.create(
        {
          full_name: newUser.full_name, // 👈 استخدام full_name كاسم مستخدم
          email: newUser.email,
          hashed_password: newUser.hashed_password,
        },
        { transaction: t }
      );
    } // 4. تنفيذ المعاملة

    await t.commit();

    const successMessage =
      newUser.user_type === "admin"
        ? "تم إنشاء المستخدم كمسؤول (Admin) بنجاح"
        : "تم إنشاء المستخدم بنجاح"; // حذف كلمة المرور المشفرة من الرد قبل إرساله
    const responseUser = newUser.toJSON();
    delete responseUser.hashed_password;
    res.status(201).json({ message: successMessage, newUser: responseUser });
  } catch (error) {
    await t.rollback(); // التراجع عن التغييرات
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message:
          "البريد الإلكتروني أو الاسم الكامل (المستخدم كاسم مستخدم للمسؤول) مُسجل بالفعل في أحد الجداول.",
      });
    }
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء إنشاء المستخدم", error: error.message });
  }
};

// ----------------------------------------------------
// ✏️ دالة التعديل (Update Function)
// ----------------------------------------------------

/**
 * @desc تعديل بيانات مستخدم (بما في ذلك تغيير الدور)
 * @route PUT /api/users/:id
 * @access Admin
 */
exports.updateUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "المستخدم غير موجود" });
    }

    const { full_name, email, phone, user_type, is_active } = req.body;
    const oldUserType = user.user_type; // 1. تحديث جدول User
    await user.update(
      { full_name, email, phone, user_type, is_active },
      { transaction: t }
    ); // 2. معالجة التغيير في دور المستخدم

    if (user_type && user_type !== oldUserType) {
      if (user_type === "admin") {
        // الترقية إلى مسؤول: إنشاء سجل في جدول Admin
        await Admin.create(
          {
            full_name: user.full_name, // استخدام الاسم الكامل المحدث
            email: user.email,
            hashed_password: user.hashed_password,
          },
          { transaction: t }
        );
      } else if (oldUserType === "admin") {
        // الرجوع من مسؤول: حذف السجل من جدول Admin
        await Admin.destroy(
          { where: { email: user.email } },
          { transaction: t }
        );
      }
    }

    // 3. معالجة تحديث الاسم الكامل للمسؤول
    // إذا كان المستخدم حالياً مسؤولاً وتم تحديث اسمه
    if (user.user_type === "admin" && full_name) {
      await Admin.update(
        { username: full_name },
        { where: { email: user.email }, transaction: t }
      );
    }

    await t.commit();

    // حذف كلمة المرور المشفرة من الرد قبل إرساله
    const responseUser = user.toJSON();
    delete responseUser.hashed_password;

    res
      .status(200)
      .json({ message: "تم تحديث بيانات المستخدم بنجاح", user: responseUser });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء تحديث المستخدم", error: error.message });
  }
};

// ----------------------------------------------------
// 🗑️ دالة الحذف (Delete Function)
// ----------------------------------------------------

/**
 * @desc حذف مستخدم
 * @route DELETE /api/users/:id
 * @access Admin
 */
exports.deleteUser = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: "المستخدم غير موجود" });
    } // 1. إذا كان المسؤول (Admin)، احذف السجل من جدول Admin أولاً

    if (user.user_type === "admin") {
      await Admin.destroy({ where: { email: user.email } }, { transaction: t });
    } // 2. حذف سجل المستخدم الأساسي

    await user.destroy({ transaction: t });
    await t.commit();
    res.status(200).json({ message: "تم حذف المستخدم بنجاح" });
  } catch (error) {
    await t.rollback();
    res
      .status(500)
      .json({ message: "حدث خطأ أثناء حذف المستخدم", error: error.message });
  }
};
