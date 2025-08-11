// models/Invoice.js - New Rental Invoice System
import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema({
  // Invoice Number in format INV-2500, INV-2501 etc
  invoiceNumber: { type: String, unique: true, required: true },
  
  // Basic Invoice Details
  Date: { type: String, required: false },
  dueDate: { type: String, required: false },
  poNumber: { type: String, required: false },
  
  // Invoice Type and PDF Type
  invoiceType: { 
    type: String, 
    enum: ['ADVANCE', 'PARTIAL', 'FULL'], 
    default: 'ADVANCE',
    required: true 
  },
  type: { type: String, required: false }, // TAX or PROFORMA
  
  // Company Reference
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },

  // Billing Information
  billTo: {
    name: { type: String, required: false },
    address: { type: String, required: false },
    gstin: { type: String, required: false }
  },

  shipTo: {
    name: { type: String, required: false },
    address: { type: String, required: false }
  },

  // Items Array
  items: [{
    productName: { type: String, required: false },
    duration: { type: String, required: false },
    durationUnit: { type: String, required: false, default: 'days' },
    hsnCode: { type: String, required: false },
    amount: { type: Number, required: false },
    rentedQuantity: { type: Number, required: false },
    returnedQuantity: { type: Number, required: false, default: 0 }, // For partial returns
    dailyRate: { type: Number, required: false },
    totalDays: { type: Number, required: false },
    rentAmount: { type: Number, required: false },
    startDate: { type: String, required: false },
    endDate: { type: String, required: false },
    partialReturnDate: { type: String, required: false }, // Date when items were returned
    // Damage/Fine fields for full settlement
    damagedQuantity: { type: Number, required: false, default: 0 },
    damageFinePerUnit: { type: Number, required: false, default: 0 },
    damageAmount: { type: Number, required: false, default: 0 }
  }],

  // Financial Details
  subtotal: { type: Number, required: false },
  cgstRate: { type: Number, required: false },
  cgstAmount: { type: Number, required: false },
  sgstRate: { type: Number, required: false },
  sgstAmount: { type: Number, required: false },
  ugstRate: { type: Number, required: false },
  ugstAmount: { type: Number, required: false },
  igstRate: { type: Number, required: false },
  igstAmount: { type: Number, required: false },
  totalTaxAmount: { type: Number, required: false },
  totalAmount: { type: Number, required: false },
  
  // Terms and Conditions
  termsConditions: { type: String, required: false },

  // Bank Details
  bankDetails: {
    bankName: { type: String, required: false },
    accountName: { type: String, required: false },
    accountNumber: { type: String, required: false },
    ifscCode: { type: String, required: false }
  },
  
  // Rental Details (for tracking rental status and history)
  rentalDetails: {
    startDate: { type: String, required: false },
    endDate: { type: String, required: false },
    totalDays: { type: Number, required: false },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'PARTIAL_RETURN', 'COMPLETED'], 
      default: 'ACTIVE',
      required: false 
    }
  },

  // Payment Details
  paymentDetails: {
    totalRentAmount: { type: Number, required: false, default: 0 },
    advanceAmount: { type: mongoose.Schema.Types.Mixed, required: false, default: 0 }, // Can be string or number
    paidAmount: { type: Number, required: false, default: 0 },
    outstandingAmount: { type: Number, required: false, default: 0 },
    refundAmount: { type: Number, required: false, default: 0 },
    finalAmount: { type: Number, required: false, default: 0 },
    // Aggregate damage charges applied at settlement
    damageCharges: { type: Number, required: false, default: 0 }
  },

  // Partial Return History (for tracking multiple partial returns)
  partialReturnHistory: [{
    returnDate: { type: String, required: false },
    returnedItems: [{
      productName: { type: String, required: false },
      returnedQuantity: { type: Number, required: false },
      partialAmount: { type: Number, required: false } // Amount adjusted for this partial return
    }],
    partialPayment: { type: Number, required: false, default: 0 },
    notes: { type: String, required: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

export default mongoose.model('Invoice', InvoiceSchema);