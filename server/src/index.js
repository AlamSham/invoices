import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import invoiceRouter from './routes/invoice.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/susainvoice'
const PORT = process.env.PORT || 5000

mongoose
  .connect(MONGO_URI, { dbName: process.env.MONGO_DB || 'susainvoice' })
  .then(() => {
    console.log('MongoDB connected')
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch((err) => {
    console.error('Mongo connect error:', err)
    process.exit(1)
  })

app.get('/health', (req, res) => res.json({ ok: true }))

app.use('/api/invoice', invoiceRouter)
