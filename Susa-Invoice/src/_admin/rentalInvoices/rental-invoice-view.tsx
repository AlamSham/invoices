"use client"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Download, Printer, Eye } from "lucide-react"
import type { RentalInvoiceData } from "./rental-types"
import logo from "../../assets/logo1.jpeg"
import stamp from "../../assets/stamp.png"

export default function RentalInvoiceView() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [invoice, setInvoice] = useState<RentalInvoiceData | null>(null)


  // Fetch invoice details
  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return

      try {
        const token = localStorage.getItem('token') || localStorage.getItem('refreshToken')
        const response = await axios.get(`http://localhost:5000/api/invoice/getbyId/${invoiceId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (response.data) {
          setInvoice(response.data)
          
          // Company details fetching removed as it's not used in this component
        }
      } catch (error) {
        alert("Error loading invoice details")
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvoiceDetails()
  }, [invoiceId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // You can implement PDF download functionality here
    alert("PDF download feature coming soon!")
  }

  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'ADVANCE': return 'Advance Payment Invoice'
      case 'PARTIAL': return 'Partial Return Invoice'
      case 'FULL': return 'Final Settlement Invoice'
      default: return 'Rental Invoice'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-blue-600 bg-blue-100'
      case 'PARTIAL_RETURN': return 'text-orange-600 bg-orange-100'
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading invoice...</div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-red-600">Invoice not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Action Bar - Hidden in print */}
      <div className="max-w-4xl mx-auto mb-6 print:hidden">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/admin/rental-details/${invoiceId}`)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div 
        id="invoice-container"
        className="max-w-4xl mx-auto bg-white shadow-lg print:shadow-none print:max-w-none"
        style={{
          fontFamily: "'Arial', sans-serif",
          fontSize: "12px",
          lineHeight: "1.4",
          color: "#000",
          padding: "20px"
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center">
            <img src={logo} alt="Company Logo" className="w-16 h-16 mr-4" />
            <div>
              <h1 className="text-2xl font-bold text-blue-600">SUSAKGJYO BUSINESS PVT. LTD</h1>
              <p className="text-sm text-gray-600">1404, DLF CORPORATE GREEN, SECTOR 74 - A, GURGAON, HARYANA -122004 (INDIA)</p>
              <p className="text-sm text-gray-600">GSTIN: 06AAYCS5019E1Z3 | PAN: AAYCS5019E</p>
              <p className="text-sm text-gray-600">Phone: +91-8595591496, 0124-4147286 | Email: Contact@susalabs.com</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {getInvoiceTypeLabel(invoice.invoiceType || 'ADVANCE')}
            </h2>
            <div className="text-sm">
              <p><strong>Invoice #:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> {new Date(invoice.Date).toLocaleDateString()}</p>
              {invoice.rentalDetails && (
                <div className={`inline-block px-2 py-1 rounded-full text-xs mt-2 ${getStatusColor(invoice.rentalDetails.status)}`}>
                  {invoice.rentalDetails.status}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bill To & Ship To */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Bill To:</h3>
            <div className="text-sm">
              <p className="font-semibold">{invoice.billTo.name}</p>
              <p>{invoice.billTo.address}</p>
              {invoice.billTo.gstin && <p><strong>GSTIN:</strong> {invoice.billTo.gstin}</p>}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Ship To:</h3>
            <div className="text-sm">
              <p className="font-semibold">{invoice.shipTo?.name || invoice.billTo.name}</p>
              <p>{invoice.shipTo?.address || invoice.billTo.address}</p>
            </div>
          </div>
        </div>

        {/* Rental Details */}
        {invoice.rentalDetails && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-bold text-gray-800 mb-2">Rental Information:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Start Date:</strong> {new Date(invoice.rentalDetails.startDate).toLocaleDateString()}
              </div>
              {invoice.rentalDetails.endDate && (
                <div>
                  <strong>End Date:</strong> {new Date(invoice.rentalDetails.endDate).toLocaleDateString()}
                </div>
              )}
              <div>
                <strong>Total Days:</strong> {invoice.rentalDetails.totalDays} days
              </div>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">S.No.</th>
                <th className="border border-gray-300 p-2 text-left">Product/Service</th>
                <th className="border border-gray-300 p-2 text-center">Quantity</th>
                <th className="border border-gray-300 p-2 text-center">Daily Rate</th>
                <th className="border border-gray-300 p-2 text-center">Days</th>
                <th className="border border-gray-300 p-2 text-center">HSN Code</th>
                <th className="border border-gray-300 p-2 text-right">Amount (â‚¹)</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, index: number) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-2">
                    <div>
                      <div className="font-semibold">{item.productName}</div>
                      {item.returnedQuantity > 0 && (
                        <div className="text-xs text-orange-600">
                          Returned: {item.returnedQuantity} on {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {item.rentedQuantity || item.quantity}
                    {item.returnedQuantity > 0 && (
                      <div className="text-xs text-gray-600">(-{item.returnedQuantity})</div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">â‚¹{item.dailyRate}</td>
                  <td className="border border-gray-300 p-2 text-center">{item.actualDays || item.totalDays || invoice.rentalDetails?.totalDays || 0}</td>
                  <td className="border border-gray-300 p-2 text-center">{item.hsnCode}</td>
                  <td className="border border-gray-300 p-2 text-right">â‚¹{(item.rentAmount || item.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Payment Summary */}
        {invoice.paymentDetails && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Payment Details:</h3>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Total Rent Amount:</span>
                    <span>â‚¹{invoice.paymentDetails.totalRentAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Payment:</span>
                    <span>â‚¹{invoice.paymentDetails.advanceAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Paid:</span>
                    <span>â‚¹{invoice.paymentDetails.paidAmount?.toLocaleString()}</span>
                  </div>
                  {invoice.paymentDetails.refundAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Refund Amount:</span>
                      <span>â‚¹{invoice.paymentDetails.refundAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Outstanding:</span>
                    <span className={invoice.paymentDetails.outstandingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                      â‚¹{invoice.paymentDetails.outstandingAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-gray-800 mb-2">Total Amount:</h3>
                <div className="text-2xl font-bold text-blue-600">
                  â‚¹{invoice.totalAmount?.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {invoice.invoiceType === 'ADVANCE' ? 'Advance Payment' :
                   invoice.invoiceType === 'PARTIAL' ? 'Partial Settlement' :
                   'Final Settlement'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Payment Terms:</h3>
            <div className="text-sm whitespace-pre-line">
              {invoice.paymentTerms}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Terms & Conditions:</h3>
            <div className="text-sm whitespace-pre-line">
              {invoice.termsConditions}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        {invoice.bankDetails && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-2">Bank Details:</h3>
            <div className="text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong>Bank Name:</strong> {invoice.bankDetails.bankName}
              </div>
              <div>
                <strong>Account Name:</strong> {invoice.bankDetails.accountName}
              </div>
              <div>
                <strong>Account Number:</strong> {invoice.bankDetails.accountNumber}
              </div>
              <div>
                <strong>IFSC Code:</strong> {invoice.bankDetails.ifscCode}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-end mt-12">
          <div className="text-sm">
            <p className="font-bold">For SUSAKGJYO BUSINESS PVT. LTD</p>
            <div className="mt-8">
              <img src={stamp} alt="Company Stamp" className="w-20 h-20" />
            </div>
            <p className="mt-2">Authorized Signatory</p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>This is a computer generated invoice</p>
            <p>Generated on: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

