import express from 'express';
import {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from '../controllers/company.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/add',auth, createCompany);
router.get('/getAll',auth, getAllCompanies);
router.get('/getById/:id',auth, getCompanyById);
router.put('/updateById/:id',auth, updateCompany);
router.delete('/deleteById/:id',auth, deleteCompany);

export default router;
