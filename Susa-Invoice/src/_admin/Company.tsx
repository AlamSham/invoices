"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom" // Import Link from react-router-dom
import axios from "axios"

import { Building2, Plus, Edit, Trash2, X, Search, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react"

interface Company {
  _id: string
  name: string
  address: string
  gstNumber: string
}

const Company: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [newCompany, setNewCompany] = useState<Omit<Company, "_id">>({
    name: "",
    address: "",
    gstNumber: "",
  })

  const fetchCompanies = async () => {
    setLoading(true)
    try {
      const res = await axios.get("http://localhost:5000/api/companies/getAll")
      setCompanies(res.data)
      setFilteredCompanies(res.data)
    } catch (err) {
      console.error("Error fetching companies", err)
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post("http://localhost:5000/api/companies/add", newCompany)
      setShowModal(false)
      setNewCompany({ name: "", address: "", gstNumber: "" })
      fetchCompanies()
    } catch (err) {
      console.error("Error creating company", err)
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this company?")) {
      setLoading(true)
      try {
        await axios.delete(`http://localhost:5000/api/companies/deleteById/${id}`)
        fetchCompanies()
      } catch (err) {
        console.error("Error deleting company", err)
      } finally {
        setLoading(false)
      }
    }
  }

  const updateCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (editingCompany) {
        await axios.put(`http://localhost:5000/api/companies/updateById/${editingCompany._id}`, editingCompany)
        setEditingCompany(null)
        fetchCompanies()
      }
    } catch (err) {
      console.error("Error updating company", err)
    } finally {
      setLoading(false)
    }
  }

  // Search and Filter
  useEffect(() => {
    const filtered = companies.filter(
      (company) =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.gstNumber.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCompanies(filtered)
    setCurrentPage(1)
  }, [searchTerm, companies])

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  useEffect(() => {
    fetchCompanies()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Company Management</h2>
              <p className="text-slate-600">Manage your business companies</p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold">Add Company</span>
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <Filter className="h-5 w-5" />
                <span className="text-sm font-medium">
                  Showing {currentItems.length} of {filteredCompanies.length} companies
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">S.No</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Company Name</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Address</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">GST Number</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {currentItems.map((company, index) => (
                      <tr key={company._id} className="hover:bg-slate-50 transition-colors duration-200">
                        <td className="px-6 py-4 text-sm text-slate-600">{indexOfFirstItem + index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Building2 className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-800">{company.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{company.address}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">
                            {company.gstNumber}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center space-x-2">
                            <button
                              className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors duration-200 hover:scale-110"
                              onClick={() => setEditingCompany(company)}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 hover:scale-110"
                              onClick={() => deleteCompany(company._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                           
                            <Link
                              to={`/admin/rental-invoices/${company._id}`}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors duration-200 hover:scale-110 flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              <span className="text-sm">Rental Invoices</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber = i + 1
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => paginate(pageNumber)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                              currentPage === pageNumber
                                ? "bg-blue-600 text-white"
                                : "border border-slate-200 hover:bg-white text-slate-600"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Form */}
        {editingCompany && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl border border-white/50">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Edit className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Edit Company</h3>
                </div>
                <button
                  onClick={() => setEditingCompany(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={updateCompany} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                    <input
                      type="text"
                      value={editingCompany.name}
                      onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter company name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">GST Number (Optional)</label>
                    <input
                      type="text"
                      value={editingCompany.gstNumber}
                      onChange={(e) => setEditingCompany({ ...editingCompany, gstNumber: e.target.value })}
                      className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter GST number (optional)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea
                    value={editingCompany.address}
                    onChange={(e) => setEditingCompany({ ...editingCompany, address: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-20 resize-none"
                    placeholder="Enter company address"
                    required
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105"
                    onClick={() => setEditingCompany(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Update Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md border border-white/50">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Add New Company</h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  <X className="h-5 w-5 text-slate-500" />
                </button>
              </div>

              <form onSubmit={createCompany} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter company name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Address</label>
                  <textarea
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 h-20 resize-none"
                    placeholder="Enter company address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">GST Number (Optional)</label>
                  <input
                    type="text"
                    value={newCompany.gstNumber}
                    onChange={(e) => setNewCompany({ ...newCompany, gstNumber: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter GST number (optional)"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    className="flex-1 bg-slate-500 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-300 hover:scale-105"
                  >
                    Create Company
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Company