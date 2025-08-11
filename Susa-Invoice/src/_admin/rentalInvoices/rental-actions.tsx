"use client"

import { Edit, Download, Eye, EyeOff } from "lucide-react"

interface RentalActionsProps {
  isEditingMode: boolean
  setIsEditingMode: (editing: boolean) => void
  handleTaxPDF?: () => void
  handleProformaPDF?: () => void
  handleSave?: () => Promise<void>
  handlePrint?: () => void
  handleDownloadPDF?: () => void
  isPhysicalCopy?: boolean
  setIsPhysicalCopy?: (physical: boolean) => void
  showLabels?: boolean
  setShowLabels?: (show: boolean) => void
  isGeneratingPDF?: boolean
  isSaving?: boolean
  showPhysicalToggle?: boolean
  showEditButton?: boolean
}

export default function RentalActions({
  isEditingMode,
  setIsEditingMode,
  handleTaxPDF,
  handleProformaPDF,
  handleSave,
  handlePrint,
  handleDownloadPDF,
  isPhysicalCopy,
  setIsPhysicalCopy,
  isGeneratingPDF = false,
  isSaving = false,
  showPhysicalToggle = true,
  showEditButton = true,
}: RentalActionsProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px",
        backgroundColor: "#f9fafb",
        borderTop: "1px solid #e5e7eb",
        marginTop: "24px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {showEditButton && (
          <button
            onClick={() => setIsEditingMode(!isEditingMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: isEditingMode ? "#dc2626" : "#2563eb",
              color: "white",
              border: "none",
              padding: "10px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Edit style={{ width: "16px", height: "16px" }} />
            {isEditingMode ? "Cancel Edit" : "Edit Invoice"}
          </button>
        )}


      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        {/* Toggle Button */}
        {showPhysicalToggle && typeof isPhysicalCopy === 'boolean' && typeof setIsPhysicalCopy === 'function' && (
          <button
            onClick={() => setIsPhysicalCopy(!isPhysicalCopy)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: isPhysicalCopy ? "#2563eb" : "#e5e7eb",
              color: isPhysicalCopy ? "white" : "#374151",
              border: "none",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {isPhysicalCopy ? (
              <Eye style={{ width: "14px", height: "14px" }} />
            ) : (
              <EyeOff style={{ width: "14px", height: "14px" }} />
            )}
            Physical Copy
          </button>
        )}

        {/* Action Buttons - Conditional based on invoice type */}
        <div style={{ display: "flex", gap: "8px" }}>
          {/* For Advance Invoices - Tax/Proforma PDF buttons */}
          {handleTaxPDF && handleProformaPDF && (
            <>
              <button
                onClick={handleProformaPDF}
                disabled={isGeneratingPDF || isEditingMode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: (isGeneratingPDF || isEditingMode) ? "#9ca3af" : "#059669",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: (isGeneratingPDF || isEditingMode) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: isEditingMode ? 0.5 : 1,
                }}
                title={isEditingMode ? "Please finish editing to generate PDF" : ""}
              >
                <Download style={{ width: "16px", height: "16px" }} />
                {isGeneratingPDF ? "Generating..." : "Proforma PDF"}
              </button>

              <button
                onClick={handleTaxPDF}
                disabled={isGeneratingPDF || isEditingMode}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: (isGeneratingPDF || isEditingMode) ? "#9ca3af" : "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: (isGeneratingPDF || isEditingMode) ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: isEditingMode ? 0.5 : 1,
                }}
                title={isEditingMode ? "Please finish editing to generate PDF" : ""}
              >
                <Download style={{ width: "16px", height: "16px" }} />
                {isGeneratingPDF ? "Generating..." : "Tax PDF"}
              </button>
            </>
          )}

          {/* For Partial Return - Save/Print/Download buttons */}
          {handleSave && (
            <>
              {isEditingMode && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: isSaving ? "#9ca3af" : "#2563eb",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Download style={{ width: "16px", height: "16px" }} />
                  {isSaving ? "Saving..." : "Save Invoice"}
                </button>
              )}
              
              {!isEditingMode && handlePrint && (
                <button
                  onClick={handlePrint}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#059669",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Download style={{ width: "16px", height: "16px" }} />
                  Print
                </button>
              )}
              
              {!isEditingMode && handleDownloadPDF && (
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Download style={{ width: "16px", height: "16px" }} />
                  Download PDF
                </button>
              )}
            </>
          )}
        </div>
        
        {/* Edit Mode Hint */}
        {isEditingMode && (
          <div style={{
            fontSize: "12px",
            color: "#dc2626",
            fontStyle: "italic",
            marginLeft: "8px",
            display: "flex",
            alignItems: "center"
          }}>
            {handleTaxPDF || handleProformaPDF
              ? "ðŸ’¡ Finish editing to generate PDFs"
              : handleSave
              ? "ðŸ’¡ Finish editing to save"
              : ""}
          </div>
        )}
      </div>
    </div>
  )
}

