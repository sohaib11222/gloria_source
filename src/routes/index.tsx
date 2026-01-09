import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'

// Import pages
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import VerifyEmailPage from '../pages/VerifyEmailPage'
import SourcePage from '../pages/SourcePage'
import DocsFullscreen from '../pages/DocsFullscreen'
import NotFound from '../pages/NotFound'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
      {/* Fullscreen docs route (no sidebar) */}
      <Route path="/docs-fullscreen/:endpointId" element={<DocsFullscreen />} />
      <Route path="/docs-fullscreen" element={<DocsFullscreen />} />
      
      <Route path="/source" element={
        <ProtectedRoute>
          <SourcePage />
        </ProtectedRoute>
      } />

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
