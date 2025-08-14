"use client"

import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { Mail, Lock, Loader2 } from "lucide-react"

interface LoginResponse {
  success: boolean
  message: string
  refreshToken?: string
}

interface ValidateResponse {
  success: boolean
  message: string
  userId?: string
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Step 1: Login
      const loginResponse = await axios.post<LoginResponse>(
        "http://localhost:5000/api/user/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      )

      if (loginResponse.data.success && loginResponse.data.refreshToken) {
        const refreshToken = loginResponse.data.refreshToken
        localStorage.setItem("refreshToken", refreshToken)

        // Step 2: Validate refreshToken
        const validateResponse = await axios.post<ValidateResponse>(
          "http://localhost:5000/api/user/validate",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        )

        if (validateResponse.data.success && validateResponse.data.userId) {
          navigate("/admin")
        } else {
          setError("Token validation failed.")
        }
      } else {
        setError("Login failed: Invalid response from server")
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(err.response.data?.message || "Invalid email or password")
        } else if (err.request) {
          setError("Unable to connect to server")
        } else {
          setError("An unexpected error occurred")
        }
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-600">SusaInvoice</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to manage your invoices</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2 text-sm">
            <svg className="w-5 h-5 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-2 px-4 text-sm font-semibold text-white rounded-lg shadow-md transition duration-200 ${
                loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
