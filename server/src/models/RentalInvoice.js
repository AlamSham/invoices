import mongoose from 'mongoose'

const ItemSchema = new mongoose.Schema({
  productName: String,
  duration: { type: String, default: '' },
  durationUnit: { type: String, default: 'days' },
  hsnCode: { type: String, default: '' },
  amount: { type: Number, default: 0 },
  rentedQuantity: { type: Number, default: 0 },
  returnedQuantity: { type: Number, default: 0 }, // cumulative returned so far
  dailyRate: { type: Number, default: 0 },
  totalDays: { type: Number, default: 0 },
  rentAmount: { type: Number, default: 0 },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  partialReturnDate: { type: String, default: '' }, // last partial date applied to this row
})

const PaymentDetailsSchema = new mongoose.Schema({
  totalRentAmount: { type: Number, default: 0 },
  advanceAmount: { type: Number, default: 0 }, // remaining advance
  paidAmount: { type: Number, default: 0 }, // collected partial payments total
  outstandingAmount: { type: Number, default: 0 },
  refundAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  damageCharges: { type: Number, default: 0 },
}, { _id: false })

const RentalDetailsSchema = new mongoose.Schema({
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' },
  totalDays: { type: Number, default: 0 },
  status: { type: String, default: 'ACTIVE' },
}, { _id: false })

const PartialHistoryItemSchema = new mongoose.Schema({
  productName: String,
  returnedQuantity: Number,
  amount: Number, // base amount without tax for this returned item
}, { _id: false })

const PartialReturnEventSchema = new mongoose.Schema({
  returnDate: { type: String },
  returnedItems: [PartialHistoryItemSchema],
  subtotal: Number,
  taxAmount: Number,
  total: Number,
  usedAdvance: Number,
  collectedNow: Number,
  remainingAdvance: Number,
  outstandingAfter: Number,
  note: { type: String, default: '' },
}, { _id: false })

const RentalInvoiceSchema = new mongoose.Schema({
  invoiceNumber: String,
  Date: String,
  dueDate: String,
  poNumber: String,
  invoiceType: { type: String, default: 'ADVANCE' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  billTo: { type: mongoose.Schema.Types.Mixed, default: {} },
  shipTo: { type: mongoose.Schema.Types.Mixed, default: {} },
  items: [ItemSchema],
  subtotal: { type: Number, default: 0 },
  cgstRate: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstRate: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  ugstRate: { type: Number, default: 0 },
  ugstAmount: { type: Number, default: 0 },
  igstRate: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },
  totalTaxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '' },
  termsConditions: { type: String, default: '' },
  bankDetails: { type: mongoose.Schema.Types.Mixed, default: {} },
  rentalDetails: RentalDetailsSchema,
  paymentDetails: PaymentDetailsSchema,
  partialReturnHistory: { type: [PartialReturnEventSchema], default: [] },
}, { timestamps: true })

export default mongoose.model('RentalInvoice', RentalInvoiceSchema)
