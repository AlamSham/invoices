// src/_admin/ProtectedRoute.tsx
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import axios from "axios"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    const validateToken = async () => {
      const refreshToken = localStorage.getItem("refreshToken")

      if (!refreshToken) {
        setIsValid(false)
        return
      }

      try {
        const res = await axios.post(
          "https://invoices-dk2w.onrender.com/api/user/validate",
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        )

        if (res.data.success) {
          setIsValid(true)
        } else {
          setIsValid(false)
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setIsValid(false)
      }
    }

    validateToken()
  }, [])

  if (isValid === null) {
    return <div className="text-center mt-20">Checking authorization...</div>
  }

  if (!isValid) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
