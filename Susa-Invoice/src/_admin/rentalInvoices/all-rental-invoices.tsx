"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { useParams, useNavigate } from "react-router-dom"
import { Search, Plus, Eye, ChevronLeft, ChevronRight, CreditCard, CheckCircle } from "lucide-react"

interface RentalInvoice {
  _id: string
  invoiceNumber: string // Now string format like INV-2500
  invoiceType: 'ADVANCE' | 'PARTIAL' | 'FULL'
  type?: 'TAX' | 'PROFORMA' // PDF type
  totalAmount: number
  Date?: string
  companyId: string
  status?: 'ACTIVE' | 'PARTIAL_RETURNED' | 'COMPLETED'
  // Legacy fields for backward compatibility
  advanceAmount?: number
  outstandingAmount?: number
  // New schema fields
  paymentDetails?: {
    advanceAmount: number | string
    totalRentAmount: number
    paidAmount: number
    outstandingAmount: number
    refundAmount: number
    finalAmount: number
  }
  billTo?: {
    name: string
    address: string
    gstin: string
  }
}

interface ApiResponse {
  success: boolean
  data: RentalInvoice[]
  message?: string
}

interface AllRentalInvoicesProps {
  onNewInvoice?: () => void
  onViewInvoice?: (invoiceId: string) => void
}

export default function AllRentalInvoices({ onNewInvoice, onViewInvoice }: AllRentalInvoicesProps) {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const [invoices, setInvoices] = useState<RentalInvoice[]>([])
  const [filteredInvoices, setFilteredInvoices] = useState<RentalInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Fetch rental invoices
  useEffect(() => {
    const fetchRentalInvoices = async () => {
      if (!companyId) {
        setError("No company ID provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await axios.get<ApiResponse>(`https://invoices-dk2w.onrender.com/api/invoice/rental/company/${companyId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })

        if (response.data.success) {
          const invoiceData = response.data.data || []
          setInvoices(invoiceData)
          setFilteredInvoices(invoiceData)
          setError(null)
        } else {
          setError("Failed to fetch rental invoices")
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          if (err.response) {
            if (err.response.status === 404 || err.response.data?.message?.includes("No rental invoices found")) {
              setInvoices([])
              setFilteredInvoices([])
              setError(null)
            } else {
              setError(`Error: ${err.response.data?.message || err.response.statusText}`)
            }
          } else if (err.request) {
            setError("Error: Unable to connect to server")
          } else {
            setError(`Error: ${err.message}`)
          }
        } else {
          setError("An unexpected error occurred")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRentalInvoices()
  }, [companyId])

  // Search functionality
  useEffect(() => {
    const filtered = invoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toString().includes(searchTerm.toLowerCase()) ||
        (invoice.type || invoice.invoiceType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.status || 'ACTIVE').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (invoice.Date && invoice.Date.toLowerCase().includes(searchTerm.toLowerCase())),
    )
    setFilteredInvoices(filtered)
    setCurrentPage(1)
  }, [searchTerm, invoices])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  const handleNewAdvanceInvoice = () => {
    if (onNewInvoice) {
      onNewInvoice()
    }
    navigate(`/admin/rental/advance/${companyId}`)
  }

  const handlePartialPayment = (invoiceId: string) => {
    navigate(`/admin/rental/partial/${invoiceId}`)
  }

  const handleFullSettlement = (invoiceId: string) => {
    navigate(`/admin/rental/full/${invoiceId}`)
  }

  const handleViewInvoice = (invoiceId: string) => {
    if (onViewInvoice) {
      onViewInvoice(invoiceId)
    }
    navigate(`/admin/rental/details/${invoiceId}`)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800'
      case 'PARTIAL_RETURNED':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'ADVANCE':
        return 'bg-indigo-100 text-indigo-800'
      case 'PARTIAL':
        return 'bg-orange-100 text-orange-800'
      case 'FULL':
        return 'bg-emerald-100 text-emerald-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading rental invoices...</p>
        </div>
      </div>
    )
  }

  if ((error && error.includes("Unable to connect")) || error?.includes("unexpected error")) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rental Invoices</h1>
              <p className="text-gray-600 mt-1">Manage advance payments, partial returns, and settlements</p>
            </div>
            <button
              onClick={handleNewAdvanceInvoice}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Advance Invoice
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by invoice number, type, status, or date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              Showing {currentItems.length} of {filteredInvoices.length} rental invoices
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advance Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Outstanding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((invoice) => {
                    const outstanding = Number(
                      (invoice.paymentDetails?.outstandingAmount as number | undefined) ??
                      (invoice.outstandingAmount as number | undefined) ??
                      0
                    )
                    return (
                    <tr key={invoice._id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{invoice.invoiceNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadge(invoice.type || invoice.invoiceType || 'ADVANCE')}`}>
                          {invoice.type || invoice.invoiceType || 'ADVANCE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status || 'ACTIVE')}`}>
                          {(invoice.status || 'ACTIVE').replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(invoice.paymentDetails?.advanceAmount || invoice.advanceAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(invoice.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`font-medium ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{outstanding.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.Date ? new Date(invoice.Date).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewInvoice(invoice._id)}
                            className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-md transition-colors duration-200"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </button>

                          {invoice.status !== 'COMPLETED' && (
                            <>
                              <button
                                onClick={() => handlePartialPayment(invoice._id)}
                                className="inline-flex items-center px-2 py-1 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-medium rounded-md transition-colors duration-200"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Partial
                              </button>

                              <button
                                onClick={() => handleFullSettlement(invoice._id)}
                                className={
                                  'inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors duration-200 bg-green-100 hover:bg-green-200 text-green-700'
                                }
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Full
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="mb-4">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-lg font-medium text-gray-900">No rental invoices found</p>
                        <p className="mt-1 text-gray-600">
                          {searchTerm
                            ? "Try adjusting your search terms or create a new advance invoice"
                            : "Get started by creating your first advance invoice"}
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={handleNewAdvanceInvoice}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
                          >
                            <Plus className="w-5 h-5 mr-2" />
                            Create Advance Invoice
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of{" "}
                      <span className="font-medium">{filteredInvoices.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

