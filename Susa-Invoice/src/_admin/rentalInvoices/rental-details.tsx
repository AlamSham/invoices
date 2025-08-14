"use client"

import { useEffect, useState, useRef, Fragment } from 'react'
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import { ArrowLeft } from "lucide-react"
import RentalHeader from "./rental-header"
import RentalForm from "./rental-form"
import RentalActions from "./rental-actions"
import type { RentalInvoiceData, CompanyDetails } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"
import { daysBetween, addDays } from "./date-utils"

export default function RentalDetails() {
  const navigate = useNavigate()
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [isPhysicalCopy, setIsPhysicalCopy] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPDFType, setCurrentPDFType] = useState<'TAX' | 'PROFORMA' | null>(null)

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

  const [invoiceData, setInvoiceData] = useState<RentalInvoiceData | null>(null)
  // Helper to infer invoice type from data
  const getInvoiceTypeFromData = (data: RentalInvoiceData): 'ADVANCE' | 'PARTIAL' | 'FULL' => {
    if (data.invoiceType) {
      return data.invoiceType as 'ADVANCE' | 'PARTIAL' | 'FULL'
    }
    if (data.invoiceNumber?.startsWith('ADV-')) return 'ADVANCE'
    if (data.invoiceNumber?.startsWith('PARTIAL-')) return 'PARTIAL'
    if (data.invoiceNumber?.startsWith('FULL-')) return 'FULL'
    return 'ADVANCE' // Default
  }
  // Compute invoice type using helper; ensure proper union type
  const invoiceType: 'ADVANCE' | 'PARTIAL' | 'FULL' | undefined = invoiceData
    ? getInvoiceTypeFromData(invoiceData)
    : undefined
  // Wrapper ref around RentalForm, used to hide narrative rows for FULL invoices
  const rentalFormWrapperRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (invoiceType === 'FULL' && rentalFormWrapperRef.current) {
      const scope = rentalFormWrapperRef.current
      // Remove narrative rows
      const tds = scope.querySelectorAll('td[colspan]')
      tds.forEach((td) => {
        const text = (td.textContent || '').toLowerCase()
        if (text.includes('issued:') || text.includes('returned:') || text.includes('remaining:')) {
          const tr = td.closest('tr')
          if (tr && tr.parentElement) {
            tr.parentElement.removeChild(tr)
          }
        }
      })

      // Remove the Items table (identified by header containing 'S.No.')
      const tables = Array.from(scope.querySelectorAll('table'))
      tables.forEach((tbl) => {
        const ths = Array.from(tbl.querySelectorAll('thead th'))
        const hasSNoHeader = ths.some((th) => (th.textContent || '').trim().toLowerCase() === 's.no.')
        if (hasSNoHeader && tbl.parentElement) {
          tbl.parentElement.removeChild(tbl)
        }
      })
    }
  }, [invoiceType, invoiceData])

  // Fetch invoice details
  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return
    
    try {
      const token = localStorage.getItem("refreshToken")
      
      const response = await axios.get(
        `https://invoices-dk2w.onrender.com/api/invoice/rental/details/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      
      if (response.data.success) {
        const invoiceDetails = response.data.data
        setInvoiceData(invoiceDetails)
      } else {
        throw new Error("Invoice not found")
      }
    } catch (error: any) {
      alert("Error loading invoice details")
      navigate("/admin/dashboard")
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await fetchInvoiceDetails()
      setIsLoading(false)
    }

    initializeData()
  }, [invoiceId])

  const updateInvoiceData = (_path: string, _value: any) => {
    // This is read-only mode, so no updates needed
  }

  const calculateAmounts = () => {
    // For viewing existing invoices, amounts are already calculated
  }

  

  // Helpers for timeline
  const fmtDate = (d?: string) => {
    if (!d) return '-'
    try {
      return new Date(d).toLocaleDateString('en-IN')
    } catch {
      return d
    }
  }

  const handleGeneratePDF = async (type: 'TAX' | 'PROFORMA') => {
    setIsGeneratingPDF(true)
    setCurrentPDFType(type)
    
    try {
      // Generate PDF using html2canvas + manual pagination
      const { jsPDF } = await import('jspdf')
      const html2canvas = await import('html2canvas')
      const element = document.getElementById('invoice-container')
      if (element) {
        await new Promise(resolve => setTimeout(resolve, 500))

        // Ensure Partial Return History begins exactly at the top of page 2 in the PDF
        const pageWidthMm = 210
        const marginMm = 10
        const usableWidthMm = pageWidthMm - marginMm * 2
        const pageHeightMm = 297
        const drawHeightMm = pageHeightMm - marginMm * 2
        const prhEl = element.querySelector('#partial-return-history') as HTMLElement | null
        const fssEl = element.querySelector('#full-settlement-summary') as HTMLElement | null
        const thanksEl = element.querySelector('#thank-you-note') as HTMLElement | null
        let spacerEl: HTMLDivElement | null = null
        let spacerEl2: HTMLDivElement | null = null
        // Hide thank-you during PDF, we'll add footer via jsPDF if needed
        const originalThanksDisplay = thanksEl ? thanksEl.style.display : ''
        if (thanksEl) {
          thanksEl.style.display = 'none'
        }
        if (prhEl) {
          const pxPerMmScreen = element.clientWidth / usableWidthMm
          const pageSliceHeightPxScreen = Math.floor(pxPerMmScreen * drawHeightMm)
          // Compute Y position of PRH inside container
          const containerTop = element.getBoundingClientRect().top
          const prhTop = prhEl.getBoundingClientRect().top
          const offsetY = Math.max(0, Math.round(prhTop - containerTop))
          // Desired start at next page boundary (at least one full page)
          const desiredStart = pageSliceHeightPxScreen
          let spacerHeight = 0
          if (offsetY < desiredStart) {
            spacerHeight = desiredStart - offsetY
          } else {
            // Align to next page boundary if already past first page
            const remainder = offsetY % pageSliceHeightPxScreen
            spacerHeight = remainder ? (pageSliceHeightPxScreen - remainder) : 0
          }
          if (spacerHeight > 0) {
            spacerEl = document.createElement('div')
            spacerEl.setAttribute('data-prh-spacer', 'true')
            spacerEl.style.height = `${spacerHeight}px`
            spacerEl.style.width = '100%'
            spacerEl.style.display = 'block'
            prhEl.parentElement?.insertBefore(spacerEl, prhEl)
          }
        }
        // Prevent Full Settlement Summary block from splitting across pages: if it doesn't fit remainder, push to next page
        if (fssEl) {
          const pxPerMmScreen = element.clientWidth / usableWidthMm
          const pageSliceHeightPxScreen = Math.floor(pxPerMmScreen * drawHeightMm)
          const containerTop = element.getBoundingClientRect().top
          const rect = fssEl.getBoundingClientRect()
          const offsetY = Math.max(0, Math.round(rect.top - containerTop))
          const elHeight = Math.round(rect.height)
          const usedOnPage = offsetY % pageSliceHeightPxScreen
          const remainingOnPage = pageSliceHeightPxScreen - usedOnPage
          let spacerHeight2 = 0
          if (elHeight > remainingOnPage) {
            spacerHeight2 = remainingOnPage
          }
          if (spacerHeight2 > 0) {
            spacerEl2 = document.createElement('div')
            spacerEl2.setAttribute('data-fss-spacer', 'true')
            spacerEl2.style.height = `${spacerHeight2}px`
            spacerEl2.style.width = '100%'
            spacerEl2.style.display = 'block'
            fssEl.parentElement?.insertBefore(spacerEl2, fssEl)
          }
        }
        const canvas = await html2canvas.default(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        })
        // Remove spacers and restore thank-you visibility if added
        if (spacerEl && spacerEl.parentElement) {
          spacerEl.parentElement.removeChild(spacerEl)
        }
        if (spacerEl2 && spacerEl2.parentElement) {
          spacerEl2.parentElement.removeChild(spacerEl2)
        }
        if (thanksEl) {
          thanksEl.style.display = originalThanksDisplay
        }
        // Slice-based pagination to avoid any overlap/duplication
        const pageWidth = 210
        const pageHeight = 297
        const margin = 10
        const usableWidth = pageWidth - margin * 2
        const pageDrawHeightMm = pageHeight - margin * 2
        const pxPerMm = canvas.width / usableWidth
        const pageSliceHeightPx = Math.floor(pxPerMm * pageDrawHeightMm)
        const totalPages = Math.ceil(canvas.height / pageSliceHeightPx)

        // Helper to get a page slice as data URL
        const getSliceDataUrl = (sy: number, sh: number) => {
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sh
          const sctx = sliceCanvas.getContext('2d')!
          sctx.drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh)
          return sliceCanvas.toDataURL('image/png', 1.0)
        }

        const originalPdf = new jsPDF('p', 'mm', 'a4')
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) originalPdf.addPage()
          const sy = i * pageSliceHeightPx
          const sh = Math.min(pageSliceHeightPx, canvas.height - sy)
          const sliceImg = getSliceDataUrl(sy, sh)
          const sliceHeightMm = sh / pxPerMm
          originalPdf.setFontSize(20)
          originalPdf.setTextColor(200, 200, 200)
          originalPdf.text('ORIGINAL', pageWidth - 60, 20)
          originalPdf.addImage(sliceImg, 'PNG', margin, margin, usableWidth, sliceHeightMm)
        }

        const duplicatePdf = new jsPDF('p', 'mm', 'a4')
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) duplicatePdf.addPage()
          const sy = i * pageSliceHeightPx
          const sh = Math.min(pageSliceHeightPx, canvas.height - sy)
          const sliceImg = getSliceDataUrl(sy, sh)
          const sliceHeightMm = sh / pxPerMm
          duplicatePdf.setFontSize(20)
          duplicatePdf.setTextColor(200, 200, 200)
          duplicatePdf.text('DUPLICATE', pageWidth - 65, 20)
          duplicatePdf.addImage(sliceImg, 'PNG', margin, margin, usableWidth, sliceHeightMm)
        }

        const baseFilename = type === 'TAX' 
          ? `tax-invoice-${invoiceData?.invoiceNumber}`
          : `proforma-invoice-${invoiceData?.invoiceNumber}`
        originalPdf.save(`${baseFilename}-original.pdf`)
        setTimeout(() => duplicatePdf.save(`${baseFilename}-duplicate.pdf`), 500)

        alert(`${type} invoice PDFs generated successfully!\n\n✅ Original PDF: ${baseFilename}-original.pdf\n✅ Duplicate PDF: ${baseFilename}-duplicate.pdf`)
      }
    } catch (error) {
      alert('Error generating PDF. Please try again.')
    } finally {
      setIsGeneratingPDF(false)
      setCurrentPDFType(null)
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
        <div style={{ fontSize: "18px", color: "#4b5563" }}>Loading invoice details...</div>
      </div>
    )
  }

  if (!invoiceData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#f9fafb",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: "18px", color: "#4b5563", marginBottom: "16px" }}>
          Invoice not found
        </div>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", padding: "16px" }}>
      {/* Navigation Bar */}
      <div
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "white",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#6b7280",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "6px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} />
          Back to Dashboard
        </button>
        
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1f2937" }}>
          Invoice Details - {invoiceData.invoiceNumber}
        </div>
      </div>

      <div
        id="invoice-container"
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Arial', sans-serif",
          fontSize: "12px",
          lineHeight: "1.4",
          color: "#000",
          padding: "20px",
          position: "relative",
        }}
      >
        {/* Invoice Type Header */}
        <div
          style={{ 
            color: "#2563eb", 
            fontWeight: "bold", 
            fontSize: "18px", 
            marginBottom: "16px", 
            marginLeft: "200px" 
          }}
        >
          {currentPDFType === 'TAX' ? "TAX INVOICE" : 
           currentPDFType === 'PROFORMA' ? "PROFORMA INVOICE" : 
           (getInvoiceTypeFromData(invoiceData) === 'FULL' ? 'FINAL SETTLEMENT INVOICE' : `${getInvoiceTypeFromData(invoiceData).toUpperCase()} RENTAL INVOICE`)}
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType={getInvoiceTypeFromData(invoiceData)}
        />
        <div ref={rentalFormWrapperRef}>
          <RentalForm
            invoiceData={invoiceData}
            isEditingMode={isEditingMode}
            updateInvoiceData={updateInvoiceData}
            calculateAmounts={calculateAmounts}
            companyDetails={companyDetails}
            isPhysicalCopy={isPhysicalCopy}
            invoiceType={invoiceType}
            replaceItemsWithSummary={invoiceType === 'FULL' ? (
              <div id="item-movement-summary" style={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '8px',
                marginTop: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: 12, color: '#0f172a', fontSize: 16 }}>Items</h3>
                <h4 style={{ fontWeight: 600, marginBottom: 10, color: '#0f172a' }}>Item Movement Summary</h4>
                {(() => {
                  type Seg = { qty: number; start?: string; end?: string }
                  type Ret = { date: string; qty: number }
                  const byProduct = new Map<string, Seg[]>()
                  const earliestStartByProduct = new Map<string, string>()
                  const earliestQtyByProduct = new Map<string, number>()
                  const latestEndByProduct = new Map<string, string>()
                  ;(invoiceData?.items || []).forEach((it: any) => {
                    const name = it.productName || '-'
                    const qty = typeof it.rentedQuantity === 'string' ? parseFloat(it.rentedQuantity) || 0 : (it.rentedQuantity || 0)
                    const segs = byProduct.get(name) || []
                    segs.push({ qty, start: it.startDate, end: it.endDate })
                    byProduct.set(name, segs)
                    if (it.startDate) {
                      const cur = earliestStartByProduct.get(name)
                      if (!cur || new Date(it.startDate) < new Date(cur)) {
                        earliestStartByProduct.set(name, it.startDate)
                        earliestQtyByProduct.set(name, qty)
                      }
                    }
                    if (it.endDate) {
                      const curEnd = latestEndByProduct.get(name)
                      if (!curEnd || new Date(it.endDate) > new Date(curEnd)) {
                        latestEndByProduct.set(name, it.endDate)
                      }
                    }
                  })
                  const returnsMap = new Map<string, Ret[]>()
                  const headerDate = (invoiceData as any)?.Date || (invoiceData as any)?.createdAt || ''
                  ;(((invoiceData as any)?.partialReturnHistory) || []).forEach((entry: any) => {
                    const retDate = entry.returnDate || entry.createdAt || headerDate
                    if (Array.isArray(entry.returnedItems)) {
                      entry.returnedItems.forEach((ri: any) => {
                        const name = ri.productName || '-'
                        const qty = typeof ri.returnedQuantity === 'string' ? parseFloat(ri.returnedQuantity) || 0 : (ri.returnedQuantity || 0)
                        const arr = returnsMap.get(name) || []
                        arr.push({ date: retDate, qty })
                        returnsMap.set(name, arr)
                      })
                    }
                  })
                  const productNames = Array.from(new Set<string>([ ...byProduct.keys(), ...returnsMap.keys() ]))
                  if (!productNames.length) {
                    return <div style={{ fontSize: 12, color: '#64748b' }}>No movement data.</div>
                  }
                  return (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: '1px solid #e5e7eb' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th style={{ textAlign: 'center', padding: 8, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e5e7eb', width: 56 }}>S.No</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e5e7eb' }}>Event</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e5e7eb' }}>Product</th>
                            <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e5e7eb' }}>Qty</th>
                            <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #e2e8f0' }}>Date / Period</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productNames.map((name) => {
                            const segs = byProduct.get(name) || []
                            const earliestStart = earliestStartByProduct.get(name)
                            const issuedQty = earliestQtyByProduct.get(name) ?? (segs[0]?.qty || 0)
                            const retArr = (returnsMap.get(name) || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            const totalReturned = retArr.reduce((s, r) => s + (r.qty || 0), 0)
                            const remainingQty = Math.max(0, (issuedQty || 0) - (totalReturned || 0))
                            const lastReturn = retArr.length ? retArr[retArr.length - 1].date : ''
                            const dayAfter = lastReturn ? (() => { const d = new Date(lastReturn); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0] })() : ''
                            const latestEnd = segs.reduce<string | undefined>((acc, s) => {
                              if (!acc) return s.end
                              if (!s.end) return acc
                              return new Date(s.end) > new Date(acc) ? s.end : acc
                            }, undefined)
                            const extDays = (dayAfter && latestEnd) ? daysBetween(dayAfter, latestEnd) : 0
                            return (
                              <Fragment key={`ims-inline-${name}`}>
                                <tr>
                                  <th colSpan={4} style={{ textAlign: 'left', backgroundColor: '#f1f5f9', padding: 8, borderBottom: '1px solid #e5e7eb' }}>Product: {name}</th>
                                </tr>
                                <tr style={{ backgroundColor: '#ffffff' }}>
                                  <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>1</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>ISSUED</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{name}</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'right' }}>{issuedQty}</td>
                                  <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{earliestStart ? new Date(earliestStart).toLocaleDateString('en-GB') : '-'}</td>
                                </tr>
                                {retArr.map((r, idx) => (
                                  <tr key={`${name}-ret-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{idx + 2}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>PARTIAL RETURN</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{name}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'right' }}>{r.qty}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{new Date(r.date).toLocaleDateString('en-GB')}</td>
                                  </tr>
                                ))}
                                {(remainingQty > 0 && latestEnd) && (
                                  <tr>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'center' }}>{retArr.length + 2}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>EXTENDED</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb' }}>{name}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', textAlign: 'right' }}>{remainingQty}</td>
                                    <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{(dayAfter ? new Date(dayAfter).toLocaleDateString('en-GB') : '-') + ' → ' + (latestEnd ? new Date(latestEnd).toLocaleDateString('en-GB') : '')}{extDays ? ` (${extDays} days)` : ''}</td>
                                  </tr>
                                )}
                              </Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                })()}
                
              </div>
            ) : undefined}
          />
          </div>

          

          {/* Partial Return History (hidden for FULL invoices) */}
        {(getInvoiceTypeFromData(invoiceData) !== 'FULL' && invoiceData.partialReturnHistory && invoiceData.partialReturnHistory.length > 0) && (
          <div id="partial-return-history" style={{
            backgroundColor: '#ecfeff',
            padding: '20px',
            borderRadius: '8px',
            marginTop: '16px',
            border: '2px solid #06b6d4'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#164e63', fontSize: '18px' }}>Partial Return History</h3>
            {invoiceData.partialReturnHistory.map((entry: any, idx: number) => (
              <div key={idx} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '13px' }}>
                  <div><strong>Date:</strong> {entry.returnDate || '-'}</div>
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
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#64748b' }}>No returned items recorded in this entry.</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Rental Activity Timeline (hidden for FULL invoices) */}
        {getInvoiceTypeFromData(invoiceData) !== 'FULL' && (
        <div style={{ backgroundColor: '#eef2ff', padding: 20, borderRadius: 8, marginTop: 16, border: '2px solid #c7d2fe' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: 12, color: '#1e3a8a', fontSize: 18 }}>Rental Activity Timeline</h3>
          {(() => {
            type Remaining = { qty: number; start?: string; end?: string; rate: number }
            type ReturnEv = { date: string; qty: number; amount?: number }
            const byProduct = new Map<string, Remaining>()
            const segsByProduct = new Map<string, Remaining[]>()
            const earliestStartByProduct = new Map<string, string>()
            const earliestQtyByProduct = new Map<string, number>()
            // Aggregate multiple lines per product to avoid inflation from extensions/splits
            ;(invoiceData.items || []).forEach((it: any) => {
              const name = it.productName || '-'
              const qty = typeof it.rentedQuantity === 'string' ? parseFloat(it.rentedQuantity) || 0 : (it.rentedQuantity || 0)
              const rate = typeof it.dailyRate === 'string' ? parseFloat(it.dailyRate) || 0 : (it.dailyRate || 0)
              const prev = byProduct.get(name)
              if (!prev) {
                byProduct.set(name, { qty, start: it.startDate, end: it.endDate, rate })
                segsByProduct.set(name, [{ qty, start: it.startDate, end: it.endDate, rate }])
                if (it.startDate) {
                  earliestStartByProduct.set(name, it.startDate)
                  earliestQtyByProduct.set(name, qty)
                }
              } else {
                // keep earliest start, latest end, and maximum qty seen
                const earliestStart = prev.start && it.startDate ? (new Date(it.startDate) < new Date(prev.start) ? it.startDate : prev.start) : (prev.start || it.startDate)
                const latestEnd = prev.end && it.endDate ? (new Date(it.endDate) > new Date(prev.end) ? it.endDate : prev.end) : (prev.end || it.endDate)
                byProduct.set(name, { qty: Math.max(prev.qty || 0, qty || 0), start: earliestStart, end: latestEnd, rate: prev.rate || rate })
                const arr = segsByProduct.get(name) || []
                arr.push({ qty, start: it.startDate, end: it.endDate, rate })
                segsByProduct.set(name, arr)
                // track earliest issuance qty by earliest start
                const curEarliest = earliestStartByProduct.get(name)
                if (!curEarliest || (it.startDate && new Date(it.startDate) < new Date(curEarliest))) {
                  if (it.startDate) {
                    earliestStartByProduct.set(name, it.startDate)
                    earliestQtyByProduct.set(name, qty)
                  }
                }
              }
            })
              const returnsMap = new Map<string, ReturnEv[]>()
              const lastReturnMap = new Map<string, string>()
              const headerDate = (invoiceData as any).Date || (invoiceData as any).createdAt || ''
              ;((invoiceData as any).partialReturnHistory || []).forEach((entry: any) => {
                const retDate = entry.returnDate || entry.createdAt || headerDate
                if (Array.isArray(entry.returnedItems)) {
                  entry.returnedItems.forEach((ri: any) => {
                    const name = ri.productName || '-'
                    const qty = typeof ri.returnedQuantity === 'string' ? parseFloat(ri.returnedQuantity) || 0 : (ri.returnedQuantity || 0)
                    const amt = typeof ri.partialAmount === 'string' ? parseFloat(ri.partialAmount) || 0 : (ri.partialAmount || 0)
                    const arr = returnsMap.get(name) || []
                    arr.push({ date: retDate, qty, amount: amt })
                    returnsMap.set(name, arr)
                    if (!lastReturnMap.has(name) || new Date(retDate) > new Date(lastReturnMap.get(name)!)) {
                      lastReturnMap.set(name, retDate)
                    }
                  })
                }
              })
              const productNames = Array.from(new Set<string>([...byProduct.keys(), ...returnsMap.keys()]))
              if (!productNames.length) {
                return <div style={{ fontSize: 12, color: '#6b7280' }}>No activity available.</div>
              }
              return (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e0e7ff' }}>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Event</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Product</th>
                        <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Qty</th>
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Date / Period</th>
                        <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Days</th>
                        {getInvoiceTypeFromData(invoiceData) !== 'FULL' && (
                          <th style={{ textAlign: 'right', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Amount (₹)</th>
                        )}
                        <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #c7d2fe' }}>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productNames.map((name) => {
                        const rem = byProduct.get(name)
                        const retArr = (returnsMap.get(name) || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        // Issued should reflect the earliest issuance quantity (avoid extension inflation)
                        const issuedQty = earliestQtyByProduct.get(name) ?? (rem?.qty || 0)
                        const totalReturned = retArr.reduce((s, r) => s + (r.qty || 0), 0)
                        const remainingQtyDisplay = Math.max(0, (issuedQty || 0) - (totalReturned || 0))
                        const rows: any[] = []
                        // Issued row (just an event, no amount)
                        rows.push({
                          kind: 'ISSUED',
                          qty: issuedQty,
                          dateText: (() => {
                            const est = earliestStartByProduct.get(name)
                            if (est) return new Date(est).toLocaleDateString('en-GB')
                            return rem?.start ? new Date(rem.start).toLocaleDateString('en-GB') : (headerDate ? new Date(headerDate).toLocaleDateString('en-GB') : '-')
                          })(),
                          days: '-',
                          amount: '-',
                          notes: 'Issued'
                        })
                        // Partial returns
                        retArr.forEach((ev) => {
                          const startForReturned = earliestStartByProduct.get(name) || rem?.start
                          const daysRet = startForReturned ? daysBetween(startForReturned, ev.date) : 0
                          rows.push({
                            kind: 'PARTIAL RETURN',
                            qty: ev.qty,
                            dateText: new Date(ev.date).toLocaleDateString('en-GB'),
                            days: daysRet || '-',
                            amount: '-',
                            notes: 'Partial return'
                          })
                        })
                        // Remaining accrual per item segment (hide for FULL to avoid duplication with top summary)
                        const segs = segsByProduct.get(name) || (rem ? [rem] : [])
                        if (segs.length && getInvoiceTypeFromData(invoiceData) !== 'FULL') {
                          const lastReturn = lastReturnMap.get(name)
                          const dayAfter = lastReturn ? addDays(lastReturn, 1) : ''
                          segs.forEach((seg) => {
                            let accrualStart = seg.start || dayAfter || ''
                            if (seg.start && dayAfter) {
                              accrualStart = new Date(dayAfter) > new Date(seg.start) ? dayAfter : seg.start
                            } else if (dayAfter) {
                              accrualStart = dayAfter
                            }
                            const accrualEnd = seg.end || ''
                            const daysRemain = accrualStart && accrualEnd ? daysBetween(accrualStart, accrualEnd) : 0
                            rows.push({
                              kind: 'REMAINING',
                              qty: remainingQtyDisplay,
                              dateText: (accrualStart ? new Date(accrualStart).toLocaleDateString('en-GB') : '-') + ' → ' + (accrualEnd ? new Date(accrualEnd).toLocaleDateString('en-GB') : '-'),
                              days: daysRemain || '-',
                              amount: '-',
                              notes: lastReturn ? `Remaining accrual (after return on ${new Date(lastReturn).toLocaleDateString('en-GB')})` : 'Remaining accrual'
                            })
                          })
                        }
                        return (
                          rows.map((r, idx) => (
                            <tr key={`${name}-${idx}`}>
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{r.kind.replace('_', ' ')}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{name}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{r.qty}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{r.dateText}</td>
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{r.days}</td>
                              {getInvoiceTypeFromData(invoiceData) !== 'FULL' && (
                                <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb', textAlign: 'right' }}>{r.amount}</td>
                              )}
                              <td style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>{r.notes}</td>
                            </tr>
                          ))
                        )
                      })}
                      {/* FINAL SETTLEMENT timeline row removed per revert request */}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        )}

        {/* Final Settlement Items Table (shown only for FULL invoices) */}
        {getInvoiceTypeFromData(invoiceData) === 'FULL' && null}

        {/* Legacy Logs section: removed for FULL invoices (timeline replaces); logs below are conditioned */}

        {/* Logs Console (hide for FULL; timeline replaces it) */}
        {getInvoiceTypeFromData(invoiceData) !== 'FULL' && (
        <div id="logs-console" style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '16px',
          border: '2px dashed #e5e7eb'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#111827', fontSize: '18px' }}>Logs</h3>
          {(() => {
            type LogRow = {
              kind: 'ISSUE' | 'ITEM' | 'RETURN' | 'DAMAGE' | 'FINAL';
              issueDate?: string;
              returnDate?: string;
              days?: number | string;
              itemName?: string;
              rate?: number | string;
              qty?: number | string;
              notes?: string;
              amount?: number | string;
            }
            const rows: LogRow[] = []
            const d: any = invoiceData as any
            // Issue row
            if (d?.Date || d?.createdAt) {
              rows.push({ kind: 'ISSUE', issueDate: d.Date || d.createdAt, notes: `Invoice Issued (${invoiceData.invoiceNumber || '-'})` })
            }
            // Items rows
            ;(invoiceData.items || []).forEach((it: any) => {
              rows.push({
                kind: 'ITEM',
                issueDate: it.startDate,
                returnDate: it.endDate,
                days: it.totalDays ?? '-',
                itemName: (it.productName || '-'),
                rate: '-', // show dash per requested format
                qty: '-',  // show dash per requested format
                notes: 'Rental period'
              })
            })
            // Partial returns
            if ((d.partialReturnHistory || []).length) {
              d.partialReturnHistory.forEach((entry: any) => {
                const retDate = entry.returnDate || entry.createdAt || d.Date
                if (Array.isArray(entry.returnedItems) && entry.returnedItems.length) {
                  entry.returnedItems.forEach((ri: any) => {
                    rows.push({
                      kind: 'RETURN',
                      issueDate: retDate,
                      days: '-', // show dash per requested format
                      itemName: ri.productName || '-',
                      qty: ri.returnedQuantity ?? '-',
                      notes: 'Partial return',
                      amount: (ri.partialAmount ?? entry.partialPayment) ?? '-'
                    })
                  })
                } else {
                  rows.push({
                    kind: 'RETURN',
                    issueDate: retDate,
                    days: '-', // show dash per requested format
                    notes: 'Partial return',
                    amount: entry.partialPayment ?? '-'
                  })
                }
              })
            }
            // Damage charges
            if ((invoiceData.paymentDetails?.damageCharges || 0) > 0) {
              rows.push({
                kind: 'DAMAGE',
                issueDate: (invoiceData.paymentDetails as any)?.settlementDate || d.updatedAt || d.Date,
                notes: 'Damage charges',
                amount: invoiceData.paymentDetails?.damageCharges
              })
            }
            // Final bill
            if ((invoiceData.paymentDetails as any)?.finalAmount) {
              rows.push({
                kind: 'FINAL',
                issueDate: (invoiceData.paymentDetails as any)?.settlementDate || d.updatedAt || d.Date,
                notes: 'Final bill',
                amount: (invoiceData.paymentDetails as any).finalAmount
              })
            }
            if (!rows.length) {
              return <div style={{ fontSize: '12px', color: '#6b7280' }}>No logs available.</div>
            }
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6' }}>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>SI No.</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Issue Date</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Return Date</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>No Days</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Items</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Name of Item</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Rate</th>
                      <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                      <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Notes / Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{fmtDate(r.issueDate)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{fmtDate(r.returnDate)}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{r.days ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.kind}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.itemName ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{typeof r.rate === 'number' ? `₹${r.rate.toLocaleString()}` : (r.rate ?? '-')}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{r.qty ?? '-'}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>{r.notes}{r.amount !== undefined && r.amount !== null && r.amount !== '-' ? `: ₹${Number(r.amount).toLocaleString()}` : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })()}
        </div>
        )}

        {/* Full Settlement Payment Summary (Read-only) */}
        {getInvoiceTypeFromData(invoiceData) === 'FULL' && (
          <div id="full-settlement-summary" style={{ 
            backgroundColor: '#f0f9ff', 
            padding: '20px', 
            borderRadius: '8px', 
            marginTop: '16px',
            border: '2px solid #0ea5e9'
          }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px', color: '#0c4a6e', fontSize: '18px' }}>Full Settlement Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div>
                {(() => {
                  const finalAmt = Number((invoiceData.paymentDetails as any)?.finalAmount || 0)
                  const originalAdvance = Number((invoiceData.paymentDetails as any)?.originalAdvanceAmount || 0)
                  const partialPaid = ((invoiceData.partialReturnHistory || []) as any[]).reduce((s, e: any) => s + (Number(e?.partialPayment || 0)), 0)
                  const damage = Number((invoiceData.paymentDetails as any)?.damageCharges || 0)
                  const computedFinalPayment = Math.max(0, finalAmt - (originalAdvance + partialPaid))
                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Final Amount:</span>
                        <span style={{ fontWeight: 'bold' }}>₹{finalAmt.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Advance Taken (Original):</span>
                        <span style={{ fontWeight: 'bold', color: '#059669' }}>₹{originalAdvance.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Partial Payments Collected:</span>
                        <span style={{ fontWeight: 'bold', color: '#2563eb' }}>₹{partialPaid.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Damage Charges:</span>
                        <span style={{ fontWeight: 'bold', color: '#b45309' }}>₹{damage.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600 }}>Final Payment (at Settlement):</span>
                        <span style={{ fontWeight: 'bold', color: '#0f766e' }}>₹{computedFinalPayment.toLocaleString()}</span>
                      </div>
                    </>
                  )
                })()}
              </div>
              <div>
                {/* Right side now shows Outstanding and Status only */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Outstanding:</span>
                  <span style={{ fontWeight: 'bold', color: (() => {
                    const finalAmt = Math.max(0, (invoiceData.paymentDetails?.finalAmount ?? 0))
                    const paid = Math.max(0, (invoiceData.paymentDetails?.paidAmount ?? 0))
                    const backendOut = invoiceData.paymentDetails?.outstandingAmount
                    let display = backendOut !== undefined && backendOut !== null ? backendOut : (finalAmt - paid)
                    // For FULL settlement, if completed or fully paid, force 0
                    if (getInvoiceTypeFromData(invoiceData) === 'FULL' && (invoiceData.rentalDetails?.status === 'COMPLETED' || paid >= finalAmt)) {
                      display = 0
                    }
                    return Math.max(0, display) === 0 ? '#059669' : '#dc2626'
                  })() }}>
                    ₹{(() => {
                      const finalAmt = Math.max(0, (invoiceData.paymentDetails?.finalAmount ?? 0))
                      const paid = Math.max(0, (invoiceData.paymentDetails?.paidAmount ?? 0))
                      const backendOut = invoiceData.paymentDetails?.outstandingAmount
                      let display = backendOut !== undefined && backendOut !== null ? backendOut : (finalAmt - paid)
                      // For FULL settlement, if completed or fully paid, force 0
                      if (getInvoiceTypeFromData(invoiceData) === 'FULL' && (invoiceData.rentalDetails?.status === 'COMPLETED' || paid >= finalAmt)) {
                        display = 0
                      }
                      return Math.max(0, display)
                    })().toLocaleString()}
                  </span>
                </div>
                {invoiceData.rentalDetails?.status && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600 }}>Status:</span>
                    <span style={{ fontWeight: 'bold' }}>{invoiceData.rentalDetails.status}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Returned at Final Settlement table removed per revert request */}
          </div>
        )}
      </div>

      <RentalActions
        isEditingMode={false}
        setIsEditingMode={setIsEditingMode}
        handleTaxPDF={() => handleGeneratePDF('TAX')}
        handleProformaPDF={() => handleGeneratePDF('PROFORMA')}
        isPhysicalCopy={isPhysicalCopy}
        setIsPhysicalCopy={setIsPhysicalCopy}
        isGeneratingPDF={isGeneratingPDF}
        showEditButton={false}
      />
    </div>
  )
}

