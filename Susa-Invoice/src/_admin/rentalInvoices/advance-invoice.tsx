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

export default function AdvanceInvoice() {
  const { companyId } = useParams<{ companyId: string }>()
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
        hsnCode: '',
        amount: '',
        rentedQuantity: '',
        dailyRate: '',
        totalDays: '',
        rentAmount: '',
        startDate: '',
        endDate: '',
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
    invoiceType: 'ADVANCE',
  })

  // Fetch next invoice number
  const fetchNextInvoiceNumber = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/invoice/nextInvoiceNumber")
      if (response.data && response.data.nextInvoiceNumber) {
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: response.data.nextInvoiceNumber.toString(),
        }))
      }
    } catch (error) {
    }
  }

  // Fetch company details by ID
  const fetchCompanyDetails = async () => {
    if (!companyId) return

    try {
      const response = await axios.get(`http://localhost:5000/api/companies/getById/${companyId}`)
      if (response.data) {
        const company = response.data
        setInvoiceData((prev) => ({
          ...prev,
          billTo: {
            name: company.name || "",
            address: company.address || "",
            gstin: company.gstNumber || "",
          },
        }))
      }
    } catch (error) {
    }
  }

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true)
      await Promise.all([fetchNextInvoiceNumber(), fetchCompanyDetails()])
      setIsLoading(false)
    }

    initializeData()
  }, [companyId])

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
      const totalAmount = subtotal + totalTax
      
      // Calculate outstanding amount for advance invoice
      const advanceAmount = parseFloat(String(prev.paymentDetails?.advanceAmount || '0')) || 0
      const paidAmount = parseFloat(String(prev.paymentDetails?.paidAmount || 0)) || 0
      const outstandingAmount = Math.max(0, totalAmount - advanceAmount - paidAmount)
      
      return {
        ...prev,
        subtotal,
        cgstAmount: cgst,
        sgstAmount: sgst,
        ugstAmount: ugst,
        igstAmount: igst,
        totalTaxAmount: totalTax,
        totalAmount: totalAmount,
        paymentDetails: {
          ...prev.paymentDetails,
          totalRentAmount: totalAmount,
          outstandingAmount: outstandingAmount,
          finalAmount: totalAmount,
          advanceAmount: prev.paymentDetails?.advanceAmount || '',
          paidAmount: prev.paymentDetails?.paidAmount || 0,
          refundAmount: prev.paymentDetails?.refundAmount || 0
        }
      }
    })
  }
  
  useEffect(() => {
    calculateAmounts()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
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
        return cleanedItem
      })
      
      const requestData = {
        ...invoiceDataWithoutUnused,
        items: cleanedItems,
        companyId: companyId,
        invoiceType: 'ADVANCE' // Keep as ADVANCE for rental invoices
      }
      
      // Console log the complete payload
      // Removed PDF type usage; save-only flow
      
      // Save to backend first
      const response = await axios.post(
        'http://localhost:5000/api/invoice/rental/advance',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (response.data.success) {
        alert(`Invoice saved successfully!`)
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
          ADVANCE RENTAL INVOICE
        </div>

        <RentalHeader
          companyDetails={companyDetails}
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          invoiceType="ADVANCE"
        />

        <RentalForm
          invoiceData={invoiceData}
          isEditingMode={isEditingMode}
          updateInvoiceData={updateInvoiceData}
          calculateAmounts={calculateAmounts}
          companyDetails={companyDetails}
          isPhysicalCopy={false}
          invoiceType="ADVANCE"
        />
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

