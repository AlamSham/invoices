import Company from '../models/company.js';

// CREATE
export const createCompany = async (req, res) => {
  try {
    const { name, address, gstNumber } = req.body;

    const companyExists = await Company.findOne({ gstNumber }).lean();
    if (companyExists) return res.status(400).json({ message: 'Company already exists' });

    const newCompany = await Company.create({ name, address, gstNumber });
    res.status(201).json(newCompany);
  } catch (err) {
    res.status(500).json({ message: 'Error creating company', error: err.message });
  }
};

// READ ALL
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find({}).lean().sort({ createdAt: -1 });
    res.status(200).json(companies);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching companies', error: err.message });
  }
};

// READ ONE
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id).lean();
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(company);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching company', error: err.message });
  }
};

// UPDATE
export const updateCompany = async (req, res) => {
  try {
    const updated = await Company.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Error updating company', error: err.message });
  }
};

// DELETE
export const deleteCompany = async (req, res) => {
  try {
    const deleted = await Company.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ message: 'Company not found' });
    res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting company', error: err.message });
  }
};
