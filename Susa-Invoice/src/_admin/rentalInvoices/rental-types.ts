// Company Details (matching new-invoice structure exactly)
export interface CompanyDetails {
  name: string
  address: string
  gstin: string
  pan?: string
  phone: string
  email: string
  logo: string
  stamp?: string
}

// Rental Invoice Data (matching new-invoice InvoiceData structure)
export interface RentalInvoiceData {
  _id?: string
  invoiceNumber: string
  Date: string
  dueDate: string
  poNumber: string
  billTo: {
    name: string
    address: string
    gstin: string
  }
  shipTo: {
    name: string
    address: string
  }
  items: {
    productName: string
    duration: string | number
    durationUnit: string
    hsnCode?: string
    amount: string | number
    // Rental specific fields
    rentedQuantity: string | number
    dailyRate: string | number
    totalDays: string | number
    rentAmount: string | number
    returnedQuantity?: string | number
    // cumulative returned qty already stored on parent invoice
    originalReturnedQuantity?: number
    actualDays?: string | number
    returnDate?: string
    // Product-wise rental dates
    startDate?: string
    endDate?: string
    partialReturnDate?: string
    // Damage fields (for full settlement)
    damagedQuantity?: string | number
    damageFinePerUnit?: string | number
    damageAmount?: string | number
  }[]
  subtotal: number
  cgstRate: number
  cgstAmount: number
  sgstRate: number
  sgstAmount: number
  ugstRate: number
  ugstAmount: number
  igstRate: number
  igstAmount: number
  totalTaxAmount: number
  totalAmount: number
  paymentTerms: string
  termsConditions: string
  bankDetails: {
    bankName: string
    accountName: string
    accountNumber: string
    ifscCode: string
  }
  // Rental specific fields
  rentalDetails?: {
    startDate: string
    endDate?: string
    totalDays: string | number
    status: 'ACTIVE' | 'PARTIAL_RETURN' | 'COMPLETED'
  }
  paymentDetails?: {
    totalRentAmount: number
    advanceAmount: string | number
    paidAmount: number
    outstandingAmount: number
    refundAmount: number
    finalAmount: number
    damageCharges?: number
  }
  invoiceType?: 'ADVANCE' | 'PARTIAL' | 'FULL'
  parentInvoiceId?: string
  relatedInvoices?: {
    invoiceId: string
    invoiceType: 'ADVANCE' | 'PARTIAL' | 'FULL'
    amount: number
    date: string
  }[]
  // History of partial returns captured on the parent invoice
  partialReturnHistory?: {
    returnDate?: string
    returnedItems?: {
      productName?: string
      returnedQuantity?: number
      partialAmount?: number
    }[]
    partialPayment?: number
    notes?: string
    createdAt?: string
  }[]
}

// Form Data Types for specific operations
export interface AdvanceFormData {
  companyId: string
  clientName: string
  clientAddress: string
  clientGstin?: string
  items: {
    productName: string
    duration: number
    durationUnit: string
    hsnCode: string
    amount: number
    rentedQuantity?: number
    dailyRate?: number
    totalDays?: number
    rentAmount?: number
  }[]
  rentalDetails: {
    startDate: string
    endDate?: string
    totalDays: number
    status: 'ACTIVE' | 'PARTIAL_RETURN' | 'COMPLETED'
  }
  advanceAmount: number
  paymentTerms: string
  termsConditions: string
}

export interface PartialReturnFormData {
  parentInvoiceId: string
  returnDate: string
  returnedItems: {
    productName: string
    returnedQuantity: number
  }[]
  additionalPayment?: number
  notes?: string
}

export interface FullSettlementFormData {
  parentInvoiceId: string
  finalReturnDate: string
  finalPayment: number
  notes?: string
}

