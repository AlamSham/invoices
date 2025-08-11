"use client"

import { MapPin, Phone, Mail } from "lucide-react"
import type { CompanyDetails, RentalInvoiceData } from "./rental-types"

interface RentalHeaderProps {
  companyDetails: CompanyDetails
  invoiceData: RentalInvoiceData
  isEditingMode: boolean
  updateInvoiceData: (path: string, value: any) => void
  invoiceType: 'ADVANCE' | 'PARTIAL' | 'FULL'
}

export default function RentalHeader({
  companyDetails,
  invoiceData,
  isEditingMode,
  updateInvoiceData,
  invoiceType,
}: RentalHeaderProps) {
  const getInvoiceTypeLabel = (type: string) => {
    switch (type) {
      case 'ADVANCE': return 'Advance Rental Invoice'
      case 'PARTIAL': return 'Partial Return Invoice'
      case 'FULL': return 'Final Settlement Invoice'
      default: return 'Rental Invoice'
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "24px",
        paddingBottom: "16px",
        borderBottom: "1px solid #d1d5db",
      }}
    >
      <div style={{ display: "flex", gap: "16px", flex: 1 }}>
        <div style={{ flexShrink: 0 }}>
          <img
            src={companyDetails.logo || "/placeholder.svg"}
            alt="Company Logo"
            style={{ height: "48px", width: "auto", maxHeight: "48px" }}
          />
        </div>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
            {companyDetails.name}
          </h1>
          <div style={{ fontSize: "10px", color: "#4b5563" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px", fontWeight: "bold" }}>
              <MapPin style={{ width: "12px", height: "12px", color: "#2563eb" }} />
              <span>{companyDetails.address}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "bold" }}>
              <span>GSTIN: {companyDetails.gstin}</span>
              <span>PAN: {companyDetails.pan}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", fontWeight: "bold" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Phone style={{ width: "12px", height: "12px", color: "#2563eb" }} />
                <span>{companyDetails.phone}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Mail style={{ width: "12px", height: "12px", color: "#2563eb" }} />
                <span>{companyDetails.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ width: "256px", fontSize: "14px", marginTop: "-50px" }}>


        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: "500" }}>Invoice #:</span>
          <span>{invoiceData.invoiceNumber}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: "500" }}>Date:</span>
          {isEditingMode ? (
            <input
              type="date"
              value={invoiceData.Date}
              onChange={(e) => updateInvoiceData("Date", e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                padding: "4px 8px",
                textAlign: "right",
                width: "96px",
              }}
            />
          ) : (
            <span>{invoiceData.Date}</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: "500" }}>Due Date:</span>
          {isEditingMode ? (
            <input
              type="date"
              value={invoiceData.dueDate || ""}
              onChange={(e) => updateInvoiceData("dueDate", e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                padding: "4px 8px",
                textAlign: "right",
                width: "96px",
              }}
            />
          ) : (
            <span>{invoiceData.dueDate || "Not Set"}</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: "500" }}>P.O. #:</span>
          {isEditingMode ? (
            <input
              type="text"
              value={invoiceData.poNumber || ""}
              onChange={(e) => updateInvoiceData("poNumber", e.target.value)}
              style={{
                border: "1px solid #d1d5db",
                padding: "4px 8px",
                textAlign: "right",
                width: "96px",
              }}
            />
          ) : (
            <span>{invoiceData.poNumber || "N/A"}</span>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontWeight: "500" }}>Type:</span>
          <span style={{ 
            color: "#2563eb", 
            fontWeight: "bold",
            fontSize: "12px"
          }}>
            {getInvoiceTypeLabel(invoiceType)}
          </span>
        </div>
        {invoiceData.rentalDetails && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: "500" }}>Status:</span>
            <span style={{ 
              color: invoiceData.rentalDetails.status === 'ACTIVE' ? '#059669' : 
                     invoiceData.rentalDetails.status === 'PARTIAL_RETURN' ? '#d97706' : '#dc2626',
              fontWeight: "bold",
              fontSize: "12px"
            }}>
              {invoiceData.rentalDetails.status}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

