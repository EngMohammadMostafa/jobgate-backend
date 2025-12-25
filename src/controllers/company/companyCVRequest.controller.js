const { CompanyCVRequest } = require("../../models");

exports.createCVRequest = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { requested_role, experience_years, skills, location, cv_count } = req.body;

    if (!requested_role || !cv_count) return res.status(400).json({ message: "requested_role and cv_count are required" });

    const request = await CompanyCVRequest.create({ company_id: companyId, requested_role, experience_years, skills, location, cv_count });
    res.status(201).json({ message: "CV request created successfully", data: request });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
