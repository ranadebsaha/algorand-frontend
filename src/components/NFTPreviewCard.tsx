import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Hash, Shield } from 'lucide-react';
import GlassCard from './GlassCard';

interface NFTPreviewCardProps {
  formData: {
    eventName: string;
    eventDate: string;
    organizerName: string;
    attendeeWallet: string;
    certificate: File | null;
  };
}

const NFTPreviewCard: React.FC<NFTPreviewCardProps> = ({ formData }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateMockHash = () => {
    return 'QmX7Yh3K9p2mNxR4F8qW5tL9bH6vJ2nM8cZ1xQ3wE7rT5uI';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard className="max-w-lg mx-auto">
        {/* NFT Header */}
        <div className="text-center mb-6">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text">
            Attendance NFT
          </h3>
          <p className="text-gray-400 text-sm">Verified on Algorand</p>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <motion.div
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Calendar className="w-5 h-5 text-cyan-400" />
            <div>
              <p className="text-gray-300 text-sm">Event</p>
              <p className="text-white font-semibold">{formData.eventName}</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Calendar className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-gray-300 text-sm">Date</p>
              <p className="text-white font-semibold">{formatDate(formData.eventDate)}</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <User className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-gray-300 text-sm">Organizer</p>
              <p className="text-white font-semibold">{formData.organizerName}</p>
            </div>
          </motion.div>

          {/* Certificate Hash with Glitch Effect */}
          <motion.div
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg border border-white/5 overflow-hidden"
            whileHover={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          >
            <Hash className="w-5 h-5 text-pink-400" />
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Certificate Hash</p>
              <motion.p 
                className="text-pink-400 font-mono text-xs"
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
                {generateMockHash()}
              </motion.p>
            </div>
          </motion.div>

          {/* Recipient Wallet */}
          <motion.div
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-400/20"
            whileHover={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }}
          >
            <div className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">A</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">Recipient</p>
              <p className="text-cyan-400 font-mono text-xs break-all">
                {formData.attendeeWallet}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Holographic Border Effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'linear-gradient(45deg, transparent, rgba(236, 72, 153, 0.1), transparent, rgba(34, 211, 238, 0.1), transparent)',
            backgroundSize: '300% 300%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </GlassCard>
    </motion.div>
  );
};

export default NFTPreviewCard;