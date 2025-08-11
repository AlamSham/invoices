// models/File.js
import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  fileUrls: {
    type: [String],
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model('Files', fileSchema);
