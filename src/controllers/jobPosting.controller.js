// file: src/controllers/jobPosting.controller.js
const sequelize = require("../config/db.config");
const { JobPosting, JobForm, JobFormField, Company, Application } = require("../models");
const { successResponse } = require("../utils/responseHandler");

/**
 * @desc [Company] إنشاء إعلان توظيف جديد
 * @route POST /api/companies/company/job-postings
 * @access Private (Company)
 */
exports.createJobPosting = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const company = req.company;
    const {
      title,
      description,
      requirements,
      salary_min,
      salary_max,
      location,
      form_type,
      external_form_url,
      require_cv = true,
      form_fields = []
    } = req.body;

    // التحقق من البيانات الأساسية
    if (!title || !description || !form_type) {
      await t.rollback();
      return res.status(400).json({ 
        message: "العنوان والوصف ونوع النموذج إجباريون" 
      });
    }

    if (form_type === 'external_link' && !external_form_url) {
      await t.rollback();
      return res.status(400).json({ 
        message: "رابط النموذج الخارجي مطلوب" 
      });
    }

    // إنشاء إعلان التوظيف
    const jobPosting = await JobPosting.create({
      title,
      description,
      requirements,
      salary_min,
      salary_max,
      location,
      form_type,
      external_form_url,
      company_id: company.company_id,
      status: 'open'
    }, { transaction: t });

    // إذا كان النموذج داخلي، ننشئ النموذج وحقوله
    if (form_type === 'internal_form') {
      const jobForm = await JobForm.create({
        job_id: jobPosting.job_id,
        require_cv
      }, { transaction: t });

      // إنشاء حقول النموذج إذا وجدت
      if (form_fields.length > 0) {
        const formFieldsData = form_fields.map(field => ({
          ...field,
          form_id: jobForm.form_id
        }));
        await JobFormField.bulkCreate(formFieldsData, { transaction: t });
      }
    }

    await t.commit();
    return successResponse(res, jobPosting, "تم إنشاء إعلان التوظيف بنجاح", 201);
  } catch (error) {
    await t.rollback();
    console.error("Error creating job posting:", error);
    return res.status(500).json({ 
      message: "فشل في إنشاء إعلان التوظيف", 
      error: error.message 
    });
  }
};

/**
 * @desc [Company] عرض إعلانات التوظيف للشركة
 * @route GET /api/companies/company/job-postings
 * @access Private (Company)
 */
exports.getCompanyJobPostings = async (req, res) => {
  try {
    const company = req.company;
    
    const jobPostings = await JobPosting.findAll({
      where: { company_id: company.company_id },
      include: [
        {
          model: JobForm,
          include: [JobFormField]
        },
        {
          model: Application,
          attributes: ['application_id', 'status', 'submitted_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    return successResponse(res, jobPostings);
  } catch (error) {
    console.error("Error getting company job postings:", error);
    return res.status(500).json({ 
      message: "فشل في جلب إعلانات التوظيف", 
      error: error.message 
    });
  }
};

/**
 * @desc [Company] تعديل إعلان توظيف
 * @route PUT /api/companies/company/job-postings/:id
 * @access Private (Company)
 */
exports.updateJobPosting = async (req, res) => {
  try {
    const company = req.company;
    const jobId = req.params.id;
    const updateData = req.body;

    // التحقق من ملكية الإعلان للشركة
    const jobPosting = await JobPosting.findOne({
      where: { job_id: jobId, company_id: company.company_id }
    });

    if (!jobPosting) {
      return res.status(404).json({ message: "إعلان التوظيف غير موجود" });
    }

    // الحقول المسموح بتعديلها
    const allowedUpdates = [
      'title', 'description', 'requirements', 'salary_min', 
      'salary_max', 'location', 'external_form_url'
    ];
    
    const filteredUpdates = {};
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdates[field] = updateData[field];
      }
    });

    await jobPosting.update(filteredUpdates);

    return successResponse(res, jobPosting, "تم تحديث إعلان التوظيف بنجاح");
  } catch (error) {
    console.error("Error updating job posting:", error);
    return res.status(500).json({ 
      message: "فشل في تحديث إعلان التوظيف", 
      error: error.message 
    });
  }
};

/**
 * @desc [Company] تغيير حالة إعلان التوظيف (فتح/إغلاق)
 * @route PUT /api/companies/company/job-postings/:id/toggle
 * @access Private (Company)
 */
exports.toggleJobPostingStatus = async (req, res) => {
  try {
    const company = req.company;
    const jobId = req.params.id;

    const jobPosting = await JobPosting.findOne({
      where: { job_id: jobId, company_id: company.company_id }
    });

    if (!jobPosting) {
      return res.status(404).json({ message: "إعلان التوظيف غير موجود" });
    }

    const newStatus = jobPosting.status === 'open' ? 'closed' : 'open';
    await jobPosting.update({ status: newStatus });

    return successResponse(res, 
      { ...jobPosting.toJSON(), status: newStatus }, 
      `تم ${newStatus === 'open' ? 'فتح' : 'إغلاق'} إعلان التوظيف بنجاح`
    );
  } catch (error) {
    console.error("Error toggling job posting status:", error);
    return res.status(500).json({ 
      message: "فشل في تغيير حالة الإعلان", 
      error: error.message 
    });
  }
};

/**
 * @desc [Company] إنشاء فورم داخلي لوظيفة
 * @route POST /api/companies/company/job-forms
 * @access Private (Company)
 */
exports.createJobForm = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const company = req.company;
    const { job_id, require_cv = true, fields = [] } = req.body;

    // التحقق من ملكية الوظيفة للشركة
    const jobPosting = await JobPosting.findOne({
      where: { job_id, company_id: company.company_id }
    });

    if (!jobPosting) {
      await t.rollback();
      return res.status(404).json({ message: "الوظيفة غير موجودة" });
    }

    // إنشاء النموذج
    const jobForm = await JobForm.create({
      job_id,
      require_cv
    }, { transaction: t });

    // إنشاء حقول النموذج
    if (fields.length > 0) {
      const formFieldsData = fields.map(field => ({
        ...field,
        form_id: jobForm.form_id
      }));
      await JobFormField.bulkCreate(formFieldsData, { transaction: t });
    }

    await t.commit();
    return successResponse(res, jobForm, "تم إنشاء النموذج بنجاح", 201);
  } catch (error) {
    await t.rollback();
    console.error("Error creating job form:", error);
    return res.status(500).json({ 
      message: "فشل في إنشاء النموذج", 
      error: error.message 
    });
  }
};