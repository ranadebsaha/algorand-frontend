import { useState, useCallback } from 'react'
import { useUser } from '@clerk/react-router'
import { supabase, type UserApplication } from '../lib/supabase'

export const useSupabase = () => {
  const { user, isLoaded: userLoaded } = useUser()
  const [loading, setLoading] = useState(false)

  // Memoize the admin check function
  const checkIsAdmin = useCallback(async (): Promise<boolean> => {
    if (!userLoaded || !user) {
      console.log('checkIsAdmin: User not loaded or not found')
      return false
    }
    
    try {
      console.log('checkIsAdmin: Checking for user:', user.id)
      
      const { data, error } = await supabase
        .from('admin_users')
        .select('clerk_user_id')
        .eq('clerk_user_id', user.id)
        .maybeSingle() // Use maybeSingle instead of single to avoid errors

      console.log('checkIsAdmin result:', { data, error })

      if (error) {
        console.error('checkIsAdmin error:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('checkIsAdmin catch error:', error)
      return false
    }
  }, [user?.id, userLoaded])

  // Memoize the submit application function - accepting user as parameter
  const submitApplication = useCallback(async (applicationData: {
    role: string
    firstName?: string
    lastName?: string
    organizationName?: string
    organizationType?: string
    description?: string
  }, clerkUser?: any) => {
    // Use passed user or current user
    const currentUser = clerkUser || user
    
    if (!currentUser) {
      console.error('submitApplication: No user found in context or parameter')
      return { success: false, error: 'User not authenticated' }
    }

    console.log('submitApplication: Starting with user:', currentUser.id)
    console.log('submitApplication: User loaded:', userLoaded)
    console.log('submitApplication: Application data:', applicationData)

    setLoading(true)
    try {
      // Prepare the data to insert
      const insertData = {
        clerk_user_id: currentUser.id,
        email: currentUser.emailAddresses?.[0]?.emailAddress || '',
        first_name: applicationData.firstName || currentUser.firstName || null,
        last_name: applicationData.lastName || currentUser.lastName || null,
        role: applicationData.role,
        organization_name: applicationData.organizationName || null,
        organization_type: applicationData.organizationType || null,
        description: applicationData.description || null,
        status: applicationData.role === 'user' ? 'approved' : 'pending'
      }

      console.log('submitApplication: Prepared data:', insertData)

      // Validate required fields
      if (!insertData.clerk_user_id) {
        throw new Error('Missing Clerk user ID')
      }
      if (!insertData.email) {
        throw new Error('Missing email address')
      }
      if (!insertData.role) {
        throw new Error('Missing role')
      }

      const { data, error } = await supabase
        .from('user_applications')
        .upsert([insertData], {
          onConflict: 'clerk_user_id'
        })
        .select()

      console.log('submitApplication: Supabase result:', { data, error })

      if (error) {
        console.error('submitApplication: Supabase error:', error)
        return { success: false, error: error.message }
      }

      console.log('submitApplication: Success!', data)
      return { success: true, data }
    } catch (error: any) {
      console.error('submitApplication: Error:', error)
      return { success: false, error: error.message || 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }, [user, userLoaded])

  // Memoize the get user application function
  const getUserApplication = useCallback(async (): Promise<UserApplication | null> => {
    if (!userLoaded || !user) {
      console.log('getUserApplication: User not loaded or not found')
      return null
    }

    try {
      console.log('getUserApplication: Fetching for user:', user.id)
      
      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .eq('clerk_user_id', user.id)
        .maybeSingle() // Use maybeSingle instead of single

      console.log('getUserApplication result:', { data, error })

      if (error) {
        console.error('getUserApplication error:', error)
        return null
      }
      
      return data || null
    } catch (error) {
      console.error('getUserApplication catch error:', error)
      return null
    }
  }, [user?.id, userLoaded])

  // Memoize the get pending applications function
  const getPendingApplications = useCallback(async (): Promise<UserApplication[]> => {
    try {
      console.log('getPendingApplications: Fetching pending applications...')
      
      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .eq('status', 'pending')
        .order('applied_at', { ascending: false })

      console.log('getPendingApplications result:', { data, error, count: data?.length || 0 })

      if (error) {
        console.error('getPendingApplications error:', error)
        return []
      }
      
      return data || []
    } catch (error) {
      console.error('getPendingApplications catch error:', error)
      return []
    }
  }, [])

  // Memoize the update application status function
  const updateApplicationStatus = useCallback(async (
    applicationId: string, 
    status: 'approved' | 'rejected'
  ) => {
    if (!userLoaded || !user) {
      return { success: false, error: 'User not authenticated' }
    }

    setLoading(true)
    try {
      console.log('updateApplicationStatus:', { applicationId, status, userId: user.id })
      
      const { data, error } = await supabase
        .from('user_applications')
        .update({
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
          approved_by: user.id
        })
        .eq('id', applicationId)
        .select()

      console.log('updateApplicationStatus result:', { data, error })

      if (error) {
        return { success: false, error: error.message }
      }
      
      return { success: true, data }
    } catch (error: any) {
      console.error('updateApplicationStatus catch error:', error)
      return { success: false, error: error.message || 'Unknown error' }
    } finally {
      setLoading(false)
    }
  }, [user?.id, userLoaded])

  // Debug function to check all applications
  const debugAllApplications = useCallback(async () => {
    try {
      console.log('debugAllApplications: Fetching all applications...')
      
      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .order('applied_at', { ascending: false })
      
      console.log('debugAllApplications result:', { data, error, count: data?.length || 0 })
      
      if (error) {
        console.error('debugAllApplications error:', error)
        return { all: [], pending: [] }
      }
      
      const pending = data?.filter(app => app.status === 'pending') || []
      console.log('debugAllApplications pending:', pending)
      
      return { all: data || [], pending }
    } catch (err) {
      console.error('debugAllApplications catch error:', err)
      return { all: [], pending: [] }
    }
  }, [])

  return {
    loading,
    userLoaded,
    checkIsAdmin,
    submitApplication,
    getUserApplication,
    getPendingApplications,
    updateApplicationStatus,
    debugAllApplications
  }
}
