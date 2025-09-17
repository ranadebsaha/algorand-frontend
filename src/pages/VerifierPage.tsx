import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, QrCode, Keyboard, AlertCircle, Camera, CameraOff } from "lucide-react";
import GlassCard from "../components/GlassCard";
import GlowingButton from "../components/GlowingButton";
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

interface VerificationResult {
  isValid: boolean;
  eventName?: string;
  date?: string;
  organizer?: string;
  hash?: string;
  confidence?: number;
  recipient?: string;
  recipientEmail?: string;
  assetId?: number;
  verificationResults?: {
    is_nft: boolean;
    correct_unit_name: boolean;
    correct_name_format: boolean;
    correct_creator: boolean;
  };
}

const VerifierPage: React.FC = () => {
  const [assetId, setAssetId] = useState<string>("");
  const [useScanner, setUseScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState<string>("");
  const [scannerStatus, setScannerStatus] = useState<string>("Point camera at QR code");
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isQrProcessing, setIsQrProcessing] = useState(false);
  
  // ZXing code reader
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanningRef = useRef<boolean>(false);
  const controlsRef = useRef<any>(null); // Store the scanning controls

  // Initialize ZXing reader
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    return () => {
      cleanup();
    };
  }, []);

  // Cleanup function
  const cleanup = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        console.log("Error stopping controls:", e);
      }
      controlsRef.current = null;
    }
    scanningRef.current = false;
  };

  // Extract Asset ID from various QR code formats
  const extractAssetId = (qrText: string): string | null => {
    console.log("Extracting Asset ID from:", qrText);
    
    if (/^\d+$/.test(qrText.trim())) {
      return qrText.trim();
    }
    
    const urlMatch = qrText.match(/asset[\/=](\d+)/i);
    if (urlMatch) {
      return urlMatch[1];
    }
    
    const explorerMatch = qrText.match(/explorer.*\/asset\/(\d+)/i);
    if (explorerMatch) {
      return explorerMatch[1];
    }
    
    try {
      const parsed = JSON.parse(qrText);
      if (parsed.asset_id || parsed.assetId) {
        return String(parsed.asset_id || parsed.assetId);
      }
    } catch {
      // Not JSON, continue
    }
    
    const numberMatch = qrText.match(/\d+/);
    if (numberMatch) {
      return numberMatch[0];
    }
    
    return null;
  };

  // Handle verification
  const handleVerification = async (idToVerify?: string) => {
    const targetId = idToVerify || assetId;
    if (!targetId) {
      setError("Please enter an Asset ID");
      return;
    }

    if (isVerifying) {
      console.log("Verification already in progress, skipping...");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      console.log("Verifying asset ID:", targetId);
      
      const response = await fetch("http://localhost:8000/verify", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ asset_id: parseInt(targetId, 10) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Backend response:", data);

      if (data.error) {
        throw new Error(data.error);
      }

      const mappedResult: VerificationResult = {
        isValid: data.overall_valid || false,
        eventName: data.note_content?.event || data.asset_info?.name || "N/A",
        date: data.note_content?.date || "N/A",
        organizer: data.note_content?.organizer || "N/A",
        hash: `ASA-${targetId}`,
        confidence: data.overall_valid ? 100 : (data.verification_results ? 
          (Object.values(data.verification_results).filter(Boolean).length / 
           Object.values(data.verification_results).length) * 100 : 0),
        recipient: data.note_content?.recipient_name,
        recipientEmail: data.note_content?.recipient_email,
        assetId: parseInt(targetId, 10),
        verificationResults: data.verification_results
      };

      setVerificationResult(mappedResult);
      setShowResult(true);

      if (useScanner) {
        stopScanner();
        setScannerStatus("✅ Verification complete!");
      }

    } catch (err: any) {
      console.error("Error verifying asset:", err);
      setError(err.message || "Verification failed");
      
      setVerificationResult({
        isValid: false,
        eventName: "Verification Failed",
        date: "Unknown",
        organizer: "Unknown",
        hash: `ASA-${targetId}`,
        confidence: 0,
        assetId: parseInt(targetId, 10)
      });
      setShowResult(true);

      if (useScanner) {
        stopScanner();
        setScannerStatus("❌ Verification failed");
      }
    }

    setIsVerifying(false);
    setIsQrProcessing(false);
  };

  // Start scanner with ZXing
  const startScanner = async () => {
    if (!codeReaderRef.current) {
      setError("QR Code reader not initialized");
      return;
    }

    setUseScanner(true);
    setError("");
    setIsQrProcessing(false);
    setScannerStatus("Initializing camera...");

    try {
      // Get available video input devices
      const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error("No camera devices found");
      }

      // Use the back camera if available, otherwise use the first camera
      const selectedDeviceId = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      )?.deviceId || videoInputDevices[0].deviceId;

      console.log("Using camera device:", selectedDeviceId);
      
      setCameraPermission('granted');
      setScannerStatus("Camera ready - point at QR code");
      scanningRef.current = true;

      if (videoRef.current) {
        // Start decoding from video device - returns controls object
        const controls = await codeReaderRef.current.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result, error) => {
            if (!scanningRef.current) return;

            if (result && !isQrProcessing && !isVerifying) {
              setIsQrProcessing(true);
              scanningRef.current = false; // Stop scanning
              
              const scannedText = result.getText();
              console.log("QR scanned successfully:", scannedText);
              
              const extractedId = extractAssetId(scannedText);
              
              if (extractedId) {
                setAssetId(extractedId);
                setError("");
                setScannerStatus("✅ QR Code detected! Verifying...");
                
                setTimeout(() => {
                  handleVerification(extractedId);
                }, 500);
              } else {
                setError(`Could not extract Asset ID from QR code: ${scannedText}`);
                setScannerStatus("❌ Invalid QR code format");
                setIsQrProcessing(false);
                scanningRef.current = true; // Resume scanning
              }
            }
            
            // Only log non-NotFoundException errors
            if (error && !(error instanceof NotFoundException)) {
              console.warn("QR scan error:", error);
            }
          }
        );

        // Store controls for later cleanup
        controlsRef.current = controls;
      }
      
    } catch (error: any) {
      console.error("Camera error:", error);
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        setError('Camera access denied. Please allow camera access and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please check your camera connection.');
      } else {
        setError(`Camera error: ${error.message}`);
      }
      scanningRef.current = false;
    }
  };

  // Stop scanner
  const stopScanner = () => {
    scanningRef.current = false;
    
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        console.log("Error stopping scanner:", e);
      }
      controlsRef.current = null;
    }
    
    setUseScanner(false);
    setError("");
    setIsQrProcessing(false);
    setScannerStatus("Point camera at QR code");
  };

  // Reset everything
  const resetVerification = () => {
    console.log("Resetting verification state...");
    
    setAssetId("");
    setVerificationResult(null);
    setShowResult(false);
    setIsVerifying(false);
    setError("");
    setIsQrProcessing(false);
    setScannerStatus("Point camera at QR code");
    setCameraPermission('prompt');
    
    if (useScanner) {
      stopScanner();
    }
    
    console.log("Reset complete");
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleAssetIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setAssetId(value);
      setError("");
    }
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
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-green-400" />
              Enter / Scan Asset ID
            </h2>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-200 text-sm flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {!useScanner ? (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={assetId}
                    onChange={handleAssetIdChange}
                    placeholder="Enter Asset ID (e.g., 123456789)"
                    className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none transition-colors"
                    disabled={isVerifying}
                  />
                  {assetId && !isVerifying && (
                    <div className="absolute right-3 top-3 text-green-400 text-xs">
                      ✓ Valid
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4">
                  <GlowingButton
                    icon={Shield}
                    gradient="from-green-500 to-teal-500"
                    onClick={() => handleVerification()}
                    disabled={isVerifying || !assetId || isQrProcessing}
                    className="flex-1"
                  >
                    {isVerifying ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Verifying...
                      </div>
                    ) : (
                      "Verify Certificate"
                    )}
                  </GlowingButton>
                  
                  <GlowingButton
                    icon={QrCode}
                    gradient="from-cyan-500 to-purple-500"
                    onClick={startScanner}
                    disabled={isVerifying || isQrProcessing}
                  >
                    Scan QR
                  </GlowingButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Scanner Status */}
                <div className="text-center p-2 bg-blue-900/20 rounded-lg border border-blue-700/30">
                  <div className="flex items-center justify-center gap-2 text-blue-300 text-sm">
                    <Camera className="w-4 h-4" />
                    {scannerStatus}
                  </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                  <div className="relative">
                    {cameraPermission !== 'denied' && !isQrProcessing ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover rounded-xl bg-black"
                        style={{ transform: 'scaleX(-1)' }} // Mirror the video
                      />
                    ) : (
                      <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-8 text-center h-64 flex items-center justify-center">
                        {cameraPermission === 'denied' ? (
                          <div>
                            <CameraOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-red-200 mb-4">Camera access required</p>
                            <button
                              onClick={() => window.location.reload()}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                            >
                              Grant Permission
                            </button>
                          </div>
                        ) : (
                          <div>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-4"
                            />
                            <p className="text-green-200">Processing QR Code...</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Scanner overlay */}
                    {!isQrProcessing && cameraPermission !== 'denied' && (
                      <div className="absolute inset-0 border-2 border-green-400/50 rounded-xl pointer-events-none">
                        <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-green-400"></div>
                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-green-400"></div>
                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-green-400"></div>
                        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-green-400"></div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <GlowingButton
                    gradient="from-gray-600 to-gray-700"
                    onClick={stopScanner}
                    disabled={isVerifying}
                    className="flex-1"
                  >
                    Cancel Scanner
                  </GlowingButton>
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Results Section */}
        {showResult && verificationResult && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">
                  Verification Result
                </h2>
                <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                  verificationResult.isValid 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {verificationResult.isValid ? "✅ VALID" : "❌ INVALID"}
                </div>
              </div>

              <div className="space-y-4">
                {/* Main Details */}
                <div className="grid grid-cols-1 gap-3 p-4 bg-black/20 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-white/60">Asset ID:</span>
                    <span className="text-white font-mono">{verificationResult.assetId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Event:</span>
                    <span className="text-white">{verificationResult.eventName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Date:</span>
                    <span className="text-white">{formatDate(verificationResult.date!)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Organizer:</span>
                    <span className="text-white">{verificationResult.organizer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Confidence:</span>
                    <span className={`font-bold ${
                      (verificationResult.confidence || 0) > 80 
                        ? 'text-green-400' 
                        : (verificationResult.confidence || 0) > 50 
                          ? 'text-yellow-400' 
                          : 'text-red-400'
                    }`}>
                      {verificationResult.confidence?.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Recipient Info */}
                {verificationResult.recipient && (
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <h4 className="text-blue-400 font-semibold mb-2">Recipient</h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-white">{verificationResult.recipient}</p>
                      <p className="text-white/60">{verificationResult.recipientEmail}</p>
                    </div>
                  </div>
                )}

                {/* Verification Checks */}
                {verificationResult.verificationResults && (
                  <div className="p-4 bg-gray-500/10 rounded-lg">
                    <h4 className="text-gray-300 font-semibold mb-2">Verification Checks</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(verificationResult.verificationResults).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className={value ? 'text-green-400' : 'text-red-400'}>
                            {value ? '✓' : '✗'}
                          </span>
                          <span className="text-white/60 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <GlowingButton
                    gradient="from-blue-500 to-purple-500"
                    onClick={resetVerification}
                    disabled={isVerifying || isQrProcessing}
                    className="flex-1"
                  >
                    {isVerifying || isQrProcessing ? "Processing..." : "Verify Another"}
                  </GlowingButton>
                  
                  {verificationResult.assetId && (
                    <GlowingButton
                      gradient="from-green-500 to-teal-500"
                      onClick={() => window.open(`https://testnet.explorer.perawallet.app/asset/${verificationResult.assetId}`, '_blank')}
                      className="flex-1"
                    >
                      View on Explorer
                    </GlowingButton>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifierPage;
