"use client"
import { useState, useEffect } from "react"
import axios from "axios"
import { Trash2, Edit, Search, Plus, FileText, Calendar, X } from "lucide-react"

interface FileRecord {
  _id: string
  fileUrls: string[]
  companyName: string
  totalAmount: number
  createdAt: string
}

interface Toast {
  id: string
  title: string
  description: string
  type: "success" | "error"
}

export default function Files() {
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<FileRecord | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [formData, setFormData] = useState({
    companyName: "",
    totalAmount: "",
  })
  const [filters, setFilters] = useState({
    companyName: "",
    startDate: "",
    endDate: "",
  })
  const [toasts, setToasts] = useState<Toast[]>([])
  const API_BASE = "https://invoices-dk2w.onrender.com/api/files" // Adjust this to your backend URL

  // Configure axios defaults
  axios.defaults.timeout = 10000 // 10 seconds timeout

  // Toast functionality
  const showToast = (title: string, description: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { id, title, description, type }
    setToasts((prev) => [...prev, newToast])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Fetch all files
  const fetchFiles = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_BASE}/getAll`)
      setFiles(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast("Error", error.response?.data?.error || "Failed to fetch files", "error")
      } else {
        showToast("Error", "Network error while fetching files", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Create new file record
  const createFileRecord = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      showToast("Error", "Please select at least one file", "error")
      return
    }
    if (!formData.companyName.trim()) {
      showToast("Error", "Please enter company name", "error")
      return
    }
    if (!formData.totalAmount.trim()) {
      showToast("Error", "Please enter total amount", "error")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("companyName", formData.companyName)
    formDataToSend.append("totalAmount", formData.totalAmount)
    for (let i = 0; i < selectedFiles.length; i++) {
      formDataToSend.append("files", selectedFiles[i])
    }

    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE}/upload`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      showToast("Success", response.data.message || "File record created successfully")
      setIsCreateOpen(false)
      setFormData({ companyName: "", totalAmount: "" })
      setSelectedFiles(null)
      // Reset file input
      const fileInput = document.getElementById("files") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      fetchFiles()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast("Error", error.response?.data?.error || "Failed to create file record", "error")
      } else {
        showToast("Error", "Network error while creating file record", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Update file record
  const updateFileRecord = async () => {
    if (!editingFile) return
    if (!formData.companyName.trim()) {
      showToast("Error", "Please enter company name", "error")
      return
    }
    if (!formData.totalAmount.trim()) {
      showToast("Error", "Please enter total amount", "error")
      return
    }

    const formDataToSend = new FormData()
    formDataToSend.append("companyName", formData.companyName)
    formDataToSend.append("totalAmount", formData.totalAmount)
    if (selectedFiles && selectedFiles.length > 0) {
      for (let i = 0; i < selectedFiles.length; i++) {
        formDataToSend.append("files", selectedFiles[i])
      }
    }

    setLoading(true)
    try {
      const response = await axios.put(`${API_BASE}/update/${editingFile._id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      showToast("Success", response.data.message || "File record updated successfully")
      setIsEditOpen(false)
      setEditingFile(null)
      setFormData({ companyName: "", totalAmount: "" })
      setSelectedFiles(null)
      // Reset file input
      const fileInput = document.getElementById("editFiles") as HTMLInputElement
      if (fileInput) fileInput.value = ""
      fetchFiles()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast("Error", error.response?.data?.error || "Failed to update file record", "error")
      } else {
        showToast("Error", "Network error while updating file record", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Delete file record
  const deleteFileRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file record?")) return

    setLoading(true)
    try {
      const response = await axios.delete(`${API_BASE}/delete/${id}`)
      showToast("Success", response.data.message || "File record deleted successfully")
      fetchFiles()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast("Error", error.response?.data?.error || "Failed to delete file record", "error")
      } else {
        showToast("Error", "Network error while deleting file record", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter files
  const filterFiles = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filters.companyName) params.companyName = filters.companyName
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      const response = await axios.get(`${API_BASE}/filter`, { params })
      setFiles(response.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        showToast("Error", error.response?.data?.error || "Failed to filter files", "error")
      } else {
        showToast("Error", "Network error while filtering files", "error")
      }
    } finally {
      setLoading(false)
    }
  }

  // Clear filters
  const clearFilters = () => {
    setFilters({ companyName: "", startDate: "", endDate: "" })
    fetchFiles()
  }

  // Handle edit click
  const handleEditClick = (file: FileRecord) => {
    setEditingFile(file)
    setFormData({
      companyName: file.companyName,
      totalAmount: file.totalAmount.toString(),
    })
    setIsEditOpen(true)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Handle modal close
  const handleCreateModalClose = () => {
    setIsCreateOpen(false)
    setFormData({ companyName: "", totalAmount: "" })
    setSelectedFiles(null)
    const fileInput = document.getElementById("files") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  const handleEditModalClose = () => {
    setIsEditOpen(false)
    setEditingFile(null)
    setFormData({ companyName: "", totalAmount: "" })
    setSelectedFiles(null)
    const fileInput = document.getElementById("editFiles") as HTMLInputElement
    if (fileInput) fileInput.value = ""
  }

  useEffect(() => {
    fetchFiles()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
            <p className="text-gray-600">Manage your company file records</p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Record
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="filterCompany" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  id="filterCompany"
                  type="text"
                  value={filters.companyName}
                  onChange={(e) => setFilters({ ...filters, companyName: e.target.value })}
                  placeholder="Search by company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={filterFiles}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Files Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900">File Records ({files.length})</h2>
              <p className="text-gray-600">All your uploaded file records with company information</p>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No file records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Files
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.map((file) => (
                      <tr key={file._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {file.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {file.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {file.fileUrls.length > 0 ? (
                              file.fileUrls.map((url, idx) => (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={url.split("/").pop()} // Suggest filename for download
                                  className="inline-flex items-center text-blue-600 hover:underline text-sm"
                                >
                                  <FileText className="w-4 h-4 mr-1" />
                                  {url.split("/").pop() || `File ${idx + 1}`}
                                </a>
                              ))
                            ) : (
                              <span className="text-gray-500 text-xs">No files</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            {formatDate(file.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditClick(file)}
                              className="inline-flex items-center p-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              title="Edit record"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteFileRecord(file._id)}
                              className="inline-flex items-center p-1 border border-gray-300 rounded text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                              title="Delete record"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Create New File Record</h3>
                    <p className="text-sm text-gray-600">Upload files and add company information</p>
                  </div>
                  <button
                    onClick={handleCreateModalClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Enter company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount *
                    </label>
                    <input
                      id="totalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="Enter total amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="files" className="block text-sm font-medium text-gray-700 mb-1">
                      Files *
                    </label>
                    <input
                      id="files"
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Select up to 10 files</p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleCreateModalClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createFileRecord}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      "Create Record"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit File Record</h3>
                    <p className="text-sm text-gray-600">Update company information and optionally replace files</p>
                  </div>
                  <button
                    onClick={handleEditModalClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="editCompanyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name *
                    </label>
                    <input
                      id="editCompanyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Enter company name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="editTotalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount *
                    </label>
                    <input
                      id="editTotalAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      placeholder="Enter total amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="editFiles" className="block text-sm font-medium text-gray-700 mb-1">
                      Replace Files (Optional)
                    </label>
                    <input
                      id="editFiles"
                      type="file"
                      multiple
                      onChange={(e) => setSelectedFiles(e.target.files)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing files</p>
                  </div>
                  {editingFile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Files</label>
                      <div className="flex flex-col gap-1">
                        {editingFile.fileUrls.length > 0 ? (
                          editingFile.fileUrls.map((url, idx) => (
                            <a
                              key={idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={url.split("/").pop()}
                              className="inline-flex items-center text-blue-600 hover:underline text-sm"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              {url.split("/").pop() || `File ${idx + 1}`}
                            </a>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs">No files</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleEditModalClose}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateFileRecord}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      "Update Record"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <div className="fixed top-4 right-4 space-y-2 z-50">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`max-w-sm w-full shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ${
                toast.type === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {toast.type === "success" ? (
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-3 h-3 text-red-600" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p
                      className={`text-sm font-medium ${toast.type === "success" ? "text-green-900" : "text-red-900"}`}
                    >
                      {toast.title}
                    </p>
                    <p className={`mt-1 text-sm ${toast.type === "success" ? "text-green-700" : "text-red-700"}`}>
                      {toast.description}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => removeToast(toast.id)}
                      className={`rounded-md inline-flex ${
                        toast.type === "success"
                          ? "text-green-400 hover:text-green-500 focus:ring-green-600"
                          : "text-red-400 hover:text-red-500 focus:ring-red-600"
                      } focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
