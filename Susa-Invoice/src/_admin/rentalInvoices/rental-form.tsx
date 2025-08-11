"use client"

import { Plus, Minus, Phone, Mail } from "lucide-react"
import type { CompanyDetails, RentalInvoiceData } from "./rental-types"

interface RentalFormProps {
  invoiceData: RentalInvoiceData
  isEditingMode: boolean
  updateInvoiceData: (path: string, value: any) => void
  calculateAmounts: () => void
  companyDetails: CompanyDetails
  isPhysicalCopy: boolean
  invoiceType?: 'ADVANCE' | 'PARTIAL' | 'FULL'
}

export default function RentalForm({
  invoiceData,
  isEditingMode,
  updateInvoiceData,
  calculateAmounts,
  companyDetails,
  // isPhysicalCopy,
  invoiceType = 'ADVANCE',
}: RentalFormProps) {

  const addItem = () => {
    const newItem = {
      productName: "",
      duration: 1,
      durationUnit: "days",
      hsnCode: "",
      amount: 0,
      rentedQuantity: 1,
      returnedQuantity: "",
      dailyRate: 0,
      totalDays: 1,
      rentAmount: 0,
      startDate: "",
      endDate: "",
      partialReturnDate: "",
    }
    updateInvoiceData("items", [...invoiceData.items, newItem])
  }

  const removeItem = (index: number) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index)
    updateInvoiceData("items", newItems)
    setTimeout(calculateAmounts, 0)
  }

  const updateItem = (index: number, field: string, value: any) => {
    
    const newItems = [...invoiceData.items]
    // Preserve all existing fields and only update the specific field
    newItems[index] = { ...newItems[index], [field]: value }
    
    
    // Auto-calculate rent amount when quantity, rate, days, or partial return changes
    if (field === 'rentedQuantity' || field === 'dailyRate' || field === 'totalDays' || field === 'returnedQuantity' || field === 'partialReturnDate') {
      const item = newItems[index]
      
      let calculatedRent = 0
      
      if (invoiceType === 'PARTIAL') {
        // Determine counts
        const rentedQty = typeof item.rentedQuantity === 'string' 
          ? parseFloat(item.rentedQuantity) || 0 
          : item.rentedQuantity || 0

        const originalReturned = typeof (item as any).originalReturnedQuantity === 'string'
          ? parseFloat((item as any).originalReturnedQuantity) || 0
          : ((item as any).originalReturnedQuantity || 0)

        const currentReturnedInput = field === 'returnedQuantity'
          ? (typeof value === 'string' ? parseFloat(value) || 0 : value || 0)
          : (typeof item.returnedQuantity === 'string' ? parseFloat(item.returnedQuantity) || 0 : item.returnedQuantity || 0)

        const returnedQty = Math.max(0, Math.min(currentReturnedInput, Math.max(0, rentedQty - originalReturned)))
        const remainingQty = Math.max(0, rentedQty - originalReturned - returnedQty)
        // PARTIAL RETURN LOGIC: Split calculation for returned and remaining items
        const rate = typeof item.dailyRate === 'string' 
          ? parseFloat(item.dailyRate) || 0 
          : item.dailyRate || 0
        
        // Calculate days for returned items (from start to partial return date or current date)
        let returnedDays = 0
        if (item.startDate) {
          const start = new Date(item.startDate)
          // Use partial return date if available, otherwise use current date
          const returnDate = item.partialReturnDate ? new Date(item.partialReturnDate) : new Date()
          const diffTime = Math.abs(returnDate.getTime() - start.getTime())
          returnedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        }
        
        // Calculate days for remaining items (from start to original end date)
        let totalDays = 0
        if (item.startDate && item.endDate) {
          const start = new Date(item.startDate)
          const end = new Date(item.endDate)
          const diffTime = Math.abs(end.getTime() - start.getTime())
          totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        }
        
        // Calculate rent: returned items pay for partial period, remaining items pay for full period
        const returnedItemsRent = returnedQty * rate * returnedDays
        const remainingItemsRent = remainingQty * rate * totalDays
        
        calculatedRent = returnedItemsRent + remainingItemsRent
        
        
      } else {
        // NORMAL CALCULATION: Standard rent calculation
        const days = typeof item.totalDays === 'string' 
          ? parseFloat(item.totalDays) || 1 
          : item.totalDays || 1
        
        const quantity = typeof item.rentedQuantity === 'string' 
          ? parseFloat(item.rentedQuantity) || 0 
          : item.rentedQuantity || 0
        
        const rate = typeof item.dailyRate === 'string' 
          ? parseFloat(item.dailyRate) || 0 
          : item.dailyRate || 0
        
        calculatedRent = quantity * rate * days
      }
      
      // Only update calculation fields, preserve all other fields
      newItems[index] = {
        ...newItems[index], // Keep all existing fields
        rentAmount: calculatedRent,
        amount: calculatedRent
      }
    }
    
    
    updateInvoiceData("items", newItems)
    setTimeout(calculateAmounts, 0)
  }

  return (
    <div>
      {/* Bill To & Ship To - Enhanced Design */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "24px", 
        marginBottom: "24px",
        padding: "20px",
        backgroundColor: "#f8fafc",
        borderRadius: "8px",
        border: "1px solid #e2e8f0"
      }}>
        {/* Bill To Section */}
        <div style={{
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: "2px solid #2563eb"
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              backgroundColor: "#2563eb",
              borderRadius: "50%",
              marginRight: "8px"
            }}></div>
            <h3 style={{ 
              fontWeight: "bold", 
              color: "#2563eb", 
              fontSize: "16px",
              margin: 0
            }}>Bill To</h3>
          </div>
          
          <div style={{ fontSize: "14px" }}>
            {isEditingMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151",
                    fontSize: "13px"
                  }}>Client Name *</label>
                  <input
                    type="text"
                    placeholder="Enter client name"
                    value={invoiceData.billTo.name}
                    onChange={(e) => updateInvoiceData("billTo.name", e.target.value)}
                    style={{
                      width: "100%",
                      border: "2px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      transition: "border-color 0.2s",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151",
                    fontSize: "13px"
                  }}>Address *</label>
                  <textarea
                    placeholder="Enter complete address"
                    value={invoiceData.billTo.address}
                    onChange={(e) => updateInvoiceData("billTo.address", e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      border: "2px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      resize: "vertical",
                      transition: "border-color 0.2s",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151",
                    fontSize: "13px"
                  }}>GSTIN</label>
                  <input
                    type="text"
                    placeholder="Enter GSTIN (optional)"
                    value={invoiceData.billTo.gstin}
                    onChange={(e) => updateInvoiceData("billTo.gstin", e.target.value)}
                    style={{
                      width: "100%",
                      border: "2px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      transition: "border-color 0.2s",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#2563eb"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
              </div>
            ) : (
              <div style={{ lineHeight: "1.6" }}>
                <div style={{ 
                  fontWeight: "600", 
                  marginBottom: "8px", 
                  color: "#1f2937",
                  fontSize: "15px"
                }}>{invoiceData.billTo.name || "[Client Name]"}</div>
                <div style={{ 
                  marginBottom: "8px", 
                  whiteSpace: "pre-line",
                  color: "#4b5563"
                }}>{invoiceData.billTo.address || "[Client Address]"}</div>
                {invoiceData.billTo.gstin && (
                  <div style={{ 
                    fontSize: "13px", 
                    color: "#6b7280",
                    backgroundColor: "#f3f4f6",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    display: "inline-block"
                  }}>
                    <strong>GSTIN:</strong> {invoiceData.billTo.gstin}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Ship To Section */}
        <div style={{
          backgroundColor: "white",
          padding: "16px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: "2px solid #059669"
          }}>
            <div style={{
              width: "6px",
              height: "6px",
              backgroundColor: "#059669",
              borderRadius: "50%",
              marginRight: "8px"
            }}></div>
            <h3 style={{ 
              fontWeight: "bold", 
              color: "#059669", 
              fontSize: "16px",
              margin: 0
            }}>Ship To</h3>
          </div>
          
          <div style={{ fontSize: "14px" }}>
            {isEditingMode ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151",
                    fontSize: "13px"
                  }}>Shipping Name</label>
                  <input
                    type="text"
                    placeholder="Enter shipping name (optional)"
                    value={invoiceData.shipTo.name}
                    onChange={(e) => updateInvoiceData("shipTo.name", e.target.value)}
                    style={{
                      width: "100%",
                      border: "2px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      transition: "border-color 0.2s",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#059669"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151",
                    fontSize: "13px"
                  }}>Shipping Address</label>
                  <textarea
                    placeholder="Enter shipping address (optional)"
                    value={invoiceData.shipTo.address}
                    onChange={(e) => updateInvoiceData("shipTo.address", e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      border: "2px solid #e5e7eb",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      fontSize: "14px",
                      resize: "vertical",
                      transition: "border-color 0.2s",
                      outline: "none"
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#059669"}
                    onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                
                <div style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  fontStyle: "italic",
                  backgroundColor: "#f0fdf4",
                  padding: "6px 8px",
                  borderRadius: "4px",
                  border: "1px solid #bbf7d0"
                }}>
                   Leave empty to use Bill To address
                </div>
              </div>
            ) : (
              <div style={{ lineHeight: "1.6" }}>
                <div style={{ 
                  fontWeight: "600", 
                  marginBottom: "8px", 
                  color: "#1f2937",
                  fontSize: "15px"
                }}>{invoiceData.shipTo.name || "Same as Bill To"}</div>
                <div style={{ 
                  whiteSpace: "pre-line",
                  color: "#4b5563"
                }}>{invoiceData.shipTo.address || invoiceData.billTo.address || "[Same as Bill To Address]"}</div>
                {!invoiceData.shipTo.address && (
                  <div style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontStyle: "italic",
                    marginTop: "6px"
                  }}>
                     Using Bill To address for shipping
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Items Table - Compact */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <h3 style={{ fontWeight: "bold", color: "#1f2937", fontSize: "14px" }}>Items:</h3>
          {isEditingMode && (
            <button
              onClick={addItem}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: "3px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              Add Item
            </button>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #d1d5db" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "left", fontSize: "11px", fontWeight: "600" }}>
                  S.No.
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "left", fontSize: "11px", fontWeight: "600" }}>
                  Product/Service
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                  Quantity
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                  Daily Rate (₹)
                </th>
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                  Start Date
                </th>
                {invoiceType === 'PARTIAL' ? (
                  <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                    Partial Return Date
                  </th>
                ) : (
                  <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                    End Date
                  </th>
                )}
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                  Days
                </th>
                {invoiceType === 'PARTIAL' ? (
                  <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                    Return Quantity
                  </th>
                ) : (
                  <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px", fontWeight: "600" }}>
                    HSN Code
                  </th>
                )}
                <th style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "right", fontSize: "11px", fontWeight: "600" }}>
                  Amount (₹)
                </th>
                {isEditingMode && (
                  <th style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "center", fontSize: "12px", fontWeight: "600" }}>
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {index + 1}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "8px", fontSize: "12px" }}>
                    {isEditingMode ? (
                      <input
                        type="text"
                        value={item.productName}
                        onChange={(e) => updateItem(index, "productName", e.target.value)}
                        style={{
                          border: "none",
                          width: "100%",
                          fontSize: "12px",
                          padding: "4px",
                        }}
                      />
                    ) : (
                      <div>
                        <div style={{ fontWeight: "500" }}>{item.productName}</div>
                        {/* Show returned quantity only for partial-return and full-settlement */}
                        {(invoiceType === 'PARTIAL' || invoiceType === 'FULL') && item.returnedQuantity && (typeof item.returnedQuantity === 'string' ? parseFloat(item.returnedQuantity) : item.returnedQuantity) > 0 && (
                          <div style={{ fontSize: "10px", color: "#dc2626" }}>
                            Returned: {item.returnedQuantity}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {isEditingMode ? (
                      <input
                        type="number"
                        min="0"
                        value={item.rentedQuantity || item.duration}
                        onChange={(e) => updateItem(index, "rentedQuantity", parseInt(e.target.value) || 0)}
                        style={{
                          border: "none",
                          width: "60px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      />
                    ) : (
                      <div>
                        {item.rentedQuantity || item.duration}
                        {item.returnedQuantity && (typeof item.returnedQuantity === 'string' ? parseFloat(item.returnedQuantity) : item.returnedQuantity) > 0 && (
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>(-{item.returnedQuantity})</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {isEditingMode ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.dailyRate || 0}
                        onChange={(e) => updateItem(index, "dailyRate", parseFloat(e.target.value) || 0)}
                        style={{
                          border: "none",
                          width: "80px",
                          textAlign: "center",
                          fontSize: "12px",
                        }}
                      />
                    ) : (
                      `₹${item.dailyRate || 0}`
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {isEditingMode ? (
                      <input
                        type="date"
                        defaultValue={item.startDate || ""}
                        onBlur={(e) => {
                          const newValue = e.target.value
                          if (newValue !== item.startDate) {
                            updateItem(index, "startDate", newValue)
                            // Auto-calculate days if both dates are set
                            if (item.endDate && newValue) {
                              const start = new Date(newValue)
                              const end = new Date(item.endDate)
                              const diffTime = Math.abs(end.getTime() - start.getTime())
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                              updateItem(index, "totalDays", diffDays)
                            }
                            setTimeout(() => calculateAmounts(), 0)
                          }
                        }}
                        onChange={(e) => {
                          // Immediate update for better UX
                          const newValue = e.target.value
                          updateItem(index, "startDate", newValue)
                          if (item.endDate && newValue) {
                            const start = new Date(newValue)
                            const end = new Date(item.endDate)
                            const diffTime = Math.abs(end.getTime() - start.getTime())
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                            updateItem(index, "totalDays", diffDays)
                          }
                        }}
                        style={{
                          border: "none",
                          width: "120px",
                          textAlign: "center",
                          fontSize: "11px",
                          backgroundColor: "transparent",
                          outline: "none"
                        }}
                      />
                    ) : (
                      item.startDate ? new Date(item.startDate).toLocaleDateString('en-GB') : "Not Set"
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {invoiceType === 'PARTIAL' ? (
                      isEditingMode ? (
                        <input
                          type="date"
                          value={item.partialReturnDate || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            
                            // Calculate days if both dates are set
                            let calculatedDays = item.totalDays
                            if (item.startDate && newValue) {
                              const start = new Date(item.startDate)
                              const end = new Date(newValue)
                              const diffTime = Math.abs(end.getTime() - start.getTime())
                              calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                            }
                            
                            // Update both fields in single operation to prevent UI delay
                            const newItems = [...invoiceData.items]
                            newItems[index] = {
                              ...newItems[index],
                              partialReturnDate: newValue,
                              totalDays: calculatedDays
                            }
                            
                            updateInvoiceData("items", newItems)
                            setTimeout(() => calculateAmounts(), 0)
                          }}
                          style={{
                            border: "none",
                            width: "120px",
                            textAlign: "center",
                            fontSize: "11px",
                            backgroundColor: "transparent",
                            outline: "none"
                          }}
                        />
                      ) : (
                        item.partialReturnDate ? new Date(item.partialReturnDate).toLocaleDateString('en-GB') : "Not Set"
                      )
                    ) : (
                      isEditingMode ? (
                        <input
                          type="date"
                          value={item.endDate || ""}
                          onChange={(e) => {
                            const newValue = e.target.value
                            
                            // Calculate days if both dates are set
                            let calculatedDays = item.totalDays
                            if (item.startDate && newValue) {
                              const start = new Date(item.startDate)
                              const end = new Date(newValue)
                              const diffTime = Math.abs(end.getTime() - start.getTime())
                              calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                            }
                            
                            // Update both endDate and totalDays in one go
                            const newItems = [...invoiceData.items]
                            newItems[index] = {
                              ...newItems[index],
                              endDate: newValue,
                              totalDays: calculatedDays
                            }
                            
                            // Recalculate rent amount with new days
                            const quantity = typeof newItems[index].rentedQuantity === 'string' 
                              ? parseFloat(newItems[index].rentedQuantity) || 0 
                              : newItems[index].rentedQuantity || 0
                            const rate = typeof newItems[index].dailyRate === 'string' 
                              ? parseFloat(newItems[index].dailyRate) || 0 
                              : newItems[index].dailyRate || 0
                            const days = typeof calculatedDays === 'string' 
                              ? parseFloat(calculatedDays) || 1 
                              : calculatedDays || 1
                            
                            const calculatedRent = quantity * rate * days
                            newItems[index].rentAmount = calculatedRent
                            newItems[index].amount = calculatedRent
                            
                            
                            updateInvoiceData("items", newItems)
                            setTimeout(() => calculateAmounts(), 0)
                          }}
                          style={{
                            border: "none",
                            width: "120px",
                            textAlign: "center",
                            fontSize: "11px",
                            backgroundColor: "transparent",
                            outline: "none"
                          }}
                        />
                      ) : (
                        item.endDate ? new Date(item.endDate).toLocaleDateString('en-GB') : "Not Set"
                      )
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {item.totalDays || 0}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px", textAlign: "center", fontSize: "11px" }}>
                    {invoiceType === 'PARTIAL' ? (
                      isEditingMode ? (
                        <input
                          type="number"
                          min="0"
                          max={(typeof item.rentedQuantity === 'string' ? parseInt(item.rentedQuantity) || 0 : item.rentedQuantity || 0) - (typeof (item as any).originalReturnedQuantity === 'string' ? parseInt((item as any).originalReturnedQuantity) || 0 : ((item as any).originalReturnedQuantity || 0))}
                          value={item.returnedQuantity || ""}
                          onChange={(e) => {
                            const inputVal = parseInt(e.target.value) || 0
                            const rentedQty = typeof item.rentedQuantity === 'string' 
                              ? parseInt(item.rentedQuantity) || 0 
                              : item.rentedQuantity || 0
                            const originalReturned = typeof (item as any).originalReturnedQuantity === 'string'
                              ? parseInt((item as any).originalReturnedQuantity) || 0
                              : ((item as any).originalReturnedQuantity || 0)

                            const maxAllowed = Math.max(0, rentedQty - originalReturned)
                            const clamped = Math.max(0, Math.min(inputVal, maxAllowed))

                            // Auto-set partialReturnDate if returning something and date empty
                            if (clamped > 0 && (!item.partialReturnDate || String(item.partialReturnDate).trim() === '')) {
                              const today = new Date().toISOString().split('T')[0]
                              updateItem(index, 'partialReturnDate', today)
                            }

                            updateItem(index, "returnedQuantity", clamped)
                          }}
                          style={{
                            border: "none",
                            width: "80px",
                            textAlign: "center",
                            fontSize: "12px",
                          }}
                          placeholder="0"
                        />
                      ) : (
                        item.returnedQuantity || "0"
                      )
                    ) : (
                      isEditingMode ? (
                        <input
                          type="text"
                          value={item.hsnCode || ""}
                          onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                          style={{
                            border: "none",
                            width: "80px",
                            textAlign: "center",
                            fontSize: "12px",
                          }}
                        />
                      ) : (
                        item.hsnCode || ""
                      )
                    )}
                  </td>
                  <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontSize: "12px", fontWeight: "500" }}>
                    ₹{(item.rentAmount || item.amount || 0).toLocaleString()}
                  </td>
                  {isEditingMode && (
                    <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "center" }}>
                      <button
                        onClick={() => removeItem(index)}
                        style={{
                          backgroundColor: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px",
                          cursor: "pointer",
                        }}
                      >
                        <Minus style={{ width: "12px", height: "12px" }} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            
            <tfoot>
              {/* Subtotal */}
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>Subtotal</td>
                <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>₹{(invoiceData.subtotal || 0).toFixed(2)}</td>
                {isEditingMode && <td></td>}
              </tr>

              {/* Tax */}
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, fontSize: 14 }}>
                    Taxes:
                    {isEditingMode ? (
                      <>
                        <input type="number" value={invoiceData.cgstRate} onChange={e => { updateInvoiceData("cgstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% CGST +
                        <input type="number" value={invoiceData.sgstRate} onChange={e => { updateInvoiceData("sgstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% SGST +
                        <input type="number" value={invoiceData.ugstRate} onChange={e => { updateInvoiceData("ugstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% UGST +
                        <input type="number" value={invoiceData.igstRate} onChange={e => { updateInvoiceData("igstRate", Number(e.target.value) || 0); calculateAmounts()}} style={{ width: 48, padding: "2px 4px", textAlign: "center" }} />% IGST
                      </>
                    ) : (
                      <span>{invoiceData.cgstRate}% CGST + {invoiceData.sgstRate}% SGST + {invoiceData.ugstRate}% UGST + {invoiceData.igstRate}% IGST</span>
                    )}
                  </div>
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right", fontWeight: 500 }}>₹{(invoiceData.totalTaxAmount || 0).toFixed(2)}</td>
                {isEditingMode && <td></td>}
              </tr>

              {/* Total */}
              <tr style={{ backgroundColor: "#dbeafe", fontWeight: "bold" }}>
                <td colSpan={6} style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}><strong>Total Amount</strong></td>
                <td style={{ border: "1px solid #d1d5db", padding: "8px", textAlign: "right" }}><strong>₹{(invoiceData.totalAmount || 0).toFixed(2)}</strong></td>
                {isEditingMode && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Advance Amount Section - Clean placement after GST */}
      {invoiceType === 'ADVANCE' && (
        <div style={{ 
          backgroundColor: "#fef3c7", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px",
          border: "1px solid #f59e0b",
          marginTop: "16px"
        }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "12px", color: "#92400e", fontSize: "16px" }}> Advance Payment Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "14px" }}>
            <div>
              {isEditingMode ? (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#92400e" }}>Advance Amount:</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceData.paymentDetails?.advanceAmount || ''}
                    onChange={(e) => {
                      updateInvoiceData("paymentDetails.advanceAmount", e.target.value)
                      setTimeout(calculateAmounts, 0)
                    }}
                    style={{
                      border: "2px solid #f59e0b",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "16px",
                      width: "100%",
                      backgroundColor: "#fffbeb"
                    }}
                    placeholder="Enter advance amount (₹)"
                  />
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Advance Amount:</span>
                  <span style={{ fontWeight: "bold", fontSize: "18px", color: "#059669" }}>₹{(invoiceData.paymentDetails?.advanceAmount || 0).toLocaleString()}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#6b7280" }}>
                <span>Total Invoice Amount:</span>
                <span>₹{(invoiceData.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold", fontSize: "16px" }}>
                <span>Outstanding Balance:</span>
                <span style={{ color: "#dc2626" }}>
                  ₹{((invoiceData.totalAmount || 0) - (typeof invoiceData.paymentDetails?.advanceAmount === 'string' ? parseFloat(invoiceData.paymentDetails.advanceAmount) || 0 : invoiceData.paymentDetails?.advanceAmount || 0)).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#fffbeb", padding: "8px", borderRadius: "4px", border: "1px solid #fbbf24" }}>
                 This balance will be collected upon delivery/completion of rental service
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Partial Payment Section for PARTIAL invoice type */}
      {invoiceType === 'PARTIAL' && (
        <div style={{ 
          backgroundColor: "#ecfdf5", 
          padding: "16px", 
          borderRadius: "8px", 
          marginBottom: "24px",
          border: "1px solid #10b981",
          marginTop: "16px"
        }}>
          <h3 style={{ fontWeight: "bold", marginBottom: "12px", color: "#065f46", fontSize: "16px" }}> Partial Return Payment Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", fontSize: "14px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontWeight: "600" }}>Original Advance:</span>
                <span style={{ fontWeight: "bold", fontSize: "16px", color: "#059669" }}>₹{(invoiceData.paymentDetails?.advanceAmount || 0).toLocaleString()}</span>
              </div>
              
              {isEditingMode ? (
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", color: "#065f46" }}>Partial Payment Amount:</label>
                  <input
                    type="number"
                    min="0"
                    value={invoiceData.paymentDetails?.paidAmount || ''}
                    onChange={(e) => {
                      updateInvoiceData("paymentDetails.paidAmount", parseFloat(e.target.value) || 0)
                      setTimeout(calculateAmounts, 0)
                    }}
                    style={{
                      border: "2px solid #10b981",
                      padding: "10px",
                      borderRadius: "6px",
                      fontSize: "16px",
                      width: "100%",
                      backgroundColor: "#f0fdf4"
                    }}
                    placeholder="Enter partial payment (₹)"
                  />
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600" }}>Partial Payment:</span>
                  <span style={{ fontWeight: "bold", fontSize: "16px", color: "#dc2626" }}>₹{(invoiceData.paymentDetails?.paidAmount || 0).toLocaleString()}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#6b7280" }}>
                <span>Current Invoice Total:</span>
                <span>₹{(invoiceData.totalAmount || 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px", color: "#059669" }}>
                <span>Total Paid (Advance + Partial):</span>
                <span>₹{((parseFloat(String(invoiceData.paymentDetails?.advanceAmount || 0)) || 0) + (invoiceData.paymentDetails?.paidAmount || 0)).toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontWeight: "bold", fontSize: "16px" }}>
                <span>Remaining Outstanding:</span>
                <span style={{ color: "#dc2626" }}>
                  ₹{(Math.max(0, (invoiceData.totalAmount || 0) - ((parseFloat(String(invoiceData.paymentDetails?.advanceAmount || 0)) || 0) + (invoiceData.paymentDetails?.paidAmount || 0)))).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", fontStyle: "italic", backgroundColor: "#f0fdf4", padding: "8px", borderRadius: "4px", border: "1px solid #34d399" }}>
                 Outstanding amount updated based on partial returns and payments
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Payment Terms and Bank Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 24, marginBottom: 24 }}>
        {/* Payment Terms */}
        <div>
          <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: 8 }}>Payment Terms</h3>
          {isEditingMode ? (
            <textarea
              value={invoiceData.paymentTerms}
              onChange={(e) => updateInvoiceData("paymentTerms", e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", padding: 8, height: 80, resize: "none" }}
            />
          ) : (
            <div style={{ fontSize: 14, whiteSpace: "pre-line" }}>{invoiceData.paymentTerms}</div>
          )}

          <h3 style={{ fontWeight: "bold", color: "#2563eb", marginTop: 16, marginBottom: 8 }}>Terms & Conditions</h3>
          {isEditingMode ? (
            <textarea
              value={invoiceData.termsConditions}
              onChange={(e) => updateInvoiceData("termsConditions", e.target.value)}
              style={{ width: "100%", border: "1px solid #d1d5db", padding: 8, height: 80, resize: "none" }}
            />
          ) : (
            <div style={{ fontSize: 14, whiteSpace: "pre-line" }}>{invoiceData.termsConditions}</div>
          )}
        </div>

        {/* Bank Details */}
        <div>
          <h3 style={{ fontWeight: "bold", color: "#2563eb", marginBottom: 8 }}>Bank Details</h3>
          <div style={{ fontSize: 14 }}>
            {[
              { label: "Bank Name", key: "bankName" },
              { label: "Account Name", key: "accountName" },
              { label: "Account No.", key: "accountNumber" },
              { label: "IFSC Code", key: "ifscCode" },
            ].map(({ label, key }) => (
              <div key={label} style={{ display: "flex", marginBottom: 8 }}>
                <span style={{ fontWeight: 500, width: 96 }}>{label}:</span>
                {isEditingMode ? (
                  <input
                    type="text"
                    value={invoiceData.bankDetails[key as keyof typeof invoiceData.bankDetails]}
                    onChange={(e) => updateInvoiceData(`bankDetails.${key}`, e.target.value)}
                    style={{ flex: 1, border: "1px solid #d1d5db", padding: 8 }}
                  />
                ) : (
                  <span>{invoiceData.bankDetails[key as keyof typeof invoiceData.bankDetails]}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 24, borderTop: "1px solid #d1d5db" }}>
        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{ borderBottom: "1px solid #6b7280", width: 192, marginBottom: 8 }}></div>
          <p style={{ fontSize: 14, margin: 0 }}>Authorized Signatory</p>
          <p style={{ fontSize: 14, margin: 0 }}>For {companyDetails.name}</p>
          {/* Stamp removed to avoid overlay issues */}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ borderBottom: "1px solid #6b7280", width: 128, marginBottom: 8 }}></div>
          <p style={{ fontSize: 14, margin: 0 }}>Customer Signature</p>
        </div>
      </div>

      {/* Thank-you note */}
      <div style={{ textAlign: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb", color: "#2563eb" }}>
        <p style={{ fontSize: 14, margin: 0 }}>
          Thank you for your business! 
          <Phone style={{ width: 12, height: 12, display: "inline", margin: "0 4px" }} />
          {companyDetails.phone} 
          <Mail style={{ width: 12, height: 12, display: "inline", margin: "0 4px" }} />
          {companyDetails.email}
        </p>
      </div>
    </div>
  )
}

