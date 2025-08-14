"use client"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
// import stamp from "../../assets/stamp.png"

export default function PartialReturn() {
  const { invoiceId: parentInvoiceId } = useParams<{ invoiceId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  // const [currentPDFType, setCurrentPDFType] = useState<'TAX' | 'PROFORMA' | null>(null)

  const [companyDetails] = useState<CompanyDetails>({
    name: "MAHIPAL SINGH TIMBER",
    address: "PLOT NO-25, GALI NO-E8, NEAR JAGAR CHOWK, RAM COLONY,, Faridabad, Faridabad, Haryana, 121004",
    gstin: ": 06BROPG0987J3ZA",
    // pan: "AAYCS5019E",
    phone: "+91 87000 77386",
    email: "Garvsingh1619@gmail.com",
    logo: logo,
    // stamp: stamp,
  })

  // Server-computed metadata for full record keeping (no UI calc)
  const [partialTotals, setPartialTotals] = useState<any | null>(null)
  const [remainingSummary, setRemainingSummary] = useState<any[] | null>(null)
  const [partialHistory, setPartialHistory] = useState<any[] | null>(null)
  const [originalAdvanceAmount, setOriginalAdvanceAmount] = useState<number>(0)

  const [invoiceData, setInvoiceData] = useState<RentalInvoiceData>({
    invoiceNumber: "001",
    Date: new Date().toISOString().split("T")[0],
    dueDate: "",
    poNumber: "",
    billTo: {
      name: "",
      address: "",
      gstin: "",
    },
    shipTo: {
      name: "",
      address: "",
    },
    items: [
      {
        productName: '',
        duration: '',
        durationUnit: 'days',
        amount: '',
        rentedQuantity: '',
        returnedQuantity: '',
        dailyRate: '',
        totalDays: '',
        rentAmount: '',
        startDate: '',
        endDate: '',
        partialReturnDate: '',
      },
    ],
    subtotal: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    ugstRate: 0,
    ugstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalTaxAmount: 0,
    totalAmount: 0,
    paymentTerms:
      "Net 30 Days from invoice date\nPayment via NEFT/RTGS/Cheque\nDelayed payments subject to 1.5% monthly interest",
    termsConditions:
      "Warranty provided by principal company only\nGoods once sold will not be taken back\nAll disputes subject to Delhi jurisdiction",
    bankDetails: {
      bankName: "Yes Bank Limited",
      accountName: "Your Business Pvt.Ltd",
      accountNumber: "038263400000072",
      ifscCode: "YESB0000382",
    },
    rentalDetails: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: "",
      totalDays: '',
      status: "ACTIVE",
    },
    paymentDetails: {
      totalRentAmount: 0,
      advanceAmount: '',
      paidAmount: 0,
      outstandingAmount: 0,
      refundAmount: 0,
      finalAmount: 0,
    },
    invoiceType: 'PARTIAL',
  })

  // Fetch parent invoice data
  const fetchParentInvoice = async () => {
    if (!parentInvoiceId) return
    
    try {
      
      const response = await axios.get(
        `https://invoices-dk2w.onrender.com/api/invoice/rental/details/${parentInvoiceId}`
      )
      
      if (response.data.success) {
        const parent = response.data.data
        
        // Populate all fields with parent invoice data
        setInvoiceData({
          invoiceNumber: `PARTIAL-${parent.invoiceNumber}`,
          Date: new Date().toISOString().split("T")[0],
          dueDate: parent.dueDate || "",
          poNumber: parent.poNumber || "",
          billTo: parent.billTo,
          shipTo: parent.shipTo,
          items: parent.items.map((item: any) => ({
            ...item,
            // preserve already returned so far for validation in UI
            originalReturnedQuantity: item.returnedQuantity || 0,
            returnedQuantity: '',
            partialReturnDate: '',
          })),
          subtotal: parent.subtotal || 0,
          cgstRate: parent.cgstRate || 9,
          cgstAmount: parent.cgstAmount || 0,
          sgstRate: parent.sgstRate || 9,
          sgstAmount: parent.sgstAmount || 0,
          ugstRate: parent.ugstRate || 0,
          ugstAmount: parent.ugstAmount || 0,
          igstRate: parent.igstRate || 0,
          igstAmount: parent.igstAmount || 0,
          totalTaxAmount: parent.totalTaxAmount || 0,
          totalAmount: parent.totalAmount || 0,
          paymentTerms: parent.paymentTerms || "Net 30 Days from invoice date",
          termsConditions: parent.termsConditions || "Warranty provided by principal company only",
          bankDetails: parent.bankDetails,
          rentalDetails: {
            ...parent.rentalDetails,
            status: "PARTIAL_RETURN",
          },
          paymentDetails: parent.paymentDetails,
          invoiceType: 'PARTIAL',
        })
        // Keep a copy of parent's original advance for display purposes in UI
        setOriginalAdvanceAmount(Number(parent?.paymentDetails?.advanceAmount || 0))
        
      }
    } catch (error: any) {
      alert("Error loading parent invoice details")
    }
  }



  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchParentInvoice()
      setIsLoading(false)
    }

    initializeData()
  }, [parentInvoiceId])

  const updateInvoiceData = (path: string, value: any) => {
    // Debug console logs
    
    setInvoiceData(prev => {
      const keys = path.split('.')
      const newData = { ...prev }
      let current: any = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      // Debug: Log the updated data
      if (path.includes('endDate')) {
        // debug removed
      }
      
      return newData
    })
  }

  const calculateAmounts = () => {
    setInvoiceData(prev => {
      const subtotal = prev.items.reduce((sum, i) => {
        const amount = typeof i.amount === 'string' ? parseFloat(i.amount) || 0 : i.amount || 0
        return sum + amount
      }, 0)
      const cgst = (subtotal * prev.cgstRate) / 100
      const sgst = (subtotal * prev.sgstRate) / 100
      const ugst = (subtotal * prev.ugstRate) / 100
      const igst = (subtotal * prev.igstRate) / 100
      const totalTax = cgst + sgst + ugst + igst
      return {
        ...prev,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: subtotal + totalTax,
      }
    })
  }
  
  useEffect(() => {
    calculateAmounts()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Prepare payload for PARTIAL update
      const { paymentTerms, rentalDetails, ...invoiceDataWithoutUnused } = invoiceData
      
      // Filter out empty endDate fields from items
      const today = new Date().toISOString().split('T')[0]
      const cleanedItems = invoiceDataWithoutUnused.items.map(item => {
        const cleanedItem: any = { ...item }
        // Remove endDate if it's empty
        if (!cleanedItem.endDate || cleanedItem.endDate.trim() === '') {
          delete cleanedItem.endDate
        }
        // Remove startDate if it's empty
        if (!cleanedItem.startDate || cleanedItem.startDate.trim() === '') {
          delete cleanedItem.startDate
        }
        // Ensure partialReturnDate is set for items being returned
        const retQty = typeof cleanedItem.returnedQuantity === 'string' ? parseFloat(cleanedItem.returnedQuantity) || 0 : cleanedItem.returnedQuantity || 0
        if (retQty > 0 && (!cleanedItem.partialReturnDate || cleanedItem.partialReturnDate.trim() === '')) {
          cleanedItem.partialReturnDate = today
        }
        // Coerce numeric fields to numbers for backend persistence
        cleanedItem.rentedQuantity = typeof cleanedItem.rentedQuantity === 'string' ? parseFloat(cleanedItem.rentedQuantity) || 0 : (cleanedItem.rentedQuantity || 0)
        cleanedItem.returnedQuantity = typeof cleanedItem.returnedQuantity === 'string' ? parseFloat(cleanedItem.returnedQuantity) || 0 : (cleanedItem.returnedQuantity || 0)
        cleanedItem.dailyRate = typeof cleanedItem.dailyRate === 'string' ? parseFloat(cleanedItem.dailyRate) || 0 : (cleanedItem.dailyRate || 0)
        cleanedItem.totalDays = typeof cleanedItem.totalDays === 'string' ? parseFloat(cleanedItem.totalDays) || 0 : (cleanedItem.totalDays || 0)
        cleanedItem.amount = typeof cleanedItem.amount === 'string' ? parseFloat(cleanedItem.amount) || 0 : (cleanedItem.amount || cleanedItem.rentAmount || 0)
        return cleanedItem
      })
      
      // Map UI partial payment input to server contract: additionalPayment
      const additionalPayment = Number(invoiceData.paymentDetails?.paidAmount || 0) || 0

      // Compute preview sum for remaining items so we can include it in saved totals
      const msPerDay = 24 * 60 * 60 * 1000
      const addDaysLocal = (dateStr: string, n: number) => {
        const d = new Date(dateStr)
        d.setDate(d.getDate() + n)
        return d.toISOString().split('T')[0]
      }
      const daysBetweenInclusive = (start: string, end: string) => {
        const s = new Date(start)
        const e = new Date(end)
        if (e <= s) return 0
        return Math.floor((e.getTime() - s.getTime()) / msPerDay) + 1
      }
      const previewDetails: Array<{ productName: string; remainingQuantity: number; accruesFrom: string; endDate: string; days: number; dailyRate: number; previewAmount: number }> = []
      const previewSum = (cleanedItems || []).reduce((sum: number, item: any) => {
        const rentedQty = typeof item.rentedQuantity === 'string' ? parseFloat(item.rentedQuantity) || 0 : item.rentedQuantity || 0
        const originalReturned = typeof item.originalReturnedQuantity === 'string' ? parseFloat(item.originalReturnedQuantity) || 0 : (item.originalReturnedQuantity || 0)
        const retNow = typeof item.returnedQuantity === 'string' ? parseFloat(item.returnedQuantity) || 0 : item.returnedQuantity || 0
        const remaining = Math.max(0, rentedQty - originalReturned - retNow)
        if (retNow <= 0 || remaining <= 0) return sum
        const accruesFrom = item.partialReturnDate ? addDaysLocal(item.partialReturnDate, 1) : ''
        let previewDays = 0
        if ((accruesFrom || item.startDate) && item.endDate) {
          previewDays = daysBetweenInclusive((accruesFrom || item.startDate) as string, item.endDate)
        }
        const rate = typeof item.dailyRate === 'string' ? parseFloat(item.dailyRate) || 0 : item.dailyRate || 0
        const previewAmount = Math.max(0, remaining) * Math.max(0, rate) * Math.max(0, previewDays)
        previewDetails.push({
          productName: item.productName || '-',
          remainingQuantity: remaining,
          accruesFrom: (accruesFrom || (item.startDate || '')) as string,
          endDate: item.endDate || '',
          days: previewDays,
          dailyRate: rate,
          previewAmount,
        })
        return sum + previewAmount
      }, 0)

      // Sanitize totals and payment details to ensure numbers are sent
      const baseSubtotal = Number(invoiceDataWithoutUnused.subtotal || 0)
      const subtotalWithPreview = baseSubtotal + Number(previewSum || 0)
      const cgstRateNum = Number(invoiceDataWithoutUnused.cgstRate || 0)
      const sgstRateNum = Number(invoiceDataWithoutUnused.sgstRate || 0)
      const ugstRateNum = Number(invoiceDataWithoutUnused.ugstRate || 0)
      const igstRateNum = Number(invoiceDataWithoutUnused.igstRate || 0)
      const totalTaxRate = cgstRateNum + sgstRateNum + ugstRateNum + igstRateNum
      const taxAmountWithPreview = (subtotalWithPreview * totalTaxRate) / 100
      const totalWithPreview = subtotalWithPreview + taxAmountWithPreview
      const sanitizedTotals = {
        subtotal: subtotalWithPreview,
        cgstRate: cgstRateNum,
        cgstAmount: (subtotalWithPreview * cgstRateNum) / 100,
        sgstRate: sgstRateNum,
        sgstAmount: (subtotalWithPreview * sgstRateNum) / 100,
        ugstRate: ugstRateNum,
        ugstAmount: (subtotalWithPreview * ugstRateNum) / 100,
        igstRate: igstRateNum,
        igstAmount: (subtotalWithPreview * igstRateNum) / 100,
        totalTaxAmount: taxAmountWithPreview,
        totalAmount: totalWithPreview,
      }

      const pd: NonNullable<RentalInvoiceData['paymentDetails']> =
        (invoiceDataWithoutUnused.paymentDetails as NonNullable<RentalInvoiceData['paymentDetails']>) ?? {
          totalRentAmount: 0,
          advanceAmount: 0,
          paidAmount: 0,
          outstandingAmount: 0,
          refundAmount: 0,
          finalAmount: 0,
          damageCharges: 0,
        }
      const sanitizedPaymentDetails = {
        totalRentAmount: Number(pd.totalRentAmount || sanitizedTotals.totalAmount || 0),
        advanceAmount: Number(pd.advanceAmount || 0),
        paidAmount: Number(pd.paidAmount || 0),
        outstandingAmount: Number(pd.outstandingAmount || 0),
        refundAmount: Number(pd.refundAmount || 0),
        finalAmount: Number(pd.finalAmount || sanitizedTotals.totalAmount || 0),
        damageCharges: Number(pd.damageCharges || 0),
      }

      const requestData = {
        ...invoiceDataWithoutUnused,
        ...sanitizedTotals,
        paymentDetails: sanitizedPaymentDetails,
        items: cleanedItems,
        additionalPayment,
        // Client-side preview details for backend to persist with this partial event
        previewRemainingSummary: previewDetails,
        clientPreview: true,
        // Don't send companyId - it should remain unchanged from original invoice
        invoiceType: 'PARTIAL' // PARTIAL for partial return invoices
      }
      
      // Console log the complete payload for verification
      console.log('Saving PARTIAL return payload:', JSON.parse(JSON.stringify(requestData)))
      
      // Update existing invoice with partial return data
      const response = await axios.put(
        `https://invoices-dk2w.onrender.com/api/invoice/rental/update/${parentInvoiceId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.data.success) {
        // Update local invoice snapshot with server truth
        if (response.data.data) {
          setInvoiceData(prev => ({
            ...prev,
            ...response.data.data,
          }) as any)
          // capture updated history from server
          setPartialHistory(response.data.data.partialReturnHistory || null)
        }
        // Capture derived summaries for display
        setPartialTotals(response.data.partialTotals || null)
        setRemainingSummary(response.data.remainingSummary || null)
        alert(`Partial return saved successfully!`)
        setIsEditingMode(false)
      }
    } catch (error) {
      alert('Error saving invoice. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "18px", color: "#4b5563" }}>Loading invoice data...</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "16px" }}>
      <div
        id="invoice-container"
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Arial', sans-serif",
          fontSize: isEditingMode ? "14px" : "12px",
          lineHeight: "1.4",
          color: "#000",
          padding: "20px",
          position: "relative",
        }}
      >


        {/* Invoice Type Header */}
        <div
          style={{ color: "#2563eb", fontWeight: "bold", fontSize: "18px", marginBottom: "16px", marginLeft: "200px" }}
        >
          PARTIAL RETURN INVOICE
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType="PARTIAL"
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={false}
          invoiceType="PARTIAL"
          originalAdvanceAmount={originalAdvanceAmount}
        />

        {/* Server-side Partial Event Summary */}
        {partialTotals && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>This Partial Event Summary (Server)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <div>Subtotal: ₹{partialTotals.subtotal?.toFixed?.(2) ?? partialTotals.subtotal}</div>
              <div>Tax: ₹{partialTotals.taxAmount?.toFixed?.(2) ?? partialTotals.taxAmount}</div>
              <div>Total: ₹{partialTotals.total?.toFixed?.(2) ?? partialTotals.total}</div>
              {(() => {
                const usedAdv = Number(partialTotals.usedAdvance || 0)
                const remAdv = Number(partialTotals.remainingAdvance || 0)
                const originalAdv = usedAdv + remAdv
                return (
                  <>
                    <div>Advance Taken (Original): ₹{originalAdv}</div>
                    <div>Advance Remaining: ₹{remAdv}</div>
                    <div>Used Advance This Event: ₹{usedAdv}</div>
                  </>
                )
              })()}
              <div>Collected Now: ₹{partialTotals.collectedNow}</div>
              <div>Outstanding: ₹{partialTotals.outstandingAmount}</div>
            </div>
          </div>
        )}

        {/* Remaining Items Summary */}
        {remainingSummary && remainingSummary.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Remaining Items (Accrues From)</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Item</th>
                  <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Remaining</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Accrues From</th>
                </tr>
              </thead>
              <tbody>
                {remainingSummary.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ padding: 6, borderBottom: '1px solid #f3f4f6' }}>{r.productName}</td>
                    <td style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{r.remainingQuantity}</td>
                    <td style={{ padding: 6, borderBottom: '1px solid #f3f4f6' }}>{r.accruesFrom || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Partial Return History (from server) */}
        {partialHistory && partialHistory.length > 0 && (
          <div id="partial-return-history" style={{ marginTop: 16, padding: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Partial Return History</div>
            {partialHistory.map((h: any, idx: number) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>Return Date: {h.returnDate}</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Item</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Returned Qty</th>
                      <th style={{ textAlign: 'right', borderBottom: '1px solid #e5e7eb', padding: 6 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(h.returnedItems || []).map((ri: any, rIdx: number) => (
                      <tr key={rIdx}>
                        <td style={{ padding: 6, borderBottom: '1px solid #f3f4f6' }}>{ri.productName}</td>
                        <td style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>{ri.returnedQuantity}</td>
                        <td style={{ padding: 6, textAlign: 'right', borderBottom: '1px solid #f3f4f6' }}>₹{ri.partialAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {typeof h.partialPayment === 'number' && (
                  <div style={{ marginTop: 4 }}>Partial Payment Collected: ₹{h.partialPayment}</div>
                )}
                {h.notes && <div style={{ color: '#6b7280' }}>{h.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      <RentalActions
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
        handleSave={handleSave}
        isSaving={isSaving}
        showPhysicalToggle={false}
      />
    </div>
  )
}

