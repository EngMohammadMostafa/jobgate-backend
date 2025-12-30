// file: src/controllers/ai.controller.js
const aiService = require('../services/aiService');
const { CV, CVStructuredData, CVFeaturesAnalytics } = require('../models');
const { successResponse } = require('../utils/responseHandler');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc تحليل CV نصي باستخدام AI (مع Normalization وRequest ID)
 * @route POST /api/ai/cv/analyze-text
 * @access Private
 */
exports.analyzeCVText = async (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Start CV Analysis`);
  try {
    const { cvText, useAI = false, saveToDb = true } = req.body;
    const userId = req.user.user_id;

    if (!cvText) {
      return res.status(400).json({ message: 'نص CV مطلوب', requestId });
    }

    const analysisResult = await aiService.analyzeCVText(userId, cvText, useAI);

    // Normalization: التأكد أن البيانات دائما بشكل موحد
    const structuredData = analysisResult.structured_data || {};
    const features = analysisResult.features || {};
    const ats_score = analysisResult.ats_score ?? analysisResult.score ?? 0;

    if (saveToDb) {
      const cvRecord = await CV.create({
        user_id: userId,
        title: `AI Analyzed CV - ${new Date().toISOString().slice(0, 10)}`,
        file_type: 'text',
        file_url: null,
      });

      await CVStructuredData.create({
        cv_id: cvRecord.cv_id,
        data_json: structuredData,
      });

      await CVFeaturesAnalytics.create({
        cv_id: cvRecord.cv_id,
        ats_score,
        total_years_experience: features.total_years_experience || 0,
        key_skills: features.key_skills || [],
        achievement_count: features.achievement_count || 0,
        has_contact_info: features.has_contact_info || false,
        has_education: features.has_education || false,
        has_experience: features.has_experience || false,
        is_ats_compliant: ats_score >= 70,
      });

      console.log(`[${requestId}] CV Analysis completed and saved for user ${userId}`);

      return successResponse(res, {
        cv_id: cvRecord.cv_id,
        structured_data: structuredData,
        features,
        ats_score,
        saved_to_db: true,
        requestId,
      }, 'تم تحليل CV بنجاح وحفظه في قاعدة البيانات');
    }

    console.log(`[${requestId}] CV Analysis completed (not saved) for user ${userId}`);
    return successResponse(res, {
      structured_data: structuredData,
      features,
      ats_score,
      saved_to_db: false,
      requestId,
    }, 'تم تحليل CV بنجاح (لم يتم الحفظ)');
  } catch (error) {
    console.error(`[${requestId}] CV Text Analysis Error:`, error);
    return res.status(500).json({
      message: 'فشل في تحليل CV',
      error: error.message,
      requestId,
    });
  }
};

/**
 * @desc بدء محادثة chatbot
 * @route POST /api/ai/chatbot/start
 * @access Private
 */
exports.startChatbotSession = async (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Start Chatbot Session`);
  try {
    const { language = 'english', initialData = {} } = req.body;
    const userId = req.user.user_id;

    const result = await aiService.startChatbotSession(userId, language, initialData);

    console.log(`[${requestId}] Chatbot Session started for user ${userId}`);
    return successResponse(res, { ...result, requestId }, 'تم بدء محادثة chatbot بنجاح');
  } catch (error) {
    console.error(`[${requestId}] Chatbot Start Error:`, error);
    return res.status(500).json({
      message: 'فشل في بدء محادثة chatbot',
      error: error.message,
      requestId,
    });
  }
};

/**
 * @desc إرسال رسالة chatbot
 * @route POST /api/ai/chatbot/chat
 * @access Private
 */
exports.sendChatbotMessage = async (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Send Chatbot Message`);
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({
        message: 'معرف الجلسة والرسالة مطلوبان',
        requestId,
      });
    }

    const result = await aiService.sendChatbotMessage(sessionId, message);

    console.log(`[${requestId}] Message sent in session ${sessionId}`);
    return successResponse(res, { ...result, requestId }, 'تم إرسال الرسالة بنجاح');
  } catch (error) {
    console.error(`[${requestId}] Chatbot Message Error:`, error);
    return res.status(500).json({
      message: 'فشل في إرسال الرسالة',
      error: error.message,
      requestId,
    });
  }
};

/**
 * @desc فحص صحة اتصال AI service
 * @route GET /api/ai/health
 * @access Public
 */
exports.aiHealthCheck = async (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] AI Health Check`);
  try {
    const aiHealth = await aiService.healthCheck();

    return successResponse(res, {
      node_backend: 'healthy',
      ai_service: aiHealth,
      ai_service_url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
      requestId,
    }, 'كل الخدمات تعمل بشكل صحيح');
  } catch (error) {
    console.error(`[${requestId}] AI Health Check Error:`, error);
    return res.status(503).json({
      message: 'AI Service غير متوفر',
      node_backend: 'healthy',
      ai_service: 'unavailable',
      error: error.message,
      requestId,
    });
  }
};

/**
 * @desc الحصول على تحليل CV من قاعدة البيانات
 * @route GET /api/ai/cv/analysis/:cvId
 * @access Private
 */
exports.getCVAnalysis = async (req, res) => {
  const requestId = uuidv4();
  console.log(`[${requestId}] Get CV Analysis`);
  try {
    const { cvId } = req.params;
    const userId = req.user.user_id;

    const cvRecord = await CV.findOne({
      where: { cv_id: cvId, user_id },
      include: [
        { model: CVStructuredData },
        { model: CVFeaturesAnalytics }
      ]
    });

    if (!cvRecord) {
      return res.status(404).json({
        message: 'CV غير موجود أو ليس لديك صلاحية الوصول',
        requestId,
      });
    }

    const result = {
      cv_id: cvRecord.cv_id,
      title: cvRecord.title,
      created_at: cvRecord.created_at,
      structured_data: cvRecord.CV_Structured_Data?.data_json || {},
      features_analytics: cvRecord.CV_Features_Analytics || {},
      requestId,
    };

    console.log(`[${requestId}] CV Analysis fetched for user ${userId}`);
    return successResponse(res, result, 'تم جلب تحليل CV بنجاح');
  } catch (error) {
    console.error(`[${requestId}] Get CV Analysis Error:`, error);
    return res.status(500).json({
      message: 'فشل في جلب تحليل CV',
      error: error.message,
      requestId,
    });
  }
};
