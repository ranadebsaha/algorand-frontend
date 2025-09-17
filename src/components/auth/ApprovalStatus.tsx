import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../../hooks/useSupabase'
import { type UserApplication } from '../../lib/supabase'

const ApprovalStatus = () => {
  const { getUserApplication } = useSupabase()
  const [application, setApplication] = useState<UserApplication | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApplication = async () => {
      const app = await getUserApplication()
      setApplication(app)
      setLoading(false)
    }

    fetchApplication()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">No application found</div>
      </div>
    )
  }

  if (application.status === 'approved') {
    return null // User is approved, show main app
  }

  if (application.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="max-w-md mx-auto p-8 bg-red-900/20 border border-red-700 rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-center">
            <div className="text-6xl mb-6">❌</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">
              Application Rejected
            </h2>
            <p className="text-gray-300 mb-6">
              Your {application.role} application has been rejected. 
              Please contact support for more information.
            </p>
            <button 
              onClick={() => window.location.href = 'mailto:support@yourapp.com'}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // Pending status
  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div 
        className="max-w-md mx-auto p-8 bg-yellow-900/20 border border-yellow-700 rounded-lg"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="text-center">
          <motion.div 
            className="text-6xl mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">
            Approval Pending
          </h2>
          <p className="text-gray-300 mb-6">
            Your {application.role} application is being reviewed by our admin team. 
            You'll receive an email notification once approved.
          </p>
          <div className="bg-gray-800 p-4 rounded-lg text-left">
            <p className="text-sm text-gray-400 mb-2">Application Details:</p>
            <p className="text-white"><strong>Role:</strong> {application.role}</p>
            {application.organization_name && (
              <p className="text-white"><strong>Organization:</strong> {application.organization_name}</p>
            )}
            <p className="text-white">
              <strong>Applied:</strong> {new Date(application.applied_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ApprovalStatus
