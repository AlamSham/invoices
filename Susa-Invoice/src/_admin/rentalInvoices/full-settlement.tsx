"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"

import axios from "axios"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"
import { daysBetween, addDays } from "./date-utils"

// Local date formatter (dd/MM/yyyy)
const formatDate = (s?: string) => {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

export default function FullSettlement() {
  const { invoiceId: parentInvoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [isEditingMode, setIsEditingMode] = useState(true)
  const [isPhysicalCopy, setIsPhysicalCopy] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const [companyDetails] = useState<CompanyDetails>({
    name: "MAHIPAL SINGH TIMBER",
    address: "PLOT NO-25, GALI NO-E8, NEAR JAGAR CHOWK, RAM COLONY,, Faridabad, Faridabad, Haryana, 121004",
    gstin: ": 06BROPG0987J3ZA",
    // pan: "AAYCS5019E",
    phone: "+91 87000 77386",
    email: "Garvsingh1619@gmail.com",
    logo: logo,
    stamp: stamp,
  })
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
        bankName: "Punjab National Bank",
        accountName: "MAHIPAL SINGH TIMBER",
        accountNumber: "1653202100003292",
        ifscCode: "PUNB0165320",
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
    invoiceType: 'FULL',
  })

  // Final payment state for full settlement
  const [finalPayment, setFinalPayment] = useState(0)
  // Damage charges state (computed from items)
  const [totalDamageCharges, setTotalDamageCharges] = useState(0)

  // Fetch parent invoice data
  const fetchParentInvoice = async () => {
    if (!parentInvoiceId) return
    
    try {
      const token = localStorage.getItem("refreshToken")
      
      const response = await axios.get(
        `https://invoices-dk2w.onrender.com/api/invoice/rental/details/${parentInvoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success) {
        const parent = response.data.data
        
        // Build items with final accrual preview and compute totals
        let subtotalSum = 0
        const builtItems = parent.items.map((item: any) => {
          const rented = typeof item.rentedQuantity === 'string' ? parseInt(item.rentedQuantity) || 0 : item.rentedQuantity || 0
          const alreadyReturned = typeof item.returnedQuantity === 'string' ? parseInt(item.returnedQuantity) || 0 : item.returnedQuantity || 0
          const remaining = Math.max(0, rented - alreadyReturned)
          // find last partial return date for this product
          let lastReturnDate: string | undefined
          const prh: any[] = parent.partialReturnHistory || []
          prh.forEach((entry: any) => {
            const retDate = entry.returnDate || entry.createdAt
            ;(entry.returnedItems || []).forEach((ri: any) => {
              if ((ri.productName || '') === (item.productName || '')) {
                const q = typeof ri.returnedQuantity === 'string' ? parseFloat(ri.returnedQuantity) || 0 : ri.returnedQuantity || 0
                if (q > 0 && retDate) {
                  if (!lastReturnDate || new Date(retDate) > new Date(lastReturnDate)) lastReturnDate = retDate
                }
              }
            })
          })
          // Fallback: infer virtual partial return from current item's fields when history is empty
          if (!lastReturnDate) {
            const inferredQty = typeof item.returnedQuantity === 'string' ? parseFloat(item.returnedQuantity) || 0 : item.returnedQuantity || 0
            const inferredDate = item.partialReturnDate || ''
            if (inferredQty > 0 && inferredDate) {
              lastReturnDate = inferredDate
            }
          }
          // Accrual starts from the later of startDate and day-after-last-partial
          const dayAfterLast = lastReturnDate ? addDays(lastReturnDate, 1) : ''
          const rawStart = item.startDate || ''
          let accruesFrom = rawStart || dayAfterLast
          if (rawStart && dayAfterLast) {
            accruesFrom = new Date(dayAfterLast) > new Date(rawStart) ? dayAfterLast : rawStart
          } else if (dayAfterLast) {
            accruesFrom = dayAfterLast
          }
          const endDate = item.endDate || ''
          const days = accruesFrom && endDate ? daysBetween(accruesFrom, endDate) : 0
          const rate = typeof item.dailyRate === 'string' ? parseFloat(item.dailyRate) || 0 : item.dailyRate || 0
          const computedAmount = Math.max(0, remaining) * Math.max(0, rate) * Math.max(0, days)
          subtotalSum += computedAmount
          return {
            ...item,
            originalReturnedQuantity: alreadyReturned,
            rentedQuantity: remaining,
            returnedQuantity: '',
            partialReturnDate: '',
            // Preview should reflect extension-only window
            startDate: accruesFrom,
            endDate: endDate,
            totalDays: days || 0,
            rentAmount: computedAmount || 0,
            amount: computedAmount || 0,
          }
        })

        const cgstRate = parent.cgstRate ?? 9
        const sgstRate = parent.sgstRate ?? 9
        const ugstRate = parent.ugstRate ?? 0
        const igstRate = parent.igstRate ?? 0
        const cgstAmount = (subtotalSum * cgstRate) / 100
        const sgstAmount = (subtotalSum * sgstRate) / 100
        const ugstAmount = (subtotalSum * ugstRate) / 100
        const igstAmount = (subtotalSum * igstRate) / 100
        const totalTaxAmount = cgstAmount + sgstAmount + ugstAmount + igstAmount
        const totalAmount = subtotalSum + totalTaxAmount

        // Populate all fields with computed data
        const parentPaid = typeof parent.paymentDetails?.paidAmount === 'string' ? parseFloat(parent.paymentDetails?.paidAmount) || 0 : parent.paymentDetails?.paidAmount || 0
        const parentAdvance = typeof parent.paymentDetails?.advanceAmount === 'string' ? parseFloat(parent.paymentDetails?.advanceAmount) || 0 : parent.paymentDetails?.advanceAmount || 0
        const parentOriginalAdvance = ((): number => {
          const raw = (parent.paymentDetails as any)?.originalAdvanceAmount
          if (typeof raw === 'string') return parseFloat(raw) || parentAdvance || 0
          if (typeof raw === 'number') return raw
          return parentAdvance || 0
        })()
        const previewFinal = Math.max(0, subtotalSum + totalTaxAmount)
        // IMPORTANT: Server is source of truth for outstanding; do NOT recompute as total - paid here
        const serverOutstanding = typeof parent.paymentDetails?.outstandingAmount === 'string' ? parseFloat(parent.paymentDetails?.outstandingAmount) || 0 : parent.paymentDetails?.outstandingAmount || 0
        const previewOutstanding = serverOutstanding

        setInvoiceData({
          invoiceNumber: `FULL-${parent.invoiceNumber}`,
          Date: new Date().toISOString().split("T")[0],
          dueDate: parent.dueDate || "",
          poNumber: parent.poNumber || "",
          billTo: parent.billTo,
          shipTo: parent.shipTo,
          items: builtItems,
          subtotal: subtotalSum,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          ugstRate,
          ugstAmount,
          igstRate,
          igstAmount,
          totalTaxAmount,
          totalAmount,
          paymentTerms: parent.paymentTerms || "Net 30 Days from invoice date",
          termsConditions: parent.termsConditions || "Warranty provided by principal company only",
          bankDetails: parent.bankDetails,
          rentalDetails: {
            ...parent.rentalDetails,
            status: "COMPLETED",
          },
          paymentDetails: {
            totalRentAmount: previewFinal,
            advanceAmount: parentAdvance,
            originalAdvanceAmount: parentOriginalAdvance,
            paidAmount: parentPaid,
            outstandingAmount: previewOutstanding, // use server-calculated outstanding
            refundAmount: 0,
            finalAmount: previewFinal,
          },
          partialReturnHistory: parent.partialReturnHistory || [],
          invoiceType: 'FULL',
        })
        
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

  // Recalculate total damage charges whenever item damage fields change
  useEffect(() => {
    const total = (invoiceData.items || []).reduce((sum, item) => {
      const damagedQty = typeof item.damagedQuantity === 'string' ? parseFloat(item.damagedQuantity) || 0 : item.damagedQuantity || 0
      const finePerUnit = typeof item.damageFinePerUnit === 'string' ? parseFloat(item.damageFinePerUnit) || 0 : item.damageFinePerUnit || 0
      const amt = damagedQty * finePerUnit
      return sum + amt
    }, 0)
    setTotalDamageCharges(total)
  }, [invoiceData.items])

  // Keep finalPayment clamped to due (outstanding + damages) and auto-fill on changes
  useEffect(() => {
    const due = ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))
    // Auto-fill if zero or empty; always clamp to due
    setFinalPayment(prev => {
      const val = Number(prev) || 0
      if (!val) return Math.max(0, due)
      return Math.min(Math.max(0, val), Math.max(0, due))
    })
  }, [invoiceData.paymentDetails?.outstandingAmount, totalDamageCharges])

  // Save only, then redirect to details page for PDF download
  const handleSaveOnly = async () => {
    setIsSaving(true)
    try {
      // Validate final payment before proceeding
      const dueNow = ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))
      if (finalPayment < 0 || finalPayment > Math.max(0, dueNow)) {
        alert('Final payment must be between 0 and the due amount.')
        setIsSaving(false)
        return
      }
      const token = localStorage.getItem('refreshToken')
      
      // Add companyId and type to the request payload
      const { paymentTerms, rentalDetails, ...invoiceDataWithoutUnused } = invoiceData
      
      // Filter out empty endDate fields from items
      const cleanedItems = invoiceDataWithoutUnused.items.map(item => {
        const cleanedItem = { ...item }
        // Remove endDate if it's empty
        if (!cleanedItem.endDate || cleanedItem.endDate.trim() === '') {
          delete cleanedItem.endDate
        }
        // Remove startDate if it's empty
        if (!cleanedItem.startDate || cleanedItem.startDate.trim() === '') {
          delete cleanedItem.startDate
        }
        // Ensure numeric damageAmount consistency
        const damagedQty = typeof cleanedItem.damagedQuantity === 'string' ? parseFloat(cleanedItem.damagedQuantity) || 0 : cleanedItem.damagedQuantity || 0
        const finePerUnit = typeof cleanedItem.damageFinePerUnit === 'string' ? parseFloat(cleanedItem.damageFinePerUnit) || 0 : cleanedItem.damageFinePerUnit || 0
        cleanedItem.damageAmount = damagedQty * finePerUnit
        return cleanedItem
      })
      
      // Calculate final settlement data
      const currentOutstanding = invoiceData.paymentDetails?.outstandingAmount || 0
      const damageCharges = totalDamageCharges || 0
      const finalOutstanding = Math.max(0, (currentOutstanding + damageCharges) - finalPayment)
      
      const requestData = {
        ...invoiceDataWithoutUnused,
        items: cleanedItems.map(item => {
          const rentQty = typeof item.rentedQuantity === 'string' ? parseFloat(item.rentedQuantity) || 0 : item.rentedQuantity || 0
          return {
            ...item,
            // return the remaining quantity only
            returnedQuantity: rentQty,
            partialReturnDate: new Date().toISOString().split('T')[0]
          }
        }),
        // Don't send companyId - it should remain unchanged from original invoice
        invoiceType: 'FULL', // FULL for final settlement
        paymentDetails: {
          ...invoiceDataWithoutUnused.paymentDetails,
          paidAmount: (invoiceData.paymentDetails?.paidAmount || 0) + finalPayment,
          outstandingAmount: finalOutstanding,
          damageCharges: damageCharges,
          finalPayment: finalPayment,
          settlementDate: new Date().toISOString().split('T')[0]
        },
        rentalDetails: {
          ...invoiceData.rentalDetails,
          status: "COMPLETED",
          settlementDate: new Date().toISOString().split('T')[0]
        }
      }
      
      // Console log the complete payload
      
      // Update existing invoice with partial return data
      const response = await axios.put(
        `https://invoices-dk2w.onrender.com/api/invoice/rental/update/${parentInvoiceId}`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      if (response.data.success) {
        // On success, navigate to rental details page for PDF download there
        setIsEditingMode(false)
        navigate(`/admin/rental/details/${parentInvoiceId}`)
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

  // Derive validation flags for UI state
  const dueNow = ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))
  const isSaveInvalid = (finalPayment < 0 || finalPayment > Math.max(0, dueNow))

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
          FULL SETTLEMENT INVOICE
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType="FULL"
        />

        <RentalForm
          invoiceData={invoiceData}
          // Force read-only items table in Full Settlement view
          isEditingMode={false}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={isPhysicalCopy}
          invoiceType="FULL"
        />

        {/* Partial Return History (Read-only) */}
        {(invoiceData.partialReturnHistory && invoiceData.partialReturnHistory.length > 0) && (
          <div style={{
            backgroundColor: '#ecfeff',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '2px solid #06b6d4'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#164e63', fontSize: '18px' }}> Partial Return History</h3>
            {invoiceData.partialReturnHistory.map((entry: any, idx: number) => {
              return (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '13px' }}>
                  <div><strong>Date:</strong> {formatDate(entry.returnDate)}</div>
                  {typeof entry.partialPayment === 'number' && (
                    <div><strong>Partial Payment:</strong> ₹{(entry.partialPayment || 0).toLocaleString()}</div>
                  )}
                </div>
                {entry.notes && (
                  <div style={{ fontSize: '12px', color: '#334155', marginBottom: '8px' }}><strong>Notes:</strong> {entry.notes}</div>
                )}
                {(entry.returnedItems && entry.returnedItems.length > 0) ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#cffafe' }}>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Product</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Returned Qty</th>
                          <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #67e8f9' }}>Partial Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.returnedItems.map((ri: any, rIdx: number) => (
                          <tr key={rIdx}>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd' }}>{ri.productName || `Item ${rIdx + 1}`}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd', textAlign: 'right' }}>{ri.returnedQuantity || 0}</td>
                            <td style={{ padding: '8px', borderBottom: '1px solid #bae6fd', textAlign: 'right' }}>₹{(ri.partialAmount || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Per-event totals breakdown removed for cleaner Full Settlement view */}
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No returned items recorded in this entry.</div>
                )}
              </div>
            )})}
          </div>
        )}

        {/* Damage/Fine Section */}
        {true && (
          <div style={{
            backgroundColor: '#fff7ed',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '2px solid #fb923c'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#7c2d12', fontSize: '18px' }}> Damage / Fine Details</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#ffedd5' }}>
                    <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #fdba74' }}>Product</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #fdba74' }}>Rented Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #fdba74' }}>Damaged Qty</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #fdba74' }}>Fine / Unit (₹)</th>
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #fdba74' }}>Damage Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, idx) => {
                    const rentedQty = typeof item.rentedQuantity === 'string' ? parseFloat(item.rentedQuantity) || 0 : item.rentedQuantity || 0
                    const damagedQty = typeof item.damagedQuantity === 'string' ? parseFloat(item.damagedQuantity) || 0 : item.damagedQuantity || 0
                    const finePerUnit = typeof item.damageFinePerUnit === 'string' ? parseFloat(item.damageFinePerUnit) || 0 : item.damageFinePerUnit || 0
                    const dmgAmt = damagedQty * finePerUnit
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #fde68a' }}>{item.productName || `Item ${idx + 1}`}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #fde68a', textAlign: 'right' }}>{rentedQty}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #fde68a', textAlign: 'right' }}>
                          {isEditingMode ? (
                            <input
                              type="number"
                              min={0}
                              max={rentedQty}
                              value={item.damagedQuantity as any || ''}
                              onChange={(e) => {
                                const raw = parseFloat(e.target.value) || 0
                                const clamped = Math.max(0, Math.min(raw, rentedQty))
                                setInvoiceData(prev => {
                                  const items = [...prev.items]
                                  const updated = { ...items[idx], damagedQuantity: clamped, damageAmount: (clamped) * (finePerUnit) }
                                  items[idx] = updated
                                  return { ...prev, items }
                                })
                              }}
                              style={{ width: '100%', padding: '6px', border: '1px solid #fb923c', borderRadius: '4px', backgroundColor: '#fff7ed' }}
                            />
                          ) : (
                            <span>{damagedQty}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #fde68a', textAlign: 'right' }}>
                          {isEditingMode ? (
                            <input
                              type="number"
                              min={0}
                              value={item.damageFinePerUnit as any || ''}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                setInvoiceData(prev => {
                                  const items = [...prev.items]
                                  const updated = { ...items[idx], damageFinePerUnit: val, damageAmount: (damagedQty) * (val) }
                                  items[idx] = updated
                                  return { ...prev, items }
                                })
                              }}
                              style={{ width: '100%', padding: '6px', border: '1px solid #fb923c', borderRadius: '4px', backgroundColor: '#fff7ed' }}
                            />
                          ) : (
                            <span>₹{(finePerUnit || 0).toLocaleString()}</span>
                          )}
                        </td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #fde68a', textAlign: 'right', fontWeight: 600 }}>₹{dmgAmt.toLocaleString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', padding: '10px', fontWeight: 700 }}>Total Damage Charges:</td>
                    <td style={{ textAlign: 'right', padding: '10px', fontWeight: 700, color: '#b45309' }}>₹{(totalDamageCharges || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Final Payment Section for Full Settlement */}
        {true && (
          <div style={{ 
            backgroundColor: "#f0f9ff", 
            padding: "20px", 
            borderRadius: "8px", 
            marginTop: "20px",
            border: "2px solid #0ea5e9"
          }}>
            <h3 style={{ fontWeight: "bold", marginBottom: "16px", color: "#0c4a6e", fontSize: "18px" }}>Final Settlement Payment</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "14px" }}>
              <div>
                {(() => {
                  const originalAdvance = parseFloat(String(invoiceData.paymentDetails?.originalAdvanceAmount ?? invoiceData.paymentDetails?.advanceAmount ?? 0)) || 0
                  const remainingAdvance = parseFloat(String(invoiceData.paymentDetails?.advanceAmount || 0)) || 0
                  const paidSoFarInclAdvance = originalAdvance + (invoiceData.paymentDetails?.paidAmount || 0)
                  return (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 600 }}>Advance Taken (Original):</span>
                        <span style={{ fontWeight: "bold", color: "#059669" }}>₹{originalAdvance.toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ fontWeight: 600 }}>Advance Remaining:</span>
                        <span style={{ fontWeight: "bold", color: "#16a34a" }}>₹{remainingAdvance.toLocaleString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <span style={{ fontWeight: 600 }}>Total Paid So Far (incl. Advance):</span>
                        <span style={{ fontWeight: "bold", color: "#2563eb" }}>₹{paidSoFarInclAdvance.toLocaleString()}</span>
                      </div>
                    </>
                  )
                })()}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontWeight: "600" }}>Outstanding (from previous invoices):</span>
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: (invoiceData.paymentDetails?.outstandingAmount || 0) >= 0 ? "#dc2626" : "#059669" }}>₹{(invoiceData.paymentDetails?.outstandingAmount || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Damage Charges (Total):</span>
                  <span style={{ fontWeight: "bold", color: "#b45309" }}>₹{(totalDamageCharges || 0).toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: 600 }}>Amount Due Now (Outstanding + Damages):</span>
                  <span style={{ fontWeight: "bold", color: (((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0)) || 0) >= 0 ? "#7c3aed" : "#059669" }}>₹{(((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0)) || 0).toLocaleString()}</span>
                </div>
                {/* Removed 'Final Amount (This Invoice)' to avoid confusion in Full Settlement */}
                
                <div style={{ marginBottom: "16px" }}>
                  {dueNow < 0 ? (
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '12px', border: '2px solid #22c55e', borderRadius: '6px', background: '#f0fdf4',
                      fontWeight: 700
                    }}>
                      <span style={{ color: '#14532d' }}>Refund Due to Customer:</span>
                      <span style={{ color: '#059669' }}>₹{Math.abs(dueNow).toLocaleString()}</span>
                    </div>
                  ) : (
                    <>
                      <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#0c4a6e" }}>Final Payment Amount:</label>
                      {isEditingMode ? (
                        <input
                          type="number"
                          min="0"
                          max={((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))}
                          value={finalPayment || ''}
                          onChange={(e) => {
                            const raw = parseFloat(e.target.value) || 0
                            const due = ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))
                            const clamped = Math.max(0, Math.min(raw, Math.max(0, due)))
                            setFinalPayment(clamped)
                          }}
                          style={{
                            border: "2px solid #0ea5e9",
                            padding: "12px",
                            borderRadius: "6px",
                            fontSize: "16px",
                            width: "100%",
                            backgroundColor: "#f8fafc"
                          }}
                          placeholder="Enter final settlement amount (₹)"
                        />
                      ) : (
                        <div style={{ fontWeight: 700 }}>₹{(finalPayment || 0).toLocaleString()}</div>
                      )}
                      {isSaveInvalid && (
                        <div style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626' }}>
                          Enter 0 to ₹{Math.max(0, ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0))).toLocaleString()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div>
                {dueNow < 0 ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                      <span>Refund to Customer:</span>
                      <span style={{ color: '#059669' }}>₹{Math.abs(dueNow).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 'bold', fontSize: '16px' }}>
                      <span>After Payment Outstanding:</span>
                      <span style={{ color: '#059669' }}>₹0</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      Saving will record a refund and mark rental as completed
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontWeight: "bold", fontSize: "16px" }}>
                      <span>After Payment Outstanding:</span>
                      <span style={{ color: finalPayment >= ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0)) ? "#059669" : "#dc2626" }}>
                        ₹{Math.max(0, ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0)) - finalPayment).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#f8fafc", padding: "8px", borderRadius: "4px", border: "1px solid " }}>
                       Final settlement will mark all items as returned and rental as completed
                    </div>
                    {finalPayment >= ((invoiceData.paymentDetails?.outstandingAmount || 0) + (totalDamageCharges || 0)) && (
                      <div style={{ fontSize: "12px", color: "#059669", fontWeight: "bold", marginTop: "8px", backgroundColor: "#f0fdf4", padding: "8px", borderRadius: "4px", border: "1px solid #22c55e" }}>
                        Outstanding will be fully settled!
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <RentalActions
        isEditingMode={isEditingMode}
        setIsEditingMode={setIsEditingMode}
        handleSave={handleSaveOnly}
        isPhysicalCopy={isPhysicalCopy}
        setIsPhysicalCopy={setIsPhysicalCopy}
        isSaving={isSaving}
        // Disable Save when invalid amount entered (without showing Saving...)
        saveDisabled={isSaveInvalid}
        showEditButton={true}
      />
    </div>
  )
}

