import React, { useState } from 'react'
import { useSignUp } from '@clerk/react-router'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase' // Import supabase directly

const RoleBasedSignUp = () => {
  const { signUp, isLoaded, setActive } = useSignUp()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailAddress: '',
    password: '',
    username: '',
    role: '',
    organizationName: '',
    organizationType: '',
    description: ''
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clerkUserId, setClerkUserId] = useState<string>('') // Store Clerk user ID

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const handleRoleSelect = (role: string) => {
    setFormData(prev => ({ ...prev, role }))
    setStep(2)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      console.log('Creating sign-up with:', {
        emailAddress: formData.emailAddress,
        username: formData.username,
        passwordLength: formData.password.length
      })
      
      // Create the sign-up with username (required field)
      const result = await signUp.create({
        emailAddress: formData.emailAddress,
        password: formData.password,
        username: formData.username,
      })

      console.log('Sign up result:', result.status)
      console.log('Created user ID:', result.createdUserId)
      
      // Store the Clerk user ID for later use
      if (result.createdUserId) {
        setClerkUserId(result.createdUserId)
      }

      // Handle the response
      if (result.status === 'missing_requirements') {
        // Check if email verification is needed
        if (result.unverifiedFields?.includes('email_address')) {
          console.log('Email verification required')
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
          setStep(3)
        } else {
          // Try to proceed to email verification anyway
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
          setStep(3)
        }
      } else if (result.status === 'complete') {
        // If already complete, set active session and proceed
        await setActive({ session: result.createdSessionId })
        await handlePostSignUp(result.createdUserId || '')
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error)
      const errorMessage = error.errors?.[0]?.message || error.message || 'Sign up failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('Attempting email verification with code:', verificationCode)
      
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      console.log('Verification result:', completeSignUp.status)
      console.log('Final user ID:', completeSignUp.createdUserId)

      if (completeSignUp.status === "complete") {
        console.log('Sign-up completed, setting active session...')
        await setActive({ session: completeSignUp.createdSessionId })
        
        // Use the stored or newly created user ID
        const finalUserId = completeSignUp.createdUserId || clerkUserId
        await handlePostSignUp(finalUserId)
      } else if (completeSignUp.status === "missing_requirements") {
        // If still missing requirements, try to complete with username
        console.log('Still missing requirements:', completeSignUp.missingFields)
        
        if (completeSignUp.missingFields?.includes('username')) {
          try {
            const updateResult = await signUp.update({
              username: formData.username,
            })
            
            if (updateResult.status === 'complete') {
              await setActive({ session: updateResult.createdSessionId })
              await handlePostSignUp(updateResult.createdUserId || clerkUserId)
              return
            }
          } catch (updateError: any) {
            console.error('Error updating username:', updateError)
          }
        }
        
        // If we get here, something is still missing
        setError('Account creation incomplete. Please try again.')
      }
    } catch (error: any) {
      console.error('Verification error:', error)
      const errorMessage = error.errors?.[0]?.message || error.message || 'Verification failed'
      
      if (errorMessage.includes('already verified') || errorMessage.includes('verification_already_verified')) {
        console.log('Email already verified, checking current status...')
        
        try {
          // Check current status and try to complete
          if (signUp.status === 'complete') {
            await setActive({ session: signUp.createdSessionId })
            await handlePostSignUp(signUp.createdUserId || clerkUserId)
            return
          } else if (signUp.status === 'missing_requirements') {
            // Try to complete with username if missing
            if (signUp.missingFields?.includes('username')) {
              const updateResult = await signUp.update({
                username: formData.username,
              })
              
              if (updateResult.status === 'complete') {
                await setActive({ session: updateResult.createdSessionId })
                await handlePostSignUp(updateResult.createdUserId || clerkUserId)
                return
              }
            } else {
              // If no username is missing, the sign-up might be complete
              // Try to set the active session directly
              if (signUp.createdSessionId) {
                await setActive({ session: signUp.createdSessionId })
                await handlePostSignUp(signUp.createdUserId || clerkUserId)
                return
              }
            }
          }
        } catch (checkError) {
          console.error('Error checking sign-up status:', checkError)
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Direct Supabase submission without useSupabase hook
  const handlePostSignUp = async (userId: string) => {
    try {
      console.log('handlePostSignUp: Starting with user ID:', userId)
      console.log('handlePostSignUp: Form data:', formData)

      if (!userId) {
        throw new Error('No user ID provided')
      }

      // Prepare the application data
      const applicationData = {
        clerk_user_id: userId,
        email: formData.emailAddress,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        organization_name: formData.organizationName || null,
        organization_type: formData.organizationType || null,
        description: formData.description || null,
        status: formData.role === 'user' ? 'approved' : 'pending'
      }

      console.log('handlePostSignUp: Submitting to Supabase:', applicationData)

      // Direct Supabase call
      const { data, error } = await supabase
        .from('user_applications')
        .upsert([applicationData], {
          onConflict: 'clerk_user_id'
        })
        .select()

      console.log('handlePostSignUp: Supabase result:', { data, error })

      if (error) {
        console.error('handlePostSignUp: Supabase error:', error)
        alert(`Failed to save application: ${error.message}. You can still use the app, but please contact support.`)
      } else {
        console.log('handlePostSignUp: Application submitted successfully!')
      }

      // Redirect regardless of Supabase success/failure
      if (formData.role === 'user') {
        navigate('/attendee')
      } else {
        // For organizer/institute, they need approval
        navigate('/') // Will show approval status
      }
      
    } catch (error: any) {
      console.error('handlePostSignUp: Error:', error)
      alert(`There was an error: ${error.message}. You can still use the app.`)
      navigate('/attendee') // Fallback redirect
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '') // Only digits
    if (value.length <= 6) {
      setVerificationCode(value)
    }
  }

  const resendCode = async () => {
    setError('')
    setLoading(true)
    
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setError('New code sent to your email!')
      setTimeout(() => setError(''), 3000)
    } catch (error: any) {
      console.error('Resend error:', error)
      const errorMessage = error.errors?.[0]?.message || error.message || 'Failed to resend code'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Generate username from first and last name
  const generateUsername = () => {
    if (formData.firstName && formData.lastName) {
      const username = (formData.firstName + formData.lastName).toLowerCase().replace(/[^a-z0-9]/g, '')
      setFormData(prev => ({ ...prev, username: username + Math.floor(Math.random() * 1000) }))
    }
  }

  // Your existing JSX remains the same, just adding a test button for manual creation
  // Step 1: Role Selection (same as before)
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
        
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
        
        <div className="relative z-10 max-w-2xl mx-auto p-8">
          <motion.div 
            className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Choose Your Role
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Regular User */}
              <motion.div
                className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleRoleSelect('user')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3 className="text-xl font-bold mb-4 text-white">User</h3>
                <ul className="text-sm space-y-2 text-blue-100">
                  <li>• View certificates</li>
                  <li>• Basic verification</li>
                  <li>• Instant access</li>
                </ul>
              </motion.div>

              {/* Organizer */}
              <motion.div
                className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleRoleSelect('organizer')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3 className="text-xl font-bold mb-4 text-white">Organizer</h3>
                <ul className="text-sm space-y-2 text-purple-100">
                  <li>• Generate certificates</li>
                  <li>• Upload certificates</li>
                  <li>• Requires approval</li>
                </ul>
              </motion.div>

              {/* Institute */}
              <motion.div
                className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-lg cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleRoleSelect('institute')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <h3 className="text-xl font-bold mb-4 text-white">Institute</h3>
                <ul className="text-sm space-y-2 text-green-100">
                  <li>• Verify authenticity</li>
                  <li>• Advanced verification</li>
                  <li>• Requires approval</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 2: User Information (same as before, but with test button)
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
        
        <div className="relative z-10 max-w-md mx-auto p-8">
          <motion.div 
            className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-white">
              Create Account
            </h2>
            
            <div className="text-center mb-6">
              <span className="inline-block px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-full text-sm font-medium capitalize">
                {formData.role}
              </span>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div 
                className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200 text-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}
            
            {/* CAPTCHA Element */}
            <div 
              id="clerk-captcha" 
              data-cl-theme="dark"
              data-cl-size="normal"
              data-cl-language="auto"
              className="mb-6"
            />
            
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, firstName: e.target.value }))
                    // Auto-generate username when name changes
                    if (!formData.username && e.target.value && formData.lastName) {
                      setTimeout(generateUsername, 100)
                    }
                  }}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, lastName: e.target.value }))
                    // Auto-generate username when name changes
                    if (!formData.username && formData.firstName && e.target.value) {
                      setTimeout(generateUsername, 100)
                    }
                  }}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>
              
              <input
                type="email"
                placeholder="Email Address"
                value={formData.emailAddress}
                onChange={(e) => setFormData(prev => ({ ...prev, emailAddress: e.target.value }))}
                className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                required
              />
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                  className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  onClick={generateUsername}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1 rounded"
                >
                  Generate
                </button>
              </div>
              
              <input
                type="password"
                placeholder="Password (min 8 characters)"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                required
                minLength={8}
              />

              {(formData.role === 'organizer' || formData.role === 'institute') && (
                <>
                  <input
                    type="text"
                    placeholder="Organization Name"
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  
                  <input
                    type="text"
                    placeholder="Organization Type"
                    value={formData.organizationType}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationType: e.target.value }))}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  
                  <textarea
                    placeholder="Brief description of your organization"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 h-24 resize-none"
                    required
                  />
                </>
              )}
              
              <button
                type="submit"
                disabled={loading || !formData.username.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100 shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <span className="text-gray-400 text-sm">Already have an account? </span>
              <button 
                onClick={() => navigate('/sign-in')}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
              >
                Sign in
              </button>
            </div>
            
            <button
              onClick={() => setStep(1)}
              className="w-full mt-4 text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to role selection
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Step 3: Email Verification (same as before)
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
        
        <div className="relative z-10 max-w-md mx-auto p-8">
          <motion.div 
            className="bg-gray-800/90 backdrop-blur-sm rounded-xl p-8 border border-gray-700/50 shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-center mb-6 text-white">
              Verify Your Email
            </h2>

            {/* Error Display */}
            {error && (
              <motion.div 
                className={`mb-4 p-3 border rounded-lg text-sm ${
                  error.includes('sent') 
                    ? 'bg-green-900/30 border-green-700/50 text-green-200' 
                    : 'bg-red-900/30 border-red-700/50 text-red-200'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </motion.div>
            )}
            
            <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-700/30 mb-6">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
                <span className="text-blue-400 font-medium">Code Sent!</span>
              </div>
              <p className="text-gray-300 text-sm">
                We've sent a 6-digit code to
              </p>
              <p className="text-white font-medium text-sm mt-1">
                {formData.emailAddress}
              </p>
            </div>
            
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 text-center">
                  Enter Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={handleCodeChange}
                    className="w-48 p-4 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 text-center text-3xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200"
                    maxLength={6}
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                <div className="text-center text-xs text-gray-500 mt-2">
                  {verificationCode.length}/6 digits
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
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
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm mb-3">
                Didn't receive the code?
              </p>
              <button
                onClick={resendCode}
                disabled={loading}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium text-sm disabled:opacity-50"
              >
                Resend Code
              </button>
            </div>
            
            <button
              onClick={() => setStep(2)}
              className="w-full mt-6 text-gray-400 hover:text-gray-300 text-sm transition-colors"
            >
              ← Back to account details
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  return null
}

export default RoleBasedSignUp;
