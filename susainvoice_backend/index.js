import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import companyRoutes from './routes/company.js';
import invoiceRoutes from './routes/invoice.js';
import userRoutes from './routes/user.js';
import filesRoutes from './routes/files.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();

// ✅ Enable trust proxy for accurate rate limiting (important on platforms like Firebase Hosting or behind Nginx)
app.set('trust proxy', 1);

// ✅ Rate Limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: '⚠️ Too many requests from this IP, please try again later.',
});
app.use(limiter);

// ✅ CORS Setup
const allowedOrigins = ['https://invoice-65289.web.app','http://localhost:5173',"https://serene-faun-12834b.netlify.app"];
app.use(
  cors({
    origin: allowedOrigins,
  })
);

// ✅ Middlewares
app.use(express.json());
app.use(cookieParser()); // safe to keep, even if unused
app.use(express.urlencoded({ extended: true }));

// ✅ MongoDB Connection
const MONGO_URI = process.env.MONGO_URI;
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ✅ Routes
app.use('/api/companies', companyRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/user', userRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
