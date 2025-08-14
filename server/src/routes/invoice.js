import { Router } from 'express'
import { getRentalDetails, updatePartialReturn } from '../controllers/rentalInvoiceController.js'

const router = Router()

router.get('/rental/details/:id', getRentalDetails)
router.put('/rental/update/:id', updatePartialReturn)

export default router
