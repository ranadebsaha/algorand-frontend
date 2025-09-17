import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Keyboard, QrCode } from "lucide-react";
import GlassCard from "../components/GlassCard";
import GlowingButton from "../components/GlowingButton";
import QRScanner from "../components/QRScanner";

interface VerificationResult {
  isValid: boolean;
  eventName?: string;
  date?: string;
  organizer?: string;
  hash?: string;
  confidence?: number;
  recipient?: string;
  recipientEmail?: string;
}

const VerifierPage: React.FC = () => {
  const [assetId, setAssetId] = useState("");
  const [useScanner, setUseScanner] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleVerification = async () => {
    if (!assetId) return;
    setIsVerifying(true);
    try {
      const response = await fetch("http://localhost:8000/verify/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_id: Number(assetId) }),
      });
      if (!response.ok) throw new Error("Backend verification failed");
      const data = await response.json();

      setVerificationResult({
        isValid: data.overall_valid,
        eventName: data.note_content?.event || "N/A",
        date: data.note_content?.date || "N/A",
        organizer: data.note_content?.organizer || "N/A",
        hash: `ASA-${assetId}`,
        confidence: data.overall_valid ? 100 : 0,
        recipient: data.note_content?.recipient_name,
        recipientEmail: data.note_content?.recipient_email,
      });
    } catch (err) {
      console.error(err);
      setVerificationResult({
        isValid: false,
        eventName: "Unknown",
        date: "Unknown",
        organizer: "Unknown",
        hash: `ASA-${assetId}`,
        confidence: 0,
      });
    }
    setIsVerifying(false);
    setShowResult(true);
  };

  const resetVerification = () => {
    setAssetId("");
    setVerificationResult(null);
    setShowResult(false);
    setIsVerifying(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
        {/* Input Section */}
        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Keyboard className="w-6 h-6 text-green-400" />
              Enter / Scan Asset ID
            </h2>

            {!useScanner ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="Enter Asset ID..."
                  className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
                />
                <div className="flex gap-4">
                  <GlowingButton
                    icon={Shield}
                    gradient="from-green-500 to-teal-500"
                    onClick={handleVerification}
                    disabled={isVerifying || !assetId}
                    className="flex-1"
                  >
                    {isVerifying ? "Verifying..." : "Verify Certificate"}
                  </GlowingButton>
                  <GlowingButton
                    icon={QrCode}
                    gradient="from-cyan-500 to-purple-500"
                    onClick={() => setUseScanner(true)}
                  >
                    Scan QR
                  </GlowingButton>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <QRScanner
                  onScan={(decodedText) => {
                    setAssetId(decodedText);
                    setUseScanner(false);
                  }}
                />
                <GlowingButton gradient="from-gray-600 to-gray-700" onClick={() => setUseScanner(false)}>
                  Cancel Scanner
                </GlowingButton>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Results Section */}
        {showResult && verificationResult && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <GlassCard>
              <h2 className="text-2xl font-semibold text-white mb-6">Verification Result</h2>
              {verificationResult.isValid ? (
                <p className="text-green-400 font-bold">✅ Valid Certificate</p>
              ) : (
                <p className="text-red-400 font-bold">❌ Invalid Certificate</p>
              )}
              <ul className="mt-4 space-y-2 text-white/80">
                <li>
                  <strong>Event:</strong> {verificationResult.eventName}
                </li>
                <li>
                  <strong>Date:</strong> {formatDate(verificationResult.date!)}
                </li>
                <li>
                  <strong>Organizer:</strong> {verificationResult.organizer}
                </li>
                <li>
                  <strong>Hash:</strong> {verificationResult.hash}
                </li>
                <li>
                  <strong>Confidence:</strong> {verificationResult.confidence?.toFixed(2)}%
                </li>
                {verificationResult.recipient && (
                  <li>
                    <strong>Recipient:</strong> {verificationResult.recipient} ({verificationResult.recipientEmail})
                  </li>
                )}
              </ul>
              <GlowingButton gradient="from-red-500 to-pink-500" onClick={resetVerification} className="mt-6">
                Reset
              </GlowingButton>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VerifierPage;
