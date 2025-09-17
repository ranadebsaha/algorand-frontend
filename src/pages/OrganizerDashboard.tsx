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
  const [skipVerification, setSkipVerification] = useState<boolean>(false);

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
    // Skip verification for testing
    if (skipVerification) {
      console.log("Skipping verification (test mode)");
      return {
        isValid: true,
        message: "✅ Verification skipped (test mode)"
      };
    }

    try {
      setIsVerifying(true);
      console.log("Starting certificate verification...");

      // Check if API key exists
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("API Key present:", !!apiKey);
      
      if (!apiKey) {
        console.error("No API key found");
        throw new Error('Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file');
      }

      // Convert file to base64
      const base64Data = await fileToBase64(file);
      console.log("File converted to base64, length:", base64Data.length);
      
      // Get the generative model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      console.log("Model initialized");

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
          "isValid": true,
          "confidence": 85,
          "type": "completion certificate",
          "reasoning": "This document contains all the necessary elements of a legitimate certificate"
        }
        
        Be strict in your evaluation. Only return isValid: true if this is clearly a legitimate certificate document.
      `;

      console.log("Sending request to Gemini...");
      
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
      
      console.log("Gemini response received:", text);

      // Try to parse JSON response
      try {
        // Extract JSON from the response (sometimes Gemini adds markdown formatting)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          console.log("No JSON found, using fallback");
          throw new Error("No JSON found in response");
        }
        
        const analysis: GeminiAnalysis = JSON.parse(jsonMatch[0]);
        console.log("Parsed analysis:", analysis);
        
        const isValid = analysis.isValid && analysis.confidence > 70;
        console.log("Final validation result:", isValid);
        
        return {
          isValid,
          message: isValid 
            ? `✅ Valid ${analysis.type} detected (${analysis.confidence}% confidence): ${analysis.reasoning}`
            : `❌ Not a valid certificate (${analysis.confidence}% confidence): ${analysis.reasoning}`
        };
        
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError);
        console.log("Using fallback text analysis");
        
        // Fallback: simple text analysis
        const lowerText = text.toLowerCase();
        const certificateKeywords = ['certificate', 'certification', 'diploma', 'award', 'completion', 'achievement', 'qualified', 'accredited'];
        const hasKeywords = certificateKeywords.some(keyword => lowerText.includes(keyword));
        
        console.log("Fallback analysis result:", hasKeywords);
        
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
      console.log("Verification process completed");
    }
  };

  // Handle file change with verification
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    
    console.log("handleChange called:", { name, files: files?.length });
    
    if (files && files[0]) {
      const file = files[0];
      
      console.log("File selected:", {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      // Reset verification status
      setVerificationStatus('idle');
      setVerificationMessage('');
      console.log("Verification status reset to idle");
      
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        console.log("File too large");
        setVerificationStatus('failed');
        setVerificationMessage('❌ File size too large. Please upload a file smaller than 10MB.');
        return;
      }
      
      // Set file and preview
      setFormData((prev) => ({ ...prev, [name]: file }));
      console.log("Form data updated with file");
      
      // Only create preview for PDFs
      if (file.type === 'application/pdf') {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        console.log("Preview URL created for PDF");
      } else {
        setPreviewUrl(null);
        console.log("No preview for non-PDF file");
      }

      // Check if file type is supported
      if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
        console.log("File type supported, starting verification...");
        
        try {
          const verification = await verifyCertificate(file);
          console.log("Verification result:", verification);
          
          setVerificationStatus(verification.isValid ? 'verified' : 'failed');
          setVerificationMessage(verification.message);
          
          if (!verification.isValid) {
            console.log("Verification failed, clearing file");
            setFormData((prev) => ({ ...prev, [name]: null }));
            setPreviewUrl(null);
            
            if (e.target) {
              e.target.value = '';
            }
          } else {
            console.log("Verification successful!");
          }
        } catch (error) {
          console.error("Error during verification:", error);
          setVerificationStatus('failed');
          setVerificationMessage('❌ Error during verification. Please try again.');
        }
      } else {
        console.log("Unsupported file type");
        setVerificationStatus('failed');
        setVerificationMessage('❌ Please upload a PDF or image file (JPEG, PNG) of the certificate.');
        setFormData((prev) => ({ ...prev, [name]: null }));
        setPreviewUrl(null);
        
        if (e.target) {
          e.target.value = '';
        }
      }
      
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Manual verification override for testing
  // const handleManualVerify = () => {
  //   if (formData.certificate) {
  //     console.log("Manual verification triggered");
  //     setVerificationStatus('verified');
  //     setVerificationMessage('✅ Manually verified for testing');
  //   }
  // };

  // Handle Mint NFT
  const handleMintNFT = async (): Promise<void> => {
    console.log("Mint button clicked");
    console.log("Current state:", {
      certificate: !!formData.certificate,
      verificationStatus,
      isMinting,
      isVerifying
    });

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
    console.log("Starting minting process...");

    const formDataToSend = new FormData();
    formDataToSend.append("event", formData.eventName);
    formDataToSend.append("organizer", formData.organizerName);
    formDataToSend.append("date", formData.eventDate);
    formDataToSend.append("recipient_name", formData.attendeeName);
    formDataToSend.append("recipient_email", formData.attendeeEmail);
    formDataToSend.append("certificate_file", formData.certificate);

    try {
      console.log("Sending request to backend...");
      const response = await fetch("http://localhost:8000/mint", {
        method: "POST",
        body: formDataToSend,
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Mint result:", result);

      if (result.success) {
        alert(`✅ Certificate NFT Minted Successfully!\n\nAsset ID: ${result.asset_id}\nTransaction ID: ${result.transaction_id || 'N/A'}\n\n${result.email_sent ? '📧 Email notification sent to recipient' : '⚠️ Email notification failed'}`);
        
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
      console.log("Minting process completed");
    }
  };

  // Check if button should be enabled
  const isButtonEnabled = formData.certificate && 
                         verificationStatus === 'verified' && 
                         !isMinting && 
                         !isVerifying;

  console.log("Button enabled check:", {
    certificate: !!formData.certificate,
    verificationStatus,
    isMinting,
    isVerifying,
    isButtonEnabled
  });

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

              {/* Development Mode Options */}
              {/* {import.meta.env.DEV && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-yellow-900/20 rounded border border-yellow-700/30">
                    <input
                      type="checkbox"
                      id="skipVerification"
                      checked={skipVerification}
                      onChange={(e) => setSkipVerification(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="skipVerification" className="text-yellow-300 text-xs">
                      Skip AI verification (dev mode)
                    </label>
                  </div> */}

                  {/* {formData.certificate && verificationStatus !== 'verified' && (
                    <button
                      onClick={handleManualVerify}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Manual Verify (Test)
                    </button>
                  )} */}

                  {/* <div className="p-2 bg-gray-800 rounded text-xs text-gray-300">
                    <div>Certificate: {formData.certificate ? '✅' : '❌'}</div>
                    <div>Verification: {verificationStatus}</div>
                    <div>Is Minting: {isMinting ? '✅' : '❌'}</div>
                    <div>Is Verifying: {isVerifying ? '✅' : '❌'}</div>
                    <div>Button Enabled: {isButtonEnabled ? '✅' : '❌'}</div>
                  </div> */}
                {/* </div>
              )} */}

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
              disabled={!isButtonEnabled}
              className={`flex items-center justify-center gap-2 px-8 py-3 w-full rounded-lg transition-all shadow-lg ${
                isButtonEnabled
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-400 hover:to-teal-400 text-white shadow-green-500/25 cursor-pointer'
                  : 'bg-gray-600 text-gray-300 cursor-not-allowed shadow-gray-600/25'
              }`}
              whileHover={isButtonEnabled ? { scale: 1.02 } : {}}
              whileTap={isButtonEnabled ? { scale: 0.98 } : {}}
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
            
            {!isButtonEnabled && (
              <p className="text-gray-400 text-xs text-center">
                {!formData.certificate 
                  ? "Please upload a certificate file" 
                  : verificationStatus !== 'verified' 
                    ? "Please wait for certificate verification" 
                    : "Please fill all required fields"}
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
