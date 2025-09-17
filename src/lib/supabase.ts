import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Environment variables check:')
console.log('VITE_SUPABASE_URL:', supabaseUrl)
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing')
console.log('All env vars:', import.meta.env)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', { supabaseUrl, supabaseAnonKey })
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface UserApplication {
  id: string
  clerk_user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'user' | 'organizer' | 'institute'
  organization_name: string | null
  organization_type: string | null
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  applied_at: string
  approved_at: string | null
  approved_by: string | null
}

export interface AdminUser {
  id: string
  clerk_user_id: string
  email: string
  created_at: string
}
