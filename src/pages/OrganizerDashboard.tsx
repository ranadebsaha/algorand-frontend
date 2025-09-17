import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Upload, Coins, ChevronRight, ChevronLeft, Eye } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import StepIndicator from '../components/StepIndicator';
import NFTPreviewCard from '../components/NFTPreviewCard';

const OrganizerDashboard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    eventName: '',
    eventDate: '',
    organizerName: '',
    attendeeWallet: '',
    certificate: null as File | null,
  });
  const [showPreview, setShowPreview] = useState(false);

  const steps = [
    { number: 1, title: 'Event Details', icon: Calendar },
    { number: 2, title: 'Attendee Wallet', icon: User },
    { number: 3, title: 'Certificate Upload', icon: Upload },
  ];

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowPreview(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (field: string, value: string | File) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleInputChange('certificate', e.target.files[0]);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.eventName && formData.eventDate && formData.organizerName;
      case 2:
        return formData.attendeeWallet;
      case 3:
        return formData.certificate;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Organizer Dashboard
      </motion.h1>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      <AnimatePresence mode="wait">
        {!showPreview ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="mt-8"
          >
            <GlassCard>
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-cyan-400 flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Event Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Event Name
                      </label>
                      <input
                        type="text"
                        value={formData.eventName}
                        onChange={(e) => handleInputChange('eventName', e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors text-white placeholder-gray-400"
                        placeholder="Enter event name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Event Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.eventDate}
                        onChange={(e) => handleInputChange('eventDate', e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organizer Name
                      </label>
                      <input
                        type="text"
                        value={formData.organizerName}
                        onChange={(e) => handleInputChange('organizerName', e.target.value)}
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors text-white placeholder-gray-400"
                        placeholder="Your name or organization"
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-cyan-400 flex items-center gap-2">
                    <User className="w-6 h-6" />
                    Attendee Wallet
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Wallet Address
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.attendeeWallet}
                        onChange={(e) => handleInputChange('attendeeWallet', e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-black/20 border border-white/10 rounded-lg focus:border-cyan-400 focus:outline-none transition-colors text-white placeholder-gray-400 font-mono text-sm"
                        placeholder="ALGO... (Algorand wallet address)"
                      />
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-black">A</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enter the Algorand wallet address of the attendee
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-cyan-400 flex items-center gap-2">
                    <Upload className="w-6 h-6" />
                    Certificate Upload
                  </h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-4">
                      Certificate File
                    </label>
                    <div className="border-2 border-dashed border-cyan-400/30 rounded-lg p-8 text-center hover:border-cyan-400/60 transition-colors">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="certificate-upload"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <label htmlFor="certificate-upload" className="cursor-pointer">
                        <div className="space-y-4">
                          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-full flex items-center justify-center">
                            <Upload className="w-8 h-8 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium">Click to upload certificate</p>
                            <p className="text-gray-400 text-sm">PDF, JPG, PNG up to 10MB</p>
                          </div>
                        </div>
                      </label>
                    </div>
                    
                    {formData.certificate && (
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-green-400 text-sm">
                          ✓ {formData.certificate.name} uploaded successfully
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <motion.button
                  onClick={handlePrev}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                    currentStep > 1
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={currentStep === 1}
                  whileHover={currentStep > 1 ? { scale: 1.05 } : {}}
                  whileTap={currentStep > 1 ? { scale: 0.95 } : {}}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </motion.button>

                <motion.button
                  onClick={handleNext}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                    isStepValid()
                      ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!isStepValid()}
                  whileHover={isStepValid() ? { scale: 1.05 } : {}}
                  whileTap={isStepValid() ? { scale: 0.95 } : {}}
                >
                  {currentStep === 3 ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Preview NFT
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 space-y-6"
          >
            <NFTPreviewCard formData={formData} />
            
            <div className="flex gap-4 justify-center">
              <motion.button
                onClick={() => setShowPreview(false)}
                className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Back to Edit
              </motion.button>
              
              <motion.button
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-400 hover:to-teal-400 transition-all shadow-lg shadow-green-500/25"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Coins className="w-5 h-5" />
                Mint NFT
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrganizerDashboard;