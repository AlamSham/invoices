// controllers/files.js
import Files from '../models/files.js';

// Create new file record
export const createFileRecord = async (req, res) => {
  try {
    const { companyName, totalAmount } = req.body;
    const fileUrls = req.files.map(file => file.path); // for Multer local, use file.path

    const newRecord = await Files.create({
      fileUrls,
      companyName,
      totalAmount,
    });

    res.status(201).json({ message: 'File record created', data: newRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while creating file record' });
  }
};

// Get all files
export const getAllFiles = async (req, res) => {
  try {
    const files = await Files.find().sort({ createdAt: -1 });
    res.status(200).json(files);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching file records' });
  }
};

// Get file by ID
export const getFileById = async (req, res) => {
  try {
    const file = await Files.findById(req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.status(200).json(file);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching file' });
  }
};

// Update file record by ID
export const updateFileRecord = async (req, res) => {
  try {
    const { companyName, totalAmount } = req.body;
    const fileUrls = req.files?.length ? req.files.map(file => file.path) : undefined;

    const updated = await Files.findByIdAndUpdate(
      req.params.id,
      {
        ...(companyName && { companyName }),
        ...(totalAmount && { totalAmount }),
        ...(fileUrls && { fileUrls }),
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'File not found for update' });
    res.status(200).json({ message: 'File updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Error updating file record' });
  }
};

// Delete file record by ID
export const deleteFileRecord = async (req, res) => {
  try {
    const deleted = await Files.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'File not found for deletion' });
    res.status(200).json({ message: 'File deleted', data: deleted });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting file record' });
  }
};

// Fast query filter (by companyName or date range)
export const filterFiles = async (req, res) => {
  try {
    const { companyName, startDate, endDate } = req.query;

    const filter = {};

    if (companyName) {
      filter.companyName = new RegExp(companyName, 'i'); // case-insensitive partial match
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const results = await Files.find(filter).sort({ createdAt: -1 });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Error filtering file records' });
  }
};
