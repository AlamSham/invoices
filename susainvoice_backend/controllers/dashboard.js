import Invoice from '../models/invoices.js';
import Company from '../models/company.js';

// GET /api/dashboard/summary?companyId=optional
export const getDashboardSummary = async (req, res) => {
  try {
    const { companyId } = req.query || {};

    const match = {};
    if (companyId) {
      match.companyId = companyId;
    }

    // Parallel queries
    const [
      totalCompanies,
      totalInvoices,
      invoiceTypeAgg,
      statusAgg,
      totalRevenueAgg,
      outstandingAgg,
      recentInvoices
    ] = await Promise.all([
      Company.countDocuments({}),
      Invoice.countDocuments(companyId ? { companyId } : {}),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: '$invoiceType', count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: '$rentalDetails.status', count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } }
      ]),
      Invoice.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$paymentDetails.outstandingAmount', 0] } } } }
      ]),
      Invoice.find(match)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('_id invoiceNumber invoiceType totalAmount Date billTo.name rentalDetails.status')
        .lean()
    ]);

    const typeCounts = invoiceTypeAgg.reduce((acc, cur) => {
      acc[cur._id || 'UNKNOWN'] = cur.count;
      return acc;
    }, {});

    const statusCounts = statusAgg.reduce((acc, cur) => {
      acc[cur._id || 'UNKNOWN'] = cur.count;
      return acc;
    }, {});

    const summary = {
      totalCompanies,
      totalInvoices,
      advanceInvoices: typeCounts['ADVANCE'] || 0,
      partialInvoices: typeCounts['PARTIAL'] || 0,
      fullInvoices: typeCounts['FULL'] || 0,
      activeRentals: statusCounts['ACTIVE'] || 0,
      partialReturnRentals: statusCounts['PARTIAL_RETURN'] || 0,
      completedRentals: statusCounts['COMPLETED'] || 0,
      totalRevenue: (totalRevenueAgg[0]?.total || 0),
      totalOutstanding: (outstandingAgg[0]?.total || 0),
      recentInvoices
    };

    return res.json({ success: true, data: summary });
  } catch (err) {
    console.error('Dashboard summary error:', err);
    return res.status(500).json({ success: false, message: 'Server error', error: err?.message });
  }
};
