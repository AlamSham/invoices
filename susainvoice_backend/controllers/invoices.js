import Invoice from "../models/invoices.js";

// ===== Helpers =====
const parseYMD = (s) => {
  if (!s) return null;
  const d = new Date(`${s}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
};

// Days between yyyy-mm-dd dates, ceil, non-negative
const daysBetween = (start, end) => {
  if (!start || !end) return 0;
  try {
    const sd = parseYMD(start);
    const ed = parseYMD(end);
    if (!sd || !ed) return 0;
    const diff = (ed.getTime() - sd.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(diff));
  } catch {
    return 0;
  }
};

// Add days to yyyy-mm-dd and return yyyy-mm-dd
const addDaysYMD = (ymd, days) => {
  if (!ymd) return ymd;
  const d = parseYMD(ymd);
  if (!d) return ymd;
  d.setDate(d.getDate() + (days || 0));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ============= NEW RENTAL INVOICE SYSTEM =============

// Helper function to generate next invoice number in format INV-2500, INV-2501
const generateNextInvoiceNumber = async () => {
  try {
    // Find all invoices and extract numbers from any format containing INV-number
    const allInvoices = await Invoice.find({
      invoiceNumber: { $regex: /INV-\d+/ }  // Match any format containing INV-number
    });
    
    let maxNumber = 2499; // Start from 2499 so next will be 2500
    
    allInvoices.forEach(invoice => {
      // Extract number from formats like "INV-2500", "FULL-PARTIAL-INV-2500", etc.
      const match = invoice.invoiceNumber.match(/INV-(\d+)/);
      if (match) {
        const number = parseInt(match[1]);
        if (number > maxNumber) {
          maxNumber = number;
        }
      }
    });
    
    const nextNumber = maxNumber + 1;
    console.log(`🔢 Generated next invoice number: INV-${nextNumber} (previous max: ${maxNumber})`);
    
    return `INV-${nextNumber}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    return 'INV-2500'; // Fallback
  }
};

// CREATE New Invoice (Main function for all invoice types)
export const createInvoice = async (req, res) => {
  try {
    // Raw request logging for debugging
    try {
      console.log('>>> CREATE REQ PARAMS:', req.params || {});
      console.log('>>> CREATE REQ BODY:', JSON.stringify(req.body));
    } catch {}
   
    
    // Generate next invoice number
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    
    // Trust client-sent paymentDetails; do not recompute on backend
    const invoiceData = {
      ...req.body,
      invoiceNumber: nextInvoiceNumber,
      paymentDetails: {
        totalRentAmount: req.body.paymentDetails?.totalRentAmount ?? (req.body.totalAmount ?? 0),
        advanceAmount: req.body.paymentDetails?.advanceAmount ?? 0,
        originalAdvanceAmount: req.body.paymentDetails?.advanceAmount ?? 0,
        paidAmount: req.body.paymentDetails?.paidAmount ?? 0,
        outstandingAmount: req.body.paymentDetails?.outstandingAmount ?? 0,
        refundAmount: req.body.paymentDetails?.refundAmount ?? 0,
        finalAmount: req.body.paymentDetails?.finalAmount ?? (req.body.totalAmount ?? 0),
        damageCharges: req.body.paymentDetails?.damageCharges ?? 0,
      }
    };
    
   
    
    const newInvoice = new Invoice(invoiceData);
    const savedInvoice = await newInvoice.save();
    // Debug logs for ADVANCE or initial creation
    try {
      console.log('--- ADVANCE/CREATE DEBUG ---');
      console.log('InvoiceNumber:', nextInvoiceNumber);
      console.log('Type:', req.body.invoiceType || 'ADVANCE/CREATE');
      console.log('Items count:', (req.body.items || []).length);
      console.log('Rates sample:', (req.body.items || []).slice(0, 2).map(i => ({ name: i.productName, rate: i.dailyRate })));
      console.log('Totals (client provided):', invoiceData.paymentDetails);
      console.log('----------------------------');
    } catch {}

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: savedInvoice,
      invoiceNumber: nextInvoiceNumber
    });
  } catch (error) {
    console.error('❌ Error creating invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors || 'Unknown error'
    });
  }
};

// GET all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE invoice by ID
export const updateInvoiceById = async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE Rental Invoice with Partial Return Data
export const updateRentalInvoice = async (req, res) => {
  try {
    // Debug log
    try {
      console.log('>>> UPDATE REQ PARAMS:', req.params || {});
      console.log('>>> UPDATE REQ BODY:', JSON.stringify(req.body));
    } catch {}

    const { id } = req.params;
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Always trust client data: merge shallowly and persist
    const incomingItems = Array.isArray(req.body.items) ? req.body.items : [];
    const mergedItems = (existingInvoice.items || []).map((exist, i) => {
      const inc = incomingItems[i] || {};
      return { ...(exist.toObject?.() || exist), ...inc };
    });

    // Verbose logging to debug what is coming from the form and what will be saved
    try {
      console.log('--- Incoming Totals ---');
      console.log('subtotal:', req.body?.subtotal, ' totalTaxAmount:', req.body?.totalTaxAmount, ' totalAmount:', req.body?.totalAmount);
      console.log('--- Incoming paymentDetails ---');
      console.log(JSON.stringify(req.body?.paymentDetails || {}, null, 2));
      console.log('--- Existing paymentDetails ---');
      console.log(JSON.stringify(existingInvoice?.paymentDetails || {}, null, 2));
      console.log('--- Items (incoming vs existing[0]) ---');
      console.log('incoming[0]:', JSON.stringify(incomingItems[0] || {}, null, 2));
      console.log('existing[0]:', JSON.stringify((existingInvoice.items?.[0]?.toObject?.() || existingInvoice.items?.[0]) || {}, null, 2));
      console.log('--- Merged items[0] preview ---');
      console.log(JSON.stringify(mergedItems[0] || {}, null, 2));
    } catch {}

    const pd = req.body.paymentDetails || {};
    const rd = req.body.rentalDetails || {};
    const isFull = String(req.body.invoiceType || '').toUpperCase() === 'FULL';

    // Persist an immutable snapshot of the original advance once
    const existingPD = existingInvoice.paymentDetails || {};
    const originalAdvancePersisted = (
      existingPD && typeof existingPD.originalAdvanceAmount !== 'undefined'
    ) ? Number(existingPD.originalAdvanceAmount || 0) : Number(existingPD.advanceAmount || 0);

    // === FULL Settlement: consume finalPayment and damageCharges; do NOT re-apply advance logic ===
    if (isFull) {
      const serverOutstandingBefore = Number(existingPD.outstandingAmount || 0);
      const finalPayment = Number(pd.finalPayment || 0);
      const damageCharges = Number(pd.damageCharges || 0);
      const finalOutstanding = Math.max(0, serverOutstandingBefore + damageCharges - finalPayment);
      const computedPaymentDetails = {
        // Start from server state; DO NOT override totals with client preview values
        ...existingPD,
        // Keep remaining advance as-is; no advance re-application on full settlement
        advanceAmount: Number(existingPD.advanceAmount || 0),
        originalAdvanceAmount: originalAdvancePersisted,
        // Only settlement-related fields are updated
        paidAmount: Number(existingPD.paidAmount || 0) + finalPayment,
        outstandingAmount: finalOutstanding,
        damageCharges: Number(damageCharges || 0),
        // Preserve historical totals; do not touch finalAmount/totalRentAmount here
        finalAmount: Number(existingPD.finalAmount || 0),
        totalRentAmount: Number(existingPD.totalRentAmount || 0),
        // Do not persist extra metadata fields here (finalPayment/settlementDate/finalSettlementItems removed)
      };

      const updateData = {
        // Persist other top-level fields as sent (e.g., invoiceType),
        // but paymentDetails is authoritative from computedPaymentDetails
        ...req.body,
        paymentDetails: computedPaymentDetails,
        // IMPORTANT: Do NOT overwrite items for FULL settlement; keep original item periods
        items: existingInvoice.items,
        rentalDetails: { ...existingInvoice.rentalDetails, ...rd },
        lastUpdated: new Date(),
      };

      try {
        console.log('--- FULL settlement computed paymentDetails ---');
        console.log(JSON.stringify(updateData.paymentDetails || {}, null, 2));
        console.log('--- FULL totals to be saved ---');
        console.log('subtotal:', updateData.subtotal, ' totalTaxAmount:', updateData.totalTaxAmount, ' totalAmount:', updateData.totalAmount);
      } catch {}

      const updatedInvoice = await Invoice.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedInvoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found after update' });
      }

      try {
        console.log('✅ Saved (FULL) invoice paymentDetails (server state):');
        console.log(JSON.stringify(updatedInvoice.paymentDetails || {}, null, 2));
      } catch {}

      return res.json({ success: true, message: 'Rental invoice FULL settlement updated successfully', data: updatedInvoice });
    }

    // === Server-side payment computation for partial returns ===
    // Apply remaining advance first, then additionalPayment; compute outstanding.
    const totalAmount = Number(req.body.totalAmount || 0);
    const additionalPayment = Number(req.body.additionalPayment || 0);
    const remainingAdvanceBefore = Number(existingPD.advanceAmount || 0);
    // Advance applied cannot exceed total
    const advanceApplied = Math.min(remainingAdvanceBefore, totalAmount);
    const afterAdvance = totalAmount - advanceApplied;
    // Additional payment applied up to the remaining after advance
    const additionalApplied = Math.min(additionalPayment, afterAdvance);
    const outstandingAmount = Math.max(0, afterAdvance - additionalApplied);
    const remainingAdvanceAfter = remainingAdvanceBefore - advanceApplied;

    // Persist computed PD while respecting any extra fields from client
    const computedPaymentDetails = {
      ...existingPD,
      ...pd,
      advanceAmount: remainingAdvanceAfter, // remaining advance post application
      paidAmount: Number(existingPD.paidAmount || 0) + additionalApplied, // accumulate partial payments
      outstandingAmount,
      finalAmount: totalAmount,
      // Keep original advance for UI clarity
      originalAdvanceAmount: originalAdvancePersisted,
    };

    const updateData = {
      ...req.body,
      items: mergedItems,
      paymentDetails: computedPaymentDetails,
      rentalDetails: { ...existingInvoice.rentalDetails, ...rd },
      // partialReturnHistory will be set below after optionally appending a new entry
      lastUpdated: new Date()
    };

    // === Persist partial return event and client preview, if applicable ===
    try {
      const prevHistory = Array.isArray(existingInvoice.partialReturnHistory)
        ? [...existingInvoice.partialReturnHistory]
        : []
      const isPartial = (String(req.body.invoiceType || '').toUpperCase() === 'PARTIAL')
      // Build returnedItems from incoming items
      const returnedItems = (incomingItems || [])
        .filter((it) => Number(it?.returnedQuantity || 0) > 0)
        .map((it) => ({
          productName: it.productName || '-',
          returnedQuantity: Number(it.returnedQuantity || 0),
          partialAmount: Number(it.amount || it.rentAmount || 0),
        }))
      if (isPartial && returnedItems.length > 0) {
        // Choose a returnDate: first defined partialReturnDate among returned items, else today
        const firstDate = (incomingItems || []).find((it) => Number(it?.returnedQuantity || 0) > 0 && it?.partialReturnDate)?.partialReturnDate
        const returnDate = firstDate || new Date().toISOString().split('T')[0]
        const entry = {
          returnDate,
          returnedItems,
          // Store the client-side preview for remaining items if provided
          previewRemainingSummary: Array.isArray(req.body.previewRemainingSummary) ? req.body.previewRemainingSummary : undefined,
          clientPreview: Boolean(req.body.clientPreview),
          // Capture how much was actually applied now (after advance application)
          partialPayment: Number(computedPaymentDetails.paidAmount || 0) - Number(existingPD.paidAmount || 0),
          createdAt: new Date().toISOString(),
        }
        prevHistory.push(entry)
      }
      // If client explicitly sent a full history array, prefer that; otherwise, persist our appended history
      updateData.partialReturnHistory = Array.isArray(req.body.partialReturnHistory)
        ? req.body.partialReturnHistory
        : prevHistory
    } catch {}

    try {
      console.log('--- Final updateData.paymentDetails to be saved ---');
      console.log(JSON.stringify(updateData.paymentDetails || {}, null, 2));
      console.log('--- Final updateData.totals to be saved ---');
      console.log('subtotal:', updateData.subtotal, ' totalTaxAmount:', updateData.totalTaxAmount, ' totalAmount:', updateData.totalAmount);
    } catch {}

    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedInvoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found after update' });
    }

    try {
      console.log('✅ Saved invoice paymentDetails (server state):');
      console.log(JSON.stringify(updatedInvoice.paymentDetails || {}, null, 2));
      console.log('✅ Saved totals (server state): subtotal:', updatedInvoice.subtotal, ' totalTaxAmount:', updatedInvoice.totalTaxAmount, ' totalAmount:', updatedInvoice.totalAmount);
    } catch {}

    return res.json({
      success: true,
      message: 'Rental invoice updated successfully (client data persisted)',
      data: updatedInvoice,
      remainingSummary: null,
      partialTotals: req.body.clientPartialTotals || null
    });
  } catch (error) {
    console.error('❌ Error updating rental invoice:', error);
    res.status(400).json({ success: false, error: error.message, details: error.errors || 'Unknown error' });
  }
};

// DELETE invoice by ID
export const deleteInvoiceById = async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
    res.json({
      success: true,
      message: "Invoice deleted successfully",
      data: deletedInvoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET next invoice number (for frontend preview)
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const nextInvoiceNumber = await generateNextInvoiceNumber();
    res.json({
      success: true,
      nextInvoiceNumber
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET unique billTo records by GSTIN
export const getBillToList = async (req, res) => {
  try {
    const allBillTo = await Invoice.find({}, 'billTo');
    const uniqueGstin = new Set();
    const filteredBillTo = [];

    allBillTo.forEach(doc => {
      if (doc.billTo?.gstin && !uniqueGstin.has(doc.billTo.gstin)) {
        uniqueGstin.add(doc.billTo.gstin);
        filteredBillTo.push(doc.billTo);
      }
    });

    if (filteredBillTo.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No records found' 
      });
    }

    res.json({
      success: true,
      count: filteredBillTo.length,
      data: filteredBillTo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};

// GET Rental Analytics Data - Advanced detailed reporting
export const getRentalAnalytics = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { from, to } = req.query;
    
    console.log('📊 Fetching rental analytics for company:', companyId);
    
    // Build date filter
    let dateFilter = {};
    if (from || to) {
      dateFilter.Date = {};
      if (from) dateFilter.Date.$gte = from;
      if (to) dateFilter.Date.$lte = to;
    }
    
    // Get all rental invoices for the company
    const invoices = await Invoice.find({
      companyId,
      ...dateFilter
    }).sort({ Date: -1 });
    
    console.log(`📋 Found ${invoices.length} invoices for analytics`);
    
    // Initialize analytics data
    const analytics = {
      overview: {
        totalProductsRented: 0,
        totalProductsReturned: 0,
        totalProductsPending: 0,
        totalRevenue: 0,
        totalClients: 0,
        activeRentals: 0,
        completedRentals: 0,
        partialReturns: 0,
      },
      productAnalytics: new Map(),
      clientAnalytics: new Map(),
      detailedHistory: [],
      monthlyTrends: new Map(),
    };
    
    // Process each invoice
    invoices.forEach(invoice => {
      const clientName = invoice.billTo?.name || 'Unknown Client';
      const invoiceDate = new Date(invoice.Date);
      const monthKey = `${invoiceDate.getFullYear()}-${String(invoiceDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Update overview stats
      analytics.overview.totalRevenue += invoice.totalAmount || 0;
      
      // Count invoice types
      if (invoice.invoiceType === 'PARTIAL') {
        analytics.overview.partialReturns++;
      }
      
      // Count rental status
      if (invoice.rentalDetails?.status === 'ACTIVE') {
        analytics.overview.activeRentals++;
      } else if (invoice.rentalDetails?.status === 'COMPLETED') {
        analytics.overview.completedRentals++;
      }
      
      // Process items
      if (invoice.items && Array.isArray(invoice.items)) {
        invoice.items.forEach(item => {
          const productName = item.productName || 'Unknown Product';
          const rentedQty = parseInt(item.rentedQuantity) || 0;
          const returnedQty = parseInt(item.returnedQuantity) || 0;
          const dailyRate = parseFloat(item.dailyRate) || 0;
          const totalDays = parseInt(item.totalDays) || 0;
          const itemAmount = parseFloat(item.amount) || 0;
          
          // Update overview totals
          analytics.overview.totalProductsRented += rentedQty;
          analytics.overview.totalProductsReturned += returnedQty;
          analytics.overview.totalProductsPending += (rentedQty - returnedQty);
          
          // Update product analytics
          if (!analytics.productAnalytics.has(productName)) {
            analytics.productAnalytics.set(productName, {
              productName,
              totalRented: 0,
              totalReturned: 0,
              currentlyRented: 0,
              totalRevenue: 0,
              avgDailyRate: 0,
              totalRentalDays: 0,
              rateSum: 0,
              rateCount: 0,
            });
          }
          
          const productStats = analytics.productAnalytics.get(productName);
          productStats.totalRented += rentedQty;
          productStats.totalReturned += returnedQty;
          productStats.currentlyRented += (rentedQty - returnedQty);
          productStats.totalRevenue += itemAmount;
          productStats.totalRentalDays += totalDays;
          productStats.rateSum += dailyRate;
          productStats.rateCount++;
          productStats.avgDailyRate = productStats.rateSum / productStats.rateCount;
          
          // Update client analytics
          if (!analytics.clientAnalytics.has(clientName)) {
            analytics.clientAnalytics.set(clientName, {
              clientName,
              totalInvoices: 0,
              totalRented: 0,
              totalReturned: 0,
              pendingReturns: 0,
              totalPaid: 0,
              outstandingAmount: 0,
              lastRentalDate: invoice.Date,
            });
          }
          
          const clientStats = analytics.clientAnalytics.get(clientName);
          clientStats.totalRented += rentedQty;
          clientStats.totalReturned += returnedQty;
          clientStats.pendingReturns += (rentedQty - returnedQty);
          
          // Update last rental date if this is more recent
          if (new Date(invoice.Date) > new Date(clientStats.lastRentalDate)) {
            clientStats.lastRentalDate = invoice.Date;
          }
        });
      }
      
      // Update client invoice count and payment details
      const clientName2 = invoice.billTo?.name || 'Unknown Client';
      if (analytics.clientAnalytics.has(clientName2)) {
        const clientStats = analytics.clientAnalytics.get(clientName2);
        clientStats.totalInvoices++;
        clientStats.totalPaid += parseFloat(invoice.paymentDetails?.paidAmount) || 0;
        clientStats.outstandingAmount += parseFloat(invoice.paymentDetails?.outstandingAmount) || 0;
      }
      
      // Update monthly trends
      if (!analytics.monthlyTrends.has(monthKey)) {
        analytics.monthlyTrends.set(monthKey, {
          month: monthKey,
          rented: 0,
          returned: 0,
          revenue: 0,
        });
      }
      
      const monthStats = analytics.monthlyTrends.get(monthKey);
      monthStats.revenue += invoice.totalAmount || 0;
      
      if (invoice.items) {
        invoice.items.forEach(item => {
          monthStats.rented += parseInt(item.rentedQuantity) || 0;
          monthStats.returned += parseInt(item.returnedQuantity) || 0;
        });
      }
      
      // Add to detailed history
      analytics.detailedHistory.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.billTo?.name || 'Unknown Client',
        invoiceType: invoice.invoiceType || 'ADVANCE',
        date: invoice.Date,
        items: (invoice.items || []).map(item => ({
          productName: item.productName || 'Unknown Product',
          rentedQuantity: parseInt(item.rentedQuantity) || 0,
          returnedQuantity: parseInt(item.returnedQuantity) || 0,
          remainingQuantity: (parseInt(item.rentedQuantity) || 0) - (parseInt(item.returnedQuantity) || 0),
          dailyRate: parseFloat(item.dailyRate) || 0,
          totalDays: parseInt(item.totalDays) || 0,
          amount: parseFloat(item.amount) || 0,
        })),
        status: invoice.rentalDetails?.status || 'UNKNOWN',
        totalAmount: invoice.totalAmount || 0,
      });
    });
    
    // Count unique clients
    analytics.overview.totalClients = analytics.clientAnalytics.size;
    
    // Convert Maps to Arrays for JSON response
    const responseData = {
      overview: analytics.overview,
      productAnalytics: Array.from(analytics.productAnalytics.values()),
      clientAnalytics: Array.from(analytics.clientAnalytics.values()),
      detailedHistory: analytics.detailedHistory,
      monthlyTrends: Array.from(analytics.monthlyTrends.values()).sort((a, b) => a.month.localeCompare(b.month)),
    };
    
    console.log('✅ Analytics data processed successfully');
    
    res.json({
      success: true,
      data: responseData,
      message: 'Rental analytics fetched successfully'
    });
    
  } catch (error) {
    console.error('❌ Error fetching rental analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rental analytics',
      error: error.message
    });
  }
};

// SEARCH invoices by GSTIN, name or address
export const searchInvoicesByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    const query = {
      $or: [
        { "billTo.gstin": identifier },
        { "billTo.name": { $regex: new RegExp(identifier, "i") } },
        { "billTo.address": { $regex: new RegExp(identifier, "i") } },
      ],
    };

    const invoices = await Invoice.find(query, { 
      invoiceNumber: 1, 
      Date: 1, 
      type: 1, 
      invoiceType: 1,
      totalAmount: 1,
      billTo: 1
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: error.message
    });
  }
};

// GET Invoice Summary by Company ID
export const getInvoiceSummaryByCompanyId = async (req, res) => {
  try {
    const { companyId } = req.params;

    const invoices = await Invoice.find({ companyId }).sort({ createdAt: -1 });

    if (invoices.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'No invoices found for this company' 
      });
    }

    // Calculate summary statistics
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      advanceInvoices: invoices.filter(inv => inv.invoiceType === 'ADVANCE').length,
      partialInvoices: invoices.filter(inv => inv.invoiceType === 'PARTIAL').length,
      fullInvoices: invoices.filter(inv => inv.invoiceType === 'FULL').length
    };

    res.json({
      success: true,
      summary,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error', 
      error: error.message 
    });
  }
};