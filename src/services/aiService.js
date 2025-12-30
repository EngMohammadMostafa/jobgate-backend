// file: src/services/aiService.js
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Helper: sleep between retries
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class AIService {
  constructor() {
    this.aiBaseUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    this.apiKey = process.env.AI_CORE_API_KEY || "";
    this.maxRetries = parseInt(process.env.AI_SERVICE_MAX_RETRIES, 10) || 2;
    this.retryDelayMs = parseInt(process.env.AI_SERVICE_RETRY_DELAY_MS, 10) || 500;

    if (!this.apiKey) {
      console.warn(
        "⚠️  AI_CORE_API_KEY is not set. AI Core requests are NOT secured!"
      );
    }

    this.aiClient = axios.create({
      baseURL: this.aiBaseUrl,
      timeout: parseInt(process.env.AI_SERVICE_TIMEOUT, 10) || 30000,
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": this.apiKey,
      },
    });

    // Interceptor لإضافة Request ID لكل طلب
    this.aiClient.interceptors.request.use((config) => {
      config.headers["X-Request-Id"] = uuidv4();
      return config;
    });
  }

  // =============================
  // Public Methods
  // =============================
  async analyzeCVText(userId, cvText, useAI = false) {
    return this._requestWithRetry("/cv/analyze-text", {
      user_id: userId,
      cv_text: cvText,
      use_ai: useAI,
    }, "CV Analysis");
  }

  async startChatbotSession(userId, language = "english", initialData = {}) {
    return this._requestWithRetry("/chatbot/start", {
      user_id: userId,
      language,
      initial_data: initialData,
    }, "Chatbot Start");
  }

  async sendChatbotMessage(sessionId, message) {
    return this._requestWithRetry("/chatbot/chat", {
      session_id: sessionId,
      message,
    }, "Chatbot Message");
  }

  async healthCheck() {
    return this._requestWithRetry("/health", null, "Health Check", "get");
  }

  // =============================
  // Private Methods
  // =============================
  async _requestWithRetry(endpoint, payload = {}, context = "", method = "post") {
    let attempt = 0;
    let lastError = null;

    while (attempt <= this.maxRetries) {
      try {
        const response =
          method.toLowerCase() === "get"
            ? await this.aiClient.get(endpoint)
            : await this.aiClient.post(endpoint, payload);

        return response.data;
      } catch (error) {
        lastError = error;
        const status = error.response?.status;

        // Retry فقط على network errors أو 5xx
        if (!status || (status >= 500 && status < 600)) {
          attempt++;
          if (attempt <= this.maxRetries) {
            console.warn(
              `⚠️ ${context} failed (attempt ${attempt}). Retrying in ${this.retryDelayMs}ms...`
            );
            await sleep(this.retryDelayMs);
            continue;
          }
        }
        // إذا خطأ غير قابل لإعادة المحاولة، ارمي مباشرة
        break;
      }
    }

    this._handleError(context, lastError);
  }

  _handleError(context, error) {
    const status = error.response?.status;
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message;

    console.error(`❌ AI Service Error [${context}]`, {
      status,
      message,
    });

    throw new Error(`AI Service ${context} failed: ${message}`);
  }
}

module.exports = new AIService();
