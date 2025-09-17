// src/components/QRScanner.tsx
import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  fps?: number;
  qrbox?: number;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, fps = 10, qrbox = 250 }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);

    html5QrCodeRef.current
      .start(
        { facingMode: "environment" },
        { fps, qrbox },
        (decodedText) => onScan(decodedText),
        (errorMessage) => {
          // optional: log scan errors
          console.info(errorMessage);
        }
      )
      .catch((err) => console.error("Unable to start QR scanner:", err));

    return () => {
      html5QrCodeRef.current?.stop().catch(console.error);
      html5QrCodeRef.current = null;
    };
  }, [onScan, fps, qrbox]);

  return <div id="qr-scanner" ref={scannerRef} className="w-full"></div>;
};

export default QRScanner;
