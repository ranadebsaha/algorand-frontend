import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClerkProvider, SignIn, SignedIn, SignedOut, UserButton, useSignIn, useUser } from '@clerk/react-router';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import VerifierPage from './pages/VerifierPage';
import AdminDashboard from './pages/AdminDashboard';
import { WalletProvider } from './components/wallet/WalletContext';
import RoleBasedSignUp from './components/auth/RoleBasedSignUp';
import ApprovalStatus from './components/auth/ApprovalStatus';
import { useSupabase } from './hooks/useSupabase';
import { type UserApplication } from './lib/supabase';

// Get Clerk publishable key from environment variables
const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

// Background component for reusability
const BackgroundElements = () => (
  <>
    {/* Background gradient */}
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
    
    {/* Animated background particles */}
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
          initial={{ 
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800), 
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600) 
          }}
          animate={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600),
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      ))}
    </div>
  </>
);

const SignInPage = () => {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [useEmailCode, setUseEmailCode] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BackgroundElements />
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
          />
          <span className="ml-3 text-white">Loading Clerk...</span>
        </div>
      </div>
    )
  }

  const handleSubmitIdentifier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier.trim()) return

    setLoading(true)
    setError('')

    try {
      // Clear any existing sign-in attempts
      if (signIn.status) {
        console.log('Clearing existing sign-in attempt')
      }

      const result = await signIn.create({
        identifier: identifier.trim(),
      })

      console.log('Sign in attempt created:', result.status, result.id)
      
      if (result.status === 'needs_first_factor') {
        setStep(2)
        setRetryCount(0) // Reset retry count on successful step
      } else if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err: any) {
      console.error('Error creating sign in:', err)
      const errorMessage = err.errors?.[0]?.message || err.message || 'Failed to start sign in'
      
      if (errorMessage.includes('Service Unavailable') || errorMessage.includes('503')) {
        setError('Clerk service is temporarily unavailable. Please try again in a moment.')
      } else if (errorMessage.includes('User not found') || errorMessage.includes('Invalid identifier')) {
        setError('No account found with this username or email.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setLoading(true)
    setError('')

    try {
      // Check if signIn object is valid
      if (!signIn || !signIn.id) {
        console.error('No valid sign-in attempt found, restarting...')
        setStep(1)
        setError('Session expired. Please start again.')
        return
      }

      console.log('Attempting password authentication for:', signIn.id)

      const result = await signIn.attemptFirstFactor({
        strategy: 'password',
        password: password.trim(),
      })

      console.log('Password attempt result:', result.status)

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        console.log('Sign in completed successfully!')
      } else {
        setError('Authentication incomplete. Please try again.')
      }
    } catch (err: any) {
      console.error('Error with password:', err)
      
      const errorMessage = err.errors?.[0]?.message || err.message || 'Authentication failed'
      
      if (errorMessage.includes('Invalid action') || errorMessage.includes('No sign in attempt was found')) {
        if (retryCount < 2) {
          console.log('Retrying sign-in process...')
          setRetryCount(prev => prev + 1)
          setStep(1)
          setError('Session expired. Please enter your credentials again.')
        } else {
          setError('Multiple authentication failures. Please refresh the page and try again.')
        }
      } else if (errorMessage.includes('Service Unavailable') || errorMessage.includes('503')) {
        setError('Authentication service is temporarily unavailable. Please try again.')
      } else if (errorMessage.includes('Invalid password') || errorMessage.includes('Incorrect password')) {
        setError('Incorrect password. Please try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmailCode = async () => {
    setLoading(true)
    setError('')

    try {
      // Check if signIn object is valid
      if (!signIn || !signIn.supportedFirstFactors) {
        console.error('No valid sign-in attempt found')
        setStep(1)
        setError('Session expired. Please start again.')
        return
      }

      const emailStrategy = signIn.supportedFirstFactors.find(
        factor => factor.strategy === 'email_code'
      )

      if (!emailStrategy) {
        setError('Email code authentication is not available for this account.')
        return
      }

      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: (emailStrategy as any).emailAddressId
      })

      console.log('Email code sent successfully')
      setUseEmailCode(true)
      setStep(3)
    } catch (err: any) {
      console.error('Error sending email code:', err)
      
      const errorMessage = err.errors?.[0]?.message || err.message || 'Failed to send email code'
      
      if (errorMessage.includes('Invalid action') || errorMessage.includes('No sign in attempt was found')) {
        setStep(1)
        setError('Session expired. Please start again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setLoading(true)
    setError('')

    try {
      // Check if signIn object is valid
      if (!signIn || !signIn.id) {
        console.error('No valid sign-in attempt found')
        setStep(1)
        setError('Session expired. Please start again.')
        return
      }

      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      })

      console.log('Email code attempt result:', result.status)

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        console.log('Sign in completed successfully!')
      } else {
        setError('Verification incomplete. Please try again.')
      }
    } catch (err: any) {
      console.error('Error with email code:', err)
      
      const errorMessage = err.errors?.[0]?.message || err.message || 'Invalid verification code'
      
      if (errorMessage.includes('Invalid action') || errorMessage.includes('No sign in attempt was found')) {
        setStep(1)
        setError('Session expired. Please start again.')
      } else if (errorMessage.includes('Invalid code') || errorMessage.includes('Incorrect code')) {
        setError('Invalid verification code. Please check and try again.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setIdentifier('')
    setPassword('')
    setCode('')
    setError('')
    setUseEmailCode(false)
    setRetryCount(0)
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <BackgroundElements />
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <motion.div 
          className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-gray-400">Sign in to Bishwas Chain</p>
            </motion.div>
          </div>

          {/* Error Message with Retry Option */}
          {error && (
            <motion.div 
              className="mb-6 p-4 bg-red-900/30 border border-red-700/50 rounded-lg backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-red-200 text-sm">{error}</p>
                  {(error.includes('Service Unavailable') || error.includes('Multiple authentication failures')) && (
                    <button
                      onClick={resetForm}
                      className="mt-2 text-red-300 hover:text-red-200 text-xs underline"
                    >
                      Click here to restart
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Show retry count if applicable */}
          {retryCount > 0 && (
            <div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-yellow-200 text-xs text-center">
              Retry attempt {retryCount} of 3
            </div>
          )}

          {/* Step 1: Enter username/email */}
          {step === 1 && (
            <motion.form 
              onSubmit={handleSubmitIdentifier} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Username or Email
                </label>
                <input
                  type="text"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                  required
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={loading || !identifier.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Loading...
                  </div>
                ) : (
                  'Continue'
                )}
              </button>
            </motion.form>
          )}

          {/* Step 2: Enter password or choose email code */}
          {step === 2 && !useEmailCode && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <span className="text-gray-300">Signing in as: </span>
                <strong className="text-cyan-400">{identifier}</strong>
              </div>

              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !password.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Signing In...
                    </div>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-gray-800 text-gray-400">OR</span>
                </div>
              </div>

              {/* Email Code Option */}
              <button
                onClick={handleSendEmailCode}
                disabled={loading}
                className="w-full bg-gray-700/50 hover:bg-gray-600/50 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-all duration-200 border border-gray-600/50 hover:border-gray-500/50"
              >
                {loading ? 'Sending...' : 'Send Code to Email'}
              </button>

              {/* Back Button */}
              <button
                onClick={() => setStep(1)}
                className="w-full text-cyan-400 hover:text-cyan-300 text-sm transition-colors py-2"
              >
                ← Back to identifier
              </button>
            </motion.div>
          )}

          {/* Step 3: Enter email code */}
          {step === 3 && useEmailCode && (
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <span className="text-green-400 font-medium">Code Sent!</span>
                </div>
                <p className="text-gray-300 text-sm">
                  Check your email for a 6-digit verification code
                </p>
              </div>

              <form onSubmit={handleSubmitCode} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full p-4 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                    required
                    autoFocus
                    maxLength={6}
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                      Verifying...
                    </div>
                  ) : (
                    'Verify Code'
                  )}
                </button>
              </form>

              {/* Resend Code */}
              <button
                onClick={handleSendEmailCode}
                disabled={loading}
                className="w-full text-cyan-400 hover:text-cyan-300 text-sm transition-colors py-2 disabled:opacity-50"
              >
                Resend Code
              </button>

              {/* Back Button */}
              <button
                onClick={() => {
                  setStep(2)
                  setUseEmailCode(false)
                  setCode('')
                }}
                className="w-full text-gray-400 hover:text-gray-300 text-sm transition-colors py-2"
              >
                ← Back to password
              </button>
            </motion.div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <span className="text-gray-400 text-sm">Don't have an account? </span>
            <a 
              href="/sign-up" 
              className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Sign up
            </a>
          </div>

          {/* Reset Button for Emergency Cases */}
          {retryCount >= 2 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => window.location.reload()}
                className="text-gray-500 hover:text-gray-400 text-xs underline"
              >
                Refresh Page
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
};

// Header Component with UserButton
const Header = () => (
  <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-4">
    <div className="container mx-auto flex justify-between items-center">
      <h1 className="text-xl font-bold text-white">Bishwas Chain</h1>
      <SignedIn>
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-10 w-10",
              userButtonPopoverCard: "bg-gray-800 border-gray-700",
              userButtonPopoverActionButton: "text-white hover:bg-gray-700",
            }
          }}
          afterSignOutUrl="/"
        />
      </SignedIn>
    </div>
  </header>
);

// Fixed Hook to check user status - prevent infinite loops
const useUserStatus = () => {
  const { getUserApplication, checkIsAdmin } = useSupabase()
  const { user } = useUser() // Add user dependency
  const [userApplication, setUserApplication] = useState<UserApplication | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true // Prevent state updates if component unmounts
    
    const checkStatus = async () => {
      if (!user) {
        if (isMounted) setLoading(false)
        return
      }

      try {
        const [app, adminStatus] = await Promise.all([
          getUserApplication(),
          checkIsAdmin()
        ])
        
        if (isMounted) { // Only update state if component is still mounted
          setUserApplication(app)
          setIsAdmin(adminStatus)
        }
      } catch (error) {
        console.error('Error checking user status:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    checkStatus()
    
    return () => {
      isMounted = false // Cleanup function
    }
  }, [user?.id]) // Only depend on user ID, not the functions

  return { userApplication, isAdmin, loading }
}

// Main app routes component
const AppRoutes = () => {
  const { userApplication, isAdmin, loading } = useUserStatus()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
        />
        <span className="ml-3 text-white">Loading...</span>
      </div>
    )
  }

  return (
    <>
      <SignedOut>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<RoleBasedSignUp />} />
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </SignedOut>

      <SignedIn>
        {/* Check if user needs approval */}
        {userApplication && 
         (userApplication.role === 'organizer' || userApplication.role === 'institute') && 
         userApplication.status !== 'approved' ? (
          <ApprovalStatus />
        ) : (
          <>
            <Header />
            <Routes>
              <Route path="/" element={<Navigate to={
                isAdmin ? '/admin' : '/attendee'
              } replace />} />
              
              {/* Admin Dashboard - Only for admins */}
              {isAdmin && (
                <Route path="/admin" element={<AdminDashboard />} />
              )}
              
              {/* Organizer Dashboard - For approved organizers and admins */}
              {((userApplication?.role === 'organizer' && userApplication?.status === 'approved') || isAdmin) && (
                <Route 
                  path="/organizer" 
                  element={<Layout><OrganizerDashboard /></Layout>} 
                />
              )}
              
              {/* Attendee Dashboard - For all users */}
              <Route 
                path="/attendee" 
                element={<Layout><AttendeeDashboard /></Layout>} 
              />
              
              {/* Verifier Page - For approved institutes and admins */}
              {((userApplication?.role === 'institute' && userApplication?.status === 'approved') || isAdmin) && (
                <Route 
                  path="/verify" 
                  element={<Layout><VerifierPage /></Layout>} 
                />
              )}
              
              {/* Redirect authenticated users away from auth pages */}
              <Route path="/sign-in" element={<Navigate to={isAdmin ? '/admin' : '/attendee'} replace />} />
              <Route path="/sign-up" element={<Navigate to={isAdmin ? '/admin' : '/attendee'} replace />} />
              
              {/* Catch all other routes */}
              <Route path="*" element={<Navigate to="/attendee" replace />} />
            </Routes>
          </>
        )}
      </SignedIn>
    </>
  );
};

function App() {
  return (
    <WalletProvider>
      <Router>
        <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
          <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
            <BackgroundElements />
            <div className="relative z-10">
              <AppRoutes />
            </div>
          </div>
        </ClerkProvider>
      </Router>
    </WalletProvider>
  );
}

export default App;
