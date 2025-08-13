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
    
    // Calculate payment details properly
    const totalAmount = req.body.totalAmount || 0;
    const advanceAmount = parseFloat(req.body.paymentDetails?.advanceAmount || 0);
    const paidAmount = parseFloat(req.body.paymentDetails?.paidAmount || 0);
    
    // Calculate outstanding amount
    const outstandingAmount = totalAmount - advanceAmount - paidAmount;
    
    // Create invoice with generated number and calculated payment details
    const invoiceData = {
      ...req.body,
      invoiceNumber: nextInvoiceNumber,
      paymentDetails: {
        ...req.body.paymentDetails,
        totalRentAmount: totalAmount,
        advanceAmount: advanceAmount,
        paidAmount: paidAmount,
        outstandingAmount: outstandingAmount,
        refundAmount: req.body.paymentDetails?.refundAmount || 0,
        finalAmount: totalAmount
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
      console.log('Totals:', {
        totalAmount,
        advanceAmount,
        paidAmount,
        outstandingAmount
      });
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
    // Raw request logging for debugging
    try {
      console.log('>>> UPDATE REQ PARAMS:', req.params || {});
      console.log('>>> UPDATE REQ BODY:', JSON.stringify(req.body));
    } catch {}
    const { id } = req.params;
   
    // Find the existing invoice
    const existingInvoice = await Invoice.findById(id);
    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found"
      });
    }
   
    // Prepare payment baseline
    const originalAdvance = parseFloat(existingInvoice.paymentDetails?.advanceAmount || 0);
    const alreadyPaid = parseFloat(existingInvoice.paymentDetails?.paidAmount || 0);
    const damageCharges = parseFloat(req.body.paymentDetails?.damageCharges || 0);

    // We will compute partial invoice amount (this event) from items below
    let partialSubtotal = 0;
    let returnedItemsForHistory = [];

    // Build partial return history entry if this is a PARTIAL update
    let updatedPartialHistory = existingInvoice.partialReturnHistory || [];
    const entryDate = req.body.rentalDetails?.partialReturnDate || req.body.Date || new Date().toISOString().split('T')[0];

    // Validate and accumulate returned quantities per item, updating items array
    let updatedItems = existingInvoice.items ? existingInvoice.items.map(i => ({ ...i.toObject?.() || i })) : [];
    const incomingItems = Array.isArray(req.body.items) ? req.body.items : [];

    // We will match items by index. If product identity matters, this can be enhanced to match by productName/hsnCode.
    for (let i = 0; i < incomingItems.length; i++) {
      const inc = incomingItems[i] || {};
      const exist = updatedItems[i];
      if (!exist) continue;

      const rentedQty = parseInt(exist.rentedQuantity) || 0;
      const alreadyReturned = parseInt(exist.returnedQuantity) || 0;
      const newlyReturned = parseInt(inc.returnedQuantity) || 0;

      // Max allowable to return now
      const remainingCanReturn = Math.max(0, rentedQty - alreadyReturned);
      if (newlyReturned > remainingCanReturn) {
        return res.status(400).json({
          success: false,
          message: `Returned quantity for item ${exist.productName || i + 1} exceeds remaining quantity. Remaining: ${remainingCanReturn}`
        });
      }

      // Accumulate returned quantity
      const newTotalReturned = alreadyReturned + newlyReturned;

      // Compute partial amount for this returned chunk
      const dailyRate = parseFloat((inc.dailyRate ?? exist.dailyRate) || 0);
      const startForReturned = (inc.startDate ?? exist.startDate) || (existingInvoice.rentalDetails?.startDate || entryDate);
      const thisPartialReturnDate = inc.partialReturnDate || entryDate;
      const d = daysBetween(startForReturned, thisPartialReturnDate);
      const partialAmount = Math.max(0, d) * Math.max(0, dailyRate) * Math.max(0, newlyReturned);
      if (newlyReturned > 0) {
        returnedItemsForHistory.push({
          productName: inc.productName || exist.productName,
          returnedQuantity: newlyReturned,
          partialAmount: Number(partialAmount.toFixed(2))
        });
        partialSubtotal += partialAmount;
        // Per-item debug
        try {
          console.log('--- PARTIAL ITEM DEBUG ---');
          console.log('Item:', inc.productName || exist.productName);
          console.log('RentedQty:', rentedQty, 'AlreadyReturned:', alreadyReturned, 'ReturnNow:', newlyReturned);
          console.log('Rate:', dailyRate, 'Start:', startForReturned, 'PartialDate:', thisPartialReturnDate, 'Days:', d);
          console.log('PartialAmount:', partialAmount);
          console.log('--------------------------');
        } catch {}
      }

      // Remaining accrual starts next day after partial return
      const remainingAfterThis = Math.max(0, rentedQty - newTotalReturned);
      const partialDate = thisPartialReturnDate;
      const accrualStartNextDay = remainingAfterThis > 0 ? addDaysYMD(partialDate, 1) : (inc.startDate ?? exist.startDate);

      updatedItems[i] = {
        ...exist,
        returnedQuantity: newTotalReturned,
        startDate: accrualStartNextDay,
        endDate: inc.endDate ?? exist.endDate,
        partialReturnDate: partialDate ?? exist.partialReturnDate,
        dailyRate: isNaN(dailyRate) ? exist.dailyRate : dailyRate,
        totalDays: inc.totalDays ?? exist.totalDays,
        amount: inc.amount ?? exist.amount,
        rentAmount: inc.rentAmount ?? exist.rentAmount,
      };
    }

    // Compute taxes for this partial event using existing invoice tax rates
    const cgstRate = parseFloat(existingInvoice.cgstRate || 0);
    const sgstRate = parseFloat(existingInvoice.sgstRate || 0);
    const ugstRate = parseFloat(existingInvoice.ugstRate || 0);
    const igstRate = parseFloat(existingInvoice.igstRate || 0);
    const cgstAmount = (partialSubtotal * cgstRate) / 100;
    const sgstAmount = (partialSubtotal * sgstRate) / 100;
    const ugstAmount = (partialSubtotal * ugstRate) / 100;
    const igstAmount = (partialSubtotal * igstRate) / 100;
    const partialTax = cgstAmount + sgstAmount + ugstAmount + igstAmount;
    const partialTotal = partialSubtotal + partialTax;

    try {
      console.log('=== PARTIAL SUMMARY DEBUG ===');
      console.log('EntryDate:', entryDate);
      console.log('ReturnedItems:', returnedItemsForHistory);
      console.log('Subtotal:', partialSubtotal, 'Tax:', partialTax, 'Total:', partialTotal);
      console.log('CGST/SGST/UGST/IGST:', { cgstRate, sgstRate, ugstRate, igstRate });
    } catch {}

    // Cash-first, then advance for any remaining partial amount
    let newAdvance = originalAdvance;
    // Treat client-sent paidAmount as cash collected for THIS event (not lifecycle total)
    const requestedPaidNow = Number((req.body?.paymentDetails?.paidAmount ?? 0));
    let appliedFromCashToPartial = Math.min(partialTotal, Math.max(0, requestedPaidNow));
    let remainingPartialAfterCash = Math.max(0, Number((partialTotal - appliedFromCashToPartial).toFixed(2)));
    let appliedFromAdvance = Math.min(newAdvance, remainingPartialAfterCash);
    newAdvance = Number((newAdvance - appliedFromAdvance).toFixed(2));
    const collectedNow = Number((requestedPaidNow).toFixed(2)); // full cash collected now
    const newPaidAmount = Number((alreadyPaid + collectedNow).toFixed(2));

    // Re-baseline outstanding to current invoice total (from client request) minus (advance + paid so far)
    // This aligns with user's expectation: outstanding = currentTotal - (advance + partial cash total)
    const baseTotal = parseFloat(existingInvoice.paymentDetails?.totalRentAmount || existingInvoice.totalAmount || 0);
    const currentInvoiceTotal = parseFloat(req.body?.totalAmount ?? partialTotal ?? 0);
    const paidSoFarTotal = Number((originalAdvance + newPaidAmount).toFixed(2));
    const newOutstandingAmount = Math.max(0, Number((currentInvoiceTotal - paidSoFarTotal).toFixed(2)));

    try {
      console.log('Advance/Payout DEBUG:', {
        advance: originalAdvance,
        remainingAdvance: newAdvance,
        collectedNow,
        alreadyPaid,
        newPaidAmount,
        fullAmount: baseTotal,
        damageCharges,
        appliedFromCashToPartial,
        appliedFromAdvance,
        outstanding: newOutstandingAmount
      });
      console.log('--- SUMMARY ---', {
        advance: originalAdvance,
        partialAmount: Number(partialTotal.toFixed(2)),
        fullAmount: currentInvoiceTotal,
        outstanding: newOutstandingAmount,
        remainingAdvance: newAdvance,
        collectedNow
      });
    } catch {}

    // Append partial history if PARTIAL and we have returned items
    if (req.body.invoiceType === 'PARTIAL' && returnedItemsForHistory.length > 0) {
      const historyEntry = {
        returnDate: entryDate,
        returnedItems: returnedItemsForHistory,
        partialPayment: collectedNow,
        notes: req.body.notes || 'Partial return recorded'
      };
      updatedPartialHistory = [...updatedPartialHistory, historyEntry];
    }

    // Determine if all items are fully returned
    const allReturned = updatedItems.length > 0 && updatedItems.every(it => {
      const rented = parseInt(it.rentedQuantity) || 0;
      const returned = parseInt(it.returnedQuantity) || 0;
      return returned >= rented;
    });

    // Decide status if not explicitly FULL
    const computedStatus = req.body.invoiceType === 'FULL'
      ? 'COMPLETED'
      : (allReturned ? 'COMPLETED' : 'PARTIAL_RETURN');

    // Prepare update data with proper payment calculations
    const updateData = {
      ...req.body,
      paymentDetails: {
        ...existingInvoice.paymentDetails,
        damageCharges: damageCharges,
        // Keep totalRentAmount as is; this is lifecycle total
        totalRentAmount: existingInvoice.paymentDetails?.totalRentAmount || existingInvoice.totalAmount || 0,
        // Advance reduced by partial event first
        advanceAmount: newAdvance,
        // Paid increases by what we collected now (beyond advance)
        paidAmount: newPaidAmount,
        outstandingAmount: newOutstandingAmount,
        finalAmount: existingInvoice.paymentDetails?.finalAmount || existingInvoice.totalAmount || 0
      },
      // Update rental status based on invoice type
      rentalDetails: {
        ...existingInvoice.rentalDetails,
        ...req.body.rentalDetails,
        status: computedStatus
      },
      // Preserve or append partial return history
      partialReturnHistory: updatedPartialHistory,
      // Add update timestamp
      lastUpdated: new Date(),
      // Persist updated items with cumulative returned quantities
      items: updatedItems
    };

    try {
      console.log('Status DEBUG:', {
        requestedType: req.body.invoiceType,
        computedStatus,
        allReturned,
      });
    } catch {}
    

   
    
    // Update the invoice
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    // Build remaining items summary (derived, not persisted)
    const remainingSummary = (updatedInvoice.items || []).map((it) => {
      const rented = parseInt(it.rentedQuantity) || 0;
      const returned = parseInt(it.returnedQuantity) || 0;
      const remaining = Math.max(0, rented - returned);
      return {
        productName: it.productName,
        remainingQuantity: remaining,
        accruesFrom: remaining > 0 ? it.startDate : null
      };
    }).filter(r => r.remainingQuantity > 0);

    // Partial totals (derived for this event)
    const partialTotals = {
      subtotal: Number(partialSubtotal.toFixed(2)),
      cgstRate: parseFloat(existingInvoice.cgstRate || 0),
      sgstRate: parseFloat(existingInvoice.sgstRate || 0),
      ugstRate: parseFloat(existingInvoice.ugstRate || 0),
      igstRate: parseFloat(existingInvoice.igstRate || 0),
      taxAmount: Number((partialTotal - partialSubtotal).toFixed(2)),
      total: Number(partialTotal.toFixed(2)),
      usedAdvance: Number(((originalAdvance - (updateData.paymentDetails.advanceAmount || 0)) || 0).toFixed(2)),
      collectedNow: Number((newPaidAmount - alreadyPaid).toFixed(2)),
      remainingAdvance: Number((updateData.paymentDetails.advanceAmount || 0).toFixed(2)),
      outstandingAmount: updateData.paymentDetails.outstandingAmount
    };

    res.json({
      success: true,
      message: `Rental invoice updated successfully (${req.body.invoiceType || 'UPDATE'})`,
      data: updatedInvoice,
      remainingSummary,
      partialTotals
    });
    
  } catch (error) {
    console.error('❌ Error updating rental invoice:', error);
    res.status(400).json({
      success: false,
      error: error.message,
      details: error.errors || 'Unknown error'
    });
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