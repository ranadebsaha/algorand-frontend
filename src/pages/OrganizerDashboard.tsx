import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, User, AtSign, FileText, Coins, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface FormData {
  eventName: string;
  organizerName: string;
  eventDate: string;
  attendeeName: string;
  attendeeEmail: string;
  certificate: File | null;
}

interface VerificationResult {
  isValid: boolean;
  message: string;
}

interface GeminiAnalysis {
  isValid: boolean;
  confidence: number;
  type: string;
  reasoning: string;
  suggestions?: string;
}

const OrganizerDashboard: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    eventName: "",
    organizerName: "",
    eventDate: "",
    attendeeName: "",
    attendeeEmail: "",
    certificate: null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verified' | 'failed'>('idle');
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [isMinting, setIsMinting] = useState<boolean>(false);

  // Initialize Gemini AI with environment variable for Vite
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result.split(',')[1]); // Remove data:mime;base64, prefix
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
    });
  };

  // Verify certificate with Gemini AI
  const verifyCertificate = async (file: File): Promise<VerificationResult> => {
    try {
      setIsVerifying(true);
      console.log("Starting certificate verification...");

      // Validate API key
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file');
      }

      // Convert file to base64
      const base64Data = await fileToBase64(file);
      
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create the prompt for certificate verification
      const prompt = `
        Analyze this document and determine if it is a legitimate certificate or certification document.
        
        Please check for the following characteristics of a valid certificate:
        1. Contains official headers or letterheads
        2. Has recipient name and details
        3. Contains issuing organization/institution information
        4. Has certification/completion details
        5. Contains dates (issue date, completion date, etc.)
        6. Has official signatures or seals
        7. Mentions specific achievements, courses, or qualifications
        8. Has a professional layout and formatting
        
        Respond with a JSON object in this exact format:
        {
          "isValid": true/false,
          "confidence": 0-100,
          "type": "certificate_type" (e.g., "completion certificate", "achievement certificate", "participation certificate", "academic certificate"),
          "reasoning": "detailed explanation of why this is or isn't a certificate",
          "suggestions": "if not valid, suggest what might be missing"
        }
        
        Be strict in your evaluation. Only return isValid: true if this is clearly a legitimate certificate document.
      `;

      // Generate content with the image
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log("Gemini raw response:", text);

      // Try to parse JSON response
      try {
        // Extract JSON from the response (sometimes Gemini adds markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No JSON found in response");
        }
        
        const analysis: GeminiAnalysis = JSON.parse(jsonMatch[0]);
        
        return {
          isValid: analysis.isValid && analysis.confidence > 70, // Require high confidence
          message: analysis.isValid 
            ? `✅ Valid ${analysis.type} detected (${analysis.confidence}% confidence): ${analysis.reasoning}`
            : `❌ Not a valid certificate (${analysis.confidence}% confidence): ${analysis.reasoning}. ${analysis.suggestions || ''}`
        };
        
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        
        // Fallback: simple text analysis
        const lowerText = text.toLowerCase();
        const certificateKeywords = ['certificate', 'certification', 'diploma', 'award', 'completion', 'achievement', 'qualified', 'accredited'];
        const hasKeywords = certificateKeywords.some(keyword => lowerText.includes(keyword));
        
        return {
          isValid: hasKeywords,
          message: hasKeywords 
            ? "✅ Appears to be a certificate based on content analysis"
            : "❌ This document doesn't appear to be a certificate. Please upload a valid certificate document."
        };
      }

    } catch (error: unknown) {
      console.error("Certificate verification error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        isValid: false,
        message: `❌ Verification failed: ${errorMessage}. Please try again.`
      };
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle file change with verification
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    if (files && files[0]) {
      const file = files[0];
      
      // Reset verification status
      setVerificationStatus('idle');
      setVerificationMessage('');
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setVerificationStatus('failed');
        setVerificationMessage('❌ File size too large. Please upload a file smaller than 10MB.');
        return;
      }
      
      // Set file and preview
      setFormData((prev) => ({ ...prev, [name]: file }));
      
      // Only create preview for PDFs
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        
        // Clean up previous URL to prevent memory leaks
        return () => URL.revokeObjectURL(url);
      } else {
        setPreviewUrl(null);
      }

      // Verify the certificate with Gemini
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        const verification = await verifyCertificate(file);
        
        setVerificationStatus(verification.isValid ? 'verified' : 'failed');
        setVerificationMessage(verification.message);
        
        if (!verification.isValid) {
          // Clear the file if verification fails
          setFormData((prev) => ({ ...prev, [name]: null }));
          setPreviewUrl(null);
          
          // Reset file input
          if (e.target) {
            e.target.value = '';
          }
        }
      } else {
        setVerificationStatus('failed');
        setVerificationMessage('❌ Please upload a PDF or image file (JPEG, PNG) of the certificate.');
        setFormData((prev) => ({ ...prev, [name]: null }));
        setPreviewUrl(null);
        
        // Reset file input
        if (e.target) {
          e.target.value = '';
        }
      }
      
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle Mint NFT
  const handleMintNFT = async (): Promise<void> => {
    if (!formData.certificate) {
      alert("Please upload a certificate file first.");
      return;
    }

    if (verificationStatus !== 'verified') {
      alert("Please upload a valid certificate before minting.");
      return;
    }

    // Validate other required fields
    const requiredFields = [
      { field: formData.eventName, name: 'Event Name' },
      { field: formData.organizerName, name: 'Organizer Name' },
      { field: formData.eventDate, name: 'Event Date' },
      { field: formData.attendeeName, name: 'Attendee Name' },
      { field: formData.attendeeEmail, name: 'Attendee Email' }
    ];

    const missingFields = requiredFields.filter(({ field }) => !field.trim());
    if (missingFields.length > 0) {
      alert(`Please fill in the following fields: ${missingFields.map(f => f.name).join(', ')}`);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.attendeeEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsMinting(true);

    const formDataToSend = new FormData();
    formDataToSend.append("event", formData.eventName);
    formDataToSend.append("organizer", formData.organizerName);
    formDataToSend.append("date", formData.eventDate);
    formDataToSend.append("recipient_name", formData.attendeeName);
    formDataToSend.append("recipient_email", formData.attendeeEmail);
    formDataToSend.append("certificate_file", formData.certificate);

    try {
      const response = await fetch("http://localhost:8000/mint", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        alert(`✅ Certificate NFT Minted Successfully!\n\nAsset ID: ${result.asset_id}\nTransaction ID: ${result.transaction_id || 'N/A'}\n\n${result.email_sent ? '📧 Email notification sent to recipient' : '⚠️ Email notification failed'}`);
        console.log("Mint response:", result);
        
        // Reset form after successful minting
        setFormData({
          eventName: "",
          organizerName: "",
          eventDate: "",
          attendeeName: "",
          attendeeEmail: "",
          certificate: null,
        });
        setPreviewUrl(null);
        setVerificationStatus('idle');
        setVerificationMessage('');
        
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
      } else {
        throw new Error(result.error || "Minting failed");
      }
    } catch (error: unknown) {
      console.error("Error minting NFT:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Minting failed: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Organizer Dashboard
      </motion.h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/30 p-6 rounded-xl border border-green-400/30 shadow-lg backdrop-blur-sm"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-green-400" />
            Certificate Upload & Details
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="Event Name *"
                className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
                required
              />
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleChange}
                placeholder="Organizer Name *"
                className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
                required
              />
            </div>
            
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-400 flex-shrink-0" />
                <input
                  type="text"
                  name="attendeeName"
                  value={formData.attendeeName}
                  onChange={handleChange}
                  placeholder="Attendee Name *"
                  className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <AtSign className="w-5 h-5 text-green-400 flex-shrink-0" />
                <input
                  type="email"
                  name="attendeeEmail"
                  value={formData.attendeeEmail}
                  onChange={handleChange}
                  placeholder="Attendee Email *"
                  className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Certificate Upload Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400 flex-shrink-0" />
                <label className="text-white font-medium">Certificate File *</label>
              </div>
              
              <input
                type="file"
                name="certificate"
                accept="application/pdf,image/jpeg,image/png,image/jpg"
                onChange={handleChange}
                className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 file:cursor-pointer cursor-pointer"
                disabled={isVerifying}
              />
              
              <p className="text-gray-400 text-xs">
                Supported formats: PDF, JPEG, PNG (Max size: 10MB)
              </p>

              {/* Verification Status */}
              {isVerifying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-lg border border-blue-700/30"
                >
                  <Loader className="w-5 h-5 text-blue-400 animate-spin" />
                  <span className="text-blue-300 text-sm">
                    AI is verifying your certificate...
                  </span>
                </motion.div>
              )}

              {verificationStatus === 'verified' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-green-900/20 rounded-lg border border-green-700/30"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 text-sm font-medium">Certificate Verified!</p>
                    <p className="text-green-200 text-xs mt-1">{verificationMessage}</p>
                  </div>
                </motion.div>
              )}

              {verificationStatus === 'failed' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 p-3 bg-red-900/20 rounded-lg border border-red-700/30"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium">Verification Failed</p>
                    <p className="text-red-200 text-xs mt-1">{verificationMessage}</p>
                  </div>
                </motion.div>
              )}
            </div>

            <motion.button
              onClick={handleMintNFT}
              disabled={!formData.certificate || verificationStatus !== 'verified' || isMinting || isVerifying}
              className={`flex items-center justify-center gap-2 px-8 py-3 w-full rounded-lg transition-all shadow-lg ${
                formData.certificate && verificationStatus === 'verified' && !isMinting && !isVerifying
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white shadow-green-500/25 cursor-pointer'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed shadow-gray-600/25'
              }`}
              whileHover={formData.certificate && verificationStatus === 'verified' && !isMinting ? { scale: 1.02 } : {}}
              whileTap={formData.certificate && verificationStatus === 'verified' && !isMinting ? { scale: 0.98 } : {}}
            >
              {isMinting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Minting NFT...
                </>
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  Mint Certificate NFT
                </>
              )}
            </motion.button>
            
            {verificationStatus !== 'verified' && (
              <p className="text-gray-400 text-xs text-center">
                Please upload and verify a valid certificate before minting
              </p>
            )}
          </div>
        </motion.div>

        {/* Preview Section */}
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/30 p-6 rounded-xl border border-green-400/30 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Certificate Preview
              </h2>
              {verificationStatus === 'verified' && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-600/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-xs">Verified</span>
                </div>
              )}
            </div>
            
            <div className="relative">
              <iframe
                src={previewUrl}
                title="Certificate Preview"
                className="w-full h-[500px] rounded-lg border border-green-400/30 bg-white"
              />
              
              {isVerifying && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                  <div className="bg-black/80 p-4 rounded-lg flex items-center gap-3">
                    <Loader className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="text-white">AI is analyzing the certificate...</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;
