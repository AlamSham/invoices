import RentalInvoice from '../models/RentalInvoice.js'

const ymd = (d) => new Date(d).toISOString().split('T')[0]
const addDays = (dateStr, days = 1) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return ymd(d)
}
const daysInclusive = (start, end) => {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  const ms = e.getTime() - s.getTime()
  const d = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1
  return Math.max(0, d)
}

export const getRentalDetails = async (req, res) => {
  try {
    const { id } = req.params
    const inv = await RentalInvoice.findById(id)
    if (!inv) return res.status(404).json({ success: false, message: 'Not found' })
    return res.json({ success: true, data: inv })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}

export const updatePartialReturn = async (req, res) => {
  try {
    const { id } = req.params // parent invoice id
    const body = req.body || {}
    const additionalPayment = Number(body.additionalPayment || 0)

    const parent = await RentalInvoice.findById(id)
    if (!parent) return res.status(404).json({ success: false, message: 'Parent invoice not found' })

    // Clone a working copy to avoid accidental mutation
    const inv = parent

    const returnedItemsHistory = []
    let eventSubtotal = 0

    // Build a quick map for DB items by _id (preferred) or productName fallback
    const dbItemsById = new Map()
    inv.items.forEach((it) => {
      if (it._id) dbItemsById.set(String(it._id), it)
    })

    const payloadItems = Array.isArray(body.items) ? body.items : []

    // Compute partial event from returned items only
    for (const pItem of payloadItems) {
      const key = pItem._id ? String(pItem._id) : null
      const dbItem = (key && dbItemsById.get(key)) || inv.items.find(i => i.productName === pItem.productName)
      if (!dbItem) continue

      const returnedQty = Number(pItem.returnedQuantity || 0)
      if (returnedQty <= 0) continue

      const startDate = dbItem.startDate || pItem.startDate || inv.rentalDetails?.startDate
      const prDate = pItem.partialReturnDate || dbItem.partialReturnDate || ymd(new Date())
      const days = daysInclusive(startDate, prDate)
      const rate = Number(dbItem.dailyRate || pItem.dailyRate || 0)
      const lineBase = returnedQty * rate * days

      eventSubtotal += lineBase
      returnedItemsHistory.push({
        productName: dbItem.productName,
        returnedQuantity: returnedQty,
        amount: lineBase,
      })
    }

    // Taxes for this event
    const cgst = Number(inv.cgstRate || 0)
    const sgst = Number(inv.sgstRate || 0)
    const ugst = Number(inv.ugstRate || 0)
    const igst = Number(inv.igstRate || 0)

    const taxAmount = (eventSubtotal * (cgst + sgst + ugst + igst)) / 100
    const eventTotal = eventSubtotal + taxAmount

    // Settlement
    const remainingAdvanceBefore = Number(inv.paymentDetails?.advanceAmount || 0)
    const usedAdvance = Math.min(remainingAdvanceBefore, eventTotal)
    const afterAdvance = eventTotal - usedAdvance
    const collectedNow = Math.min(additionalPayment, afterAdvance)

    // Update payment details
    const newRemainingAdvance = remainingAdvanceBefore - usedAdvance
    const prevPaid = Number(inv.paymentDetails?.paidAmount || 0)
    const newPaid = prevPaid + collectedNow

    const prevOutstanding = Number(inv.paymentDetails?.outstandingAmount || 0)
    // Incremental: reduce outstanding by the amounts settled now (advance used + cash collected)
    const newOutstanding = Math.max(0, prevOutstanding - (usedAdvance + collectedNow))

    inv.paymentDetails.advanceAmount = newRemainingAdvance
    inv.paymentDetails.paidAmount = newPaid
    inv.paymentDetails.outstandingAmount = newOutstanding
    // Do NOT inflate finalAmount/totalRentAmount here; keep original totals

    // Update items cumulative returnedQuantity and last partialReturnDate
    for (const pItem of payloadItems) {
      const key = pItem._id ? String(pItem._id) : null
      const dbItem = (key && dbItemsById.get(key)) || inv.items.find(i => i.productName === pItem.productName)
      if (!dbItem) continue
      const returnedQty = Number(pItem.returnedQuantity || 0)
      if (returnedQty > 0) {
        dbItem.returnedQuantity = Number(dbItem.returnedQuantity || 0) + returnedQty
        dbItem.partialReturnDate = pItem.partialReturnDate || dbItem.partialReturnDate || ymd(new Date())
      }
    }

    // Partial return history entry
    const historyEntry = {
      returnDate: ymd(new Date()),
      returnedItems: returnedItemsHistory,
      subtotal: eventSubtotal,
      taxAmount,
      total: eventTotal,
      usedAdvance,
      collectedNow,
      remainingAdvance: newRemainingAdvance,
      outstandingAfter: newOutstanding,
    }
    inv.partialReturnHistory = inv.partialReturnHistory || []
    inv.partialReturnHistory.push(historyEntry)

    // Remaining summary: compute remaining quantities and accrual start (day after last partial)
    const remainingSummary = inv.items.map((it) => {
      const rented = Number(it.rentedQuantity || 0)
      const returned = Number(it.returnedQuantity || 0)
      const remaining = Math.max(0, rented - returned)
      const accruesFrom = remaining > 0 && it.partialReturnDate ? addDays(it.partialReturnDate, 1) : ''
      return { productName: it.productName, remainingQuantity: remaining, accruesFrom }
    })

    await inv.save()

    const partialTotals = {
      subtotal: eventSubtotal,
      taxAmount,
      total: eventTotal,
      usedAdvance,
      collectedNow,
      remainingAdvance: newRemainingAdvance,
      outstandingAmount: newOutstanding,
    }

    return res.json({ success: true, data: inv, partialTotals, remainingSummary })
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message })
  }
}
