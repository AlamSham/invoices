import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    gstNumber: { type: String,  trim: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
