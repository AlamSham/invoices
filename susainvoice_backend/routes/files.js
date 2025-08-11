// routes/fileRoutes.js
import express from 'express';
import {
  createFileRecord,
  getAllFiles,
  getFileById,
  updateFileRecord,
  deleteFileRecord,
  filterFiles
} from '../controllers/files.js';
import uploadMiddleware from '../middlewares/uploadMiddleware.js';
import auth from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create
router.post('/upload',auth, uploadMiddleware.array('files', 10), createFileRecord);

// Read
router.get('/getAll',auth, getAllFiles);
router.get('/getById/:id',auth, getFileById);

// Update
router.put('/update/:id',auth, uploadMiddleware.array('files', 10), updateFileRecord);

// Delete
router.delete('/delete/:id',auth, deleteFileRecord);

// Fast Query
router.get('/filter',auth, filterFiles);

export default router;
