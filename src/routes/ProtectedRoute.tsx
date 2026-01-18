import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { PageLoader } from '../components/ui/Loader'
import { PendingApproval } from '../components/PendingApproval'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const [isChecking, setIsChecking] = useState(true)
  const [isApproved, setIsApproved] = useState(false)

  useEffect(() => {
    const checkApprovalStatus = () => {
      if (!token) {
        setIsChecking(false)
        return
      }

      try {
        const userStr = localStorage.getItem('user')
        if (userStr) {
          const user = JSON.parse(userStr)
          const approvalStatus = user?.company?.approvalStatus
          const status = user?.company?.status
          
          // Check if approved and active
          if (approvalStatus === 'APPROVED' && status === 'ACTIVE') {
            setIsApproved(true)
          } else {
            setIsApproved(false)
          }
        } else {
          setIsApproved(false)
        }
      } catch (error) {
        console.error('Error checking approval status:', error)
        setIsApproved(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkApprovalStatus()
  }, [token])

  if (isChecking) {
    return <PageLoader />
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!isApproved) {
    return <PendingApproval />
  }

  return <>{children}</>
}
