"use client"

import { useState } from "react"
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  FileIcon as FileInvoice,
  LogOut,
  Menu,
  X,
  
  // Plus,
} from "lucide-react"
import axios from "axios"

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const navigationItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/files", icon: FolderOpen, label: "Files" },
    { to: "/admin/company", icon: FileText, label: "Companies" },
  
  ]

  const getPageTitle = () => {
    const currentItem = navigationItems.find((item) => item.to === location.pathname)
    return currentItem ? currentItem.label : "Dashboard"
  }

const handleLogout = async () => {
  try {
    await axios.post("http://localhost:5000/api/user/logout");

    localStorage.clear();
    navigate("/");
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100/70">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-all duration-300 ease-out"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-slate-200/50 transform transition-all duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200/50 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center ring-2 ring-white/30">
              <FileInvoice className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-white tracking-tight">Susa Invoice</span>
              <span className="text-indigo-100/90 text-xs font-medium">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col p-6 space-y-1 overflow-y-auto h-[calc(100vh-5rem)]">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }: { isActive: boolean }) => `
                    group flex items-center px-4 py-3 text-sm rounded-xl transition-all duration-200
                    ${isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }
                  `}
                >
                  <Icon className="mr-3 h-5 w-5 text-slate-500 group-hover:text-slate-700" />
                  <span>{item.label}</span>
                </NavLink>
              )
            })}
          </div>

          <div className="pt-6 mt-auto border-t border-slate-200/60">
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-slate-500" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-200/50 flex justify-between items-center px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none transition-all duration-200"
            >
              <Menu size={22} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
              <p className="text-xs text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-amber-400 hover:bg-amber-500 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 text-sm">
              <Plus size={16} />
              <span>Sales Invoice</span>
            </button>
            <button className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 text-sm">
              <Plus size={16} />
              <span>Purchase Invoice</span>
            </button>
          </div> */}
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
