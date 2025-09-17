import React, { useState } from "react";
import { motion } from "framer-motion";
import { Upload, User, AtSign, FileText, Coins } from "lucide-react";

const OrganizerDashboard: React.FC = () => {
  const [formData, setFormData] = useState({
    eventName: "",
    organizerName: "",
    eventDate: "",
    attendeeName: "",
    attendeeEmail: "",
    certificate: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 🔹 Update form data
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      setPreviewUrl(URL.createObjectURL(files[0]));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Handle Mint
  const handleMintNFT = async () => {
    if (!formData.certificate) {
      alert("Please upload a certificate file first.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("event", formData.eventName);
    formDataToSend.append("organizer", formData.organizerName);
    formDataToSend.append("date", formData.eventDate);
    formDataToSend.append("recipient_name", formData.attendeeName);
    formDataToSend.append("recipient_email", formData.attendeeEmail);
    formDataToSend.append("certificate_file", formData.certificate);

    try {
      const response = await fetch(
        "http://localhost:8000/mint/", // 🔗 Replace with your Railway URL
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const result = await response.json();
      if (result.success) {
        alert(`✅ NFT Minted!\nAsset ID: ${result.asset_id}`);
        console.log("Mint response:", result);
      } else {
        alert("❌ Minting failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("❌ Error while minting NFT. Check console.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
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
          className="bg-black/30 p-6 rounded-xl border border-green-400/30 shadow-lg"
        >
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-green-400" />
            Upload Event Details
          </h2>

          <div className="space-y-4">
            <input
              type="text"
              name="eventName"
              value={formData.eventName}
              onChange={handleChange}
              placeholder="Event Name"
              className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
            />
            <input
              type="text"
              name="organizerName"
              value={formData.organizerName}
              onChange={handleChange}
              placeholder="Organizer Name"
              className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
            />
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
            />

            <div className="flex gap-2">
              <User className="w-5 h-5 text-green-400" />
              <input
                type="text"
                name="attendeeName"
                value={formData.attendeeName}
                onChange={handleChange}
                placeholder="Attendee Name"
                className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <AtSign className="w-5 h-5 text-green-400" />
              <input
                type="email"
                name="attendeeEmail"
                value={formData.attendeeEmail}
                onChange={handleChange}
                placeholder="Attendee Email"
                className="w-full p-3 rounded-lg bg-black/30 text-white border border-green-400/30 focus:border-green-400 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <FileText className="w-5 h-5 text-green-400" />
              <input
                type="file"
                name="certificate"
                accept="application/pdf"
                onChange={handleChange}
                className="w-full text-white"
              />
            </div>

            <motion.button
              onClick={handleMintNFT}
              className="flex items-center justify-center gap-2 px-8 py-3 w-full bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:from-green-400 hover:to-teal-400 transition-all shadow-lg shadow-green-500/25"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Coins className="w-5 h-5" />
              Mint NFT
            </motion.button>
          </div>
        </motion.div>

        {/* Preview Section */}
        {previewUrl && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/30 p-6 rounded-xl border border-green-400/30 shadow-lg"
          >
            <h2 className="text-2xl font-semibold text-white mb-6">
              Certificate Preview
            </h2>
            <iframe
              src={previewUrl}
              title="Certificate Preview"
              className="w-full h-[500px] rounded-lg border border-green-400/30"
            ></iframe>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;