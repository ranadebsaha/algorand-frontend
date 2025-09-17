import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSupabase } from '../hooks/useSupabase'
import { type UserApplication } from '../lib/supabase'

const AdminDashboard = () => {
  const { getPendingApplications, updateApplicationStatus, loading } = useSupabase()
  const [applications, setApplications] = useState<UserApplication[]>([])
  const [fetchLoading, setFetchLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)
  
  // Use ref to prevent unnecessary re-renders
  const hasFetchedRef = useRef(false)

  // Memoize the fetch function to prevent infinite loops
  const fetchApplications = useCallback(async () => {
    console.log('Fetching pending applications...')
    setFetchLoading(true)
    try {
      const data = await getPendingApplications()
      console.log('Fetched applications:', data)
      setApplications(data)
      setLastFetch(Date.now())
      hasFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setFetchLoading(false)
    }
  }, [getPendingApplications]) // Only depend on the function

  // Handle approval with proper error handling
  const handleApproval = useCallback(async (applicationId: string, action: 'approved' | 'rejected') => {
    console.log('Handling approval:', { applicationId, action })
    try {
      const result = await updateApplicationStatus(applicationId, action)
      if (result.success) {
        // Remove the processed application from the list instead of refetching
        setApplications(prev => prev.filter(app => app.id !== applicationId))
        console.log('Application status updated successfully')
      } else {
        alert('Failed to update application status')
        console.error('Failed to update application status:', result.error)
      }
    } catch (error) {
      console.error('Error in handleApproval:', error)
      alert('An error occurred while updating the application status')
    }
  }, [updateApplicationStatus])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchApplications()
  }, [fetchApplications])

  // Only fetch once when component mounts
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchApplications()
    }
  }, []) // Empty dependency array - only run once

  console.log('AdminDashboard render - applications count:', applications.length)

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Last updated: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={fetchLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
          >
            {fetchLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              Pending Applications ({applications.length})
            </h2>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                fetchLoading ? 'bg-yellow-400 animate-pulse' : 
                applications.length > 0 ? 'bg-green-400' : 'bg-gray-400'
              }`} />
              <span className="text-sm text-gray-400">
                {fetchLoading ? 'Loading...' : `${applications.length} pending`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-700">
          {fetchLoading && applications.length === 0 ? (
            <div className="p-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto mb-4"
              />
              <div className="text-white mb-2">Loading applications...</div>
              <div className="text-gray-400 text-sm">This may take a moment</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-gray-400 mb-4 text-lg">No pending applications</div>
              <div className="text-gray-500 text-sm mb-4">
                New organizer and institute applications will appear here
              </div>
              <button
                onClick={handleRefresh}
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
              >
                Check for new applications
              </button>
            </div>
          ) : (
            applications.map((app) => (
              <motion.div
                key={app.id}
                className="p-6 hover:bg-gray-700/30 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                layout
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {app.first_name} {app.last_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        app.role === 'organizer' 
                          ? 'bg-purple-900/30 text-purple-300 border border-purple-700/50' 
                          : 'bg-green-900/30 text-green-300 border border-green-700/50'
                      }`}>
                        {app.role}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-1">{app.email}</p>
                    <p className="text-xs text-gray-500 mb-4">ID: {app.clerk_user_id}</p>
                    
                    {app.organization_name && (
                      <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Organization Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Name:</span>
                            <p className="text-white">{app.organization_name}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Type:</span>
                            <p className="text-white">{app.organization_type}</p>
                          </div>
                        </div>
                        {app.description && (
                          <div className="mt-3">
                            <span className="text-gray-400 text-sm">Description:</span>
                            <p className="text-white text-sm mt-1">{app.description}</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Applied:</span>
                        <span className="text-white ml-2">
                          {new Date(app.applied_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleApproval(app.id, 'approved')}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors min-w-[100px]"
                    >
                      {loading ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleApproval(app.id, 'rejected')}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors min-w-[100px]"
                    >
                      {loading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <details>
            <summary className="text-white font-bold mb-2 cursor-pointer">Debug Info</summary>
            <div className="text-xs text-gray-400 space-y-1 mt-2">
              <p>Applications loaded: {applications.length}</p>
              <p>Last fetch: {lastFetch ? new Date(lastFetch).toLocaleTimeString() : 'Never'}</p>
              <p>Fetch loading: {fetchLoading ? 'Yes' : 'No'}</p>
              <p>Has fetched: {hasFetchedRef.current ? 'Yes' : 'No'}</p>
              <p>Component renders: This shows current state</p>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
