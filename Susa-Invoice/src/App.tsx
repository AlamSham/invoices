import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Suspense, lazy } from "react"

// Lazy load components
const Login = lazy(() => import("./_admin/login"))
const AdminLayout = lazy(() => import("./_admin/AdminLayout"))
const Dashboard = lazy(() => import("./_admin/Dashboard"))
const Company = lazy(() => import("./_admin/Company"))

const Files = lazy(() => import("./_admin/Files"))
const ProtectedRoute = lazy(() => import("./_admin/ProtectedRoute"))

// Rental Invoice System Components
const AllRentalInvoices = lazy(() => import("./_admin/rentalInvoices/all-rental-invoices"))
const AdvanceInvoice = lazy(() => import("./_admin/rentalInvoices/advance-invoice"))
const PartialReturn = lazy(() => import("./_admin/rentalInvoices/partial-return"))
const FullSettlement = lazy(() => import("./_admin/rentalInvoices/full-settlement"))
const RentalDetails = lazy(() => import("./_admin/rentalInvoices/rental-details"))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="text-center p-4">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
              <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="company" element={<Company />} />
          
            <Route path="files" element={<Files />} />
            
            {/* Rental Invoice System Routes */}
            <Route path="rental-invoices/:companyId" element={<AllRentalInvoices />} />
            <Route path="rental/advance/:companyId" element={<AdvanceInvoice />} />
            <Route path="rental/partial/:invoiceId" element={<PartialReturn />} />
            <Route path="rental/full/:invoiceId" element={<FullSettlement />} />
            <Route path="rental/details/:invoiceId" element={<RentalDetails />} />
           
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
