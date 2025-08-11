import express from 'express';
import { getDashboardSummary } from '../controllers/dashboard.js';

const router = express.Router();

// GET /api/dashboard/summary?companyId=optional
router.get('/summary', getDashboardSummary);

export default router;
