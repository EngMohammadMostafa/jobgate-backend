// file: src/config/firebase.config.js

const admin = require("firebase-admin");
const path = require("path");

// استخدم المسار المطلق للملف لضمان العثور عليه
const serviceAccountPath = path.join(__dirname, "firebase-admin.json");
const serviceAccount = require(serviceAccountPath);

// تهيئة Firebase Admin SDK إذا لم يتم تهيئته بعد
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
