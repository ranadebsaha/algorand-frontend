import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Shield, CheckCircle, XCircle, Hash, Calendar, User, AlertTriangle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowingButton from '../components/GlowingButton';

interface VerificationResult {
  isValid: boolean;
  eventName?: string;
  date?: string;
  organizer?: string;
  hash?: string;
  confidence?: number;
}

const VerifierPage: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setUploadedFile(e.target.files[0]);
      setVerificationResult(null);
      setShowResult(false);
    }
  };

  const handleVerification = async () => {
    if (!uploadedFile) return;

    setIsVerifying(true);
    
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock verification result
    const mockResult: VerificationResult = {
      isValid: Math.random() > 0.3, // 70% chance of being valid
      eventName: "Algorand Developer Summit 2024",
      date: "2024-03-15T10:00:00",
      organizer: "Algorand Foundation",
      hash: "QmX7Yh3K9p2mNxR4F8qW5tL9bH6vJ2nM8cZ1xQ3wE7rT5uI",
      confidence: Math.random() * 30 + 70 // 70-100% confidence
    };
    
    setVerificationResult(mockResult);
    setIsVerifying(false);
    setShowResult(true);
  };

  const resetVerification = () => {
    setUploadedFile(null);
    setVerificationResult(null);
    setShowResult(false);
    setIsVerifying(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Certificate Verifier
      </motion.h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-green-400" />
              Certificate Upload
            </h2>

            {!uploadedFile ? (
              <div className="border-2 border-dashed border-green-400/30 rounded-lg p-8 text-center hover:border-green-400/60 transition-colors">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="certificate-upload"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                <label htmlFor="certificate-upload" className="cursor-pointer">
                  <motion.div
                    className="space-y-4"
                    whileHover={{ scale: 1.05 }}
                  >
                    <motion.div
                      className="w-20 h-20 mx-auto bg-gradient-to-r from-green-400/20 to-teal-400/20 rounded-full flex items-center justify-center"
                      animate={{ 
                        boxShadow: [
                          '0 0 20px rgba(34, 197, 94, 0.3)',
                          '0 0 40px rgba(34, 197, 94, 0.5)',
                          '0 0 20px rgba(34, 197, 94, 0.3)'
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Upload className="w-10 h-10 text-green-400" />
                    </motion.div>
                    <div>
                      <p className="text-white font-medium text-lg">Drop certificate here</p>
                      <p className="text-gray-400 text-sm">or click to browse</p>
                      <p className="text-gray-500 text-xs mt-2">PDF, JPG, PNG up to 10MB</p>
                    </div>
                  </motion.div>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <motion.div
                  className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-green-400 font-semibold">File uploaded</p>
                        <p className="text-white text-sm">{uploadedFile.name}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={resetVerification}
                      className="text-gray-400 hover:text-white transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      ✕
                    </motion.button>
                  </div>
                </motion.div>

                <GlowingButton
                  icon={Shield}
                  gradient="from-green-500 to-teal-500"
                  onClick={handleVerification}
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Certificate'}
                </GlowingButton>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="min-h-[400px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {!showResult && !isVerifying && (
                <motion.div
                  key="waiting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4"
                >
                  <motion.div
                    className="w-24 h-24 mx-auto border-4 border-gray-600 rounded-full flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Shield className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-400">Awaiting Certificate</h3>
                    <p className="text-gray-500 text-sm">Upload a certificate to begin verification</p>
                  </div>
                </motion.div>
              )}

              {isVerifying && (
                <motion.div
                  key="verifying"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    className="w-24 h-24 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center"
                    animate={{ 
                      rotate: 360,
                      boxShadow: [
                        '0 0 30px rgba(34, 211, 238, 0.5)',
                        '0 0 60px rgba(168, 85, 247, 0.5)',
                        '0 0 30px rgba(34, 211, 238, 0.5)'
                      ]
                    }}
                    transition={{ 
                      rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                      boxShadow: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                    }}
                  >
                    <Shield className="w-12 h-12 text-white" />
                  </motion.div>
                  
                  <div>
                    <motion.h3 
                      className="text-2xl font-bold text-cyan-400 mb-2"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      Verifying Certificate
                    </motion.h3>
                    <p className="text-gray-300">Checking blockchain records...</p>
                  </div>

                  {/* Progress indicators */}
                  <div className="space-y-2">
                    {['Validating file integrity', 'Cross-referencing blockchain', 'Verifying authenticity'].map((step, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 text-sm text-gray-400"
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.5 }}
                      >
                        <motion.div
                          className="w-2 h-2 bg-cyan-400 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: index * 0.2 }}
                        />
                        {step}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {showResult && verificationResult && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="w-full space-y-6"
                >
                  {/* Verification Status */}
                  <div className="text-center">
                    {verificationResult.isValid ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <motion.div
                          className="w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4"
                          animate={{ 
                            boxShadow: [
                              '0 0 30px rgba(34, 197, 94, 0.5)',
                              '0 0 50px rgba(34, 197, 94, 0.8)',
                              '0 0 30px rgba(34, 197, 94, 0.5)'
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-green-400 mb-2">Certificate Verified ✓</h3>
                        <p className="text-gray-300">This certificate is genuine and valid</p>
                        {verificationResult.confidence && (
                          <p className="text-sm text-green-400 mt-1">
                            Confidence: {verificationResult.confidence.toFixed(1)}%
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <motion.div
                          className="w-24 h-24 mx-auto bg-red-500 rounded-full flex items-center justify-center mb-4"
                          animate={{ 
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              '0 0 30px rgba(239, 68, 68, 0.5)',
                              '0 0 50px rgba(239, 68, 68, 0.8)',
                              '0 0 30px rgba(239, 68, 68, 0.5)'
                            ]
                          }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <XCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold text-red-400 mb-2">Verification Failed ✗</h3>
                        <p className="text-gray-300">This certificate could not be verified</p>
                        <motion.div
                          className="flex items-center justify-center gap-2 mt-2 text-yellow-400"
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm">Possible forgery detected</span>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* Certificate Details */}
                  {verificationResult.isValid && (
                    <motion.div
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <h4 className="text-lg font-semibold text-white mb-4">Certificate Details</h4>
                      
                      {verificationResult.eventName && (
                        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-cyan-400" />
                          <div>
                            <p className="text-gray-300 text-sm">Event</p>
                            <p className="text-white font-medium">{verificationResult.eventName}</p>
                          </div>
                        </div>
                      )}

                      {verificationResult.date && (
                        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-400" />
                          <div>
                            <p className="text-gray-300 text-sm">Date</p>
                            <p className="text-white font-medium">{formatDate(verificationResult.date)}</p>
                          </div>
                        </div>
                      )}

                      {verificationResult.organizer && (
                        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                          <User className="w-5 h-5 text-green-400" />
                          <div>
                            <p className="text-gray-300 text-sm">Organizer</p>
                            <p className="text-white font-medium">{verificationResult.organizer}</p>
                          </div>
                        </div>
                      )}

                      {verificationResult.hash && (
                        <div className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                          <Hash className="w-5 h-5 text-pink-400" />
                          <div className="flex-1">
                            <p className="text-gray-300 text-sm">Blockchain Hash</p>
                            <motion.p 
                              className="text-pink-400 font-mono text-xs break-all"
                              animate={{ 
                                textShadow: [
                                  '0 0 5px rgba(236, 72, 153, 0.5)',
                                  '2px 0 5px rgba(236, 72, 153, 0.8)',
                                  '-2px 0 5px rgba(236, 72, 153, 0.8)',
                                  '0 0 5px rgba(236, 72, 153, 0.5)'
                                ]
                              }}
                              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                            >
                              {verificationResult.hash}
                            </motion.p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Action Button */}
                  <motion.div
                    className="flex justify-center pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <GlowingButton
                      gradient="from-gray-600 to-gray-700"
                      onClick={resetVerification}
                    >
                      Verify Another Certificate
                    </GlowingButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifierPage;