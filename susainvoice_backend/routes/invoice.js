import express from "express";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoiceById,
  updateRentalInvoice,
  deleteInvoiceById,
  getNextInvoiceNumber,
  getBillToList,
  searchInvoicesByIdentifier,
  getInvoiceSummaryByCompanyId,
  getRentalAnalytics
} from "../controllers/invoices.js";
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// ============= NEW RENTAL INVOICE SYSTEM ROUTES =============

// Core Invoice Operations
router.post("/add", auth, createInvoice); // Main invoice creation endpoint
router.get("/get", auth, getAllInvoices);
router.get("/getbyId/:id", auth, getInvoiceById);
router.put("/updateById/:id", auth, updateInvoiceById);
router.delete("/delete/:id", auth, deleteInvoiceById);

// Invoice Number Generation (INV-2500, INV-2501 format)
router.get("/nextInvoiceNumber", auth, getNextInvoiceNumber);

// Search and Filter Operations
router.get("/bill-to", auth, getBillToList);
router.get("/invoices/:identifier", auth, searchInvoicesByIdentifier);
router.get('/summary/:companyId', auth, getInvoiceSummaryByCompanyId);

// ============= RENTAL SPECIFIC ROUTES =============
// Main rental invoice creation (handles ADVANCE, PARTIAL, FULL types)
router.post('/rental/advance', auth, createInvoice); // Uses main createInvoice function

// Update rental invoice with partial return data
router.put('/rental/update/:id', auth, updateRentalInvoice);

// Get all rental invoices for a company
router.get('/rental/company/:companyId', auth, getInvoiceSummaryByCompanyId);

// Get specific rental invoice details by ID (for partial return)
router.get('/rental/details/:id', getInvoiceById);

// Get detailed rental analytics for advanced reporting
router.get('/rental/analytics/:companyId', auth, getRentalAnalytics);

export default router;
