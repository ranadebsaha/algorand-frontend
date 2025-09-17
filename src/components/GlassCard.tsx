import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      className={`
        backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6
        shadow-2xl shadow-cyan-500/10 hover:shadow-cyan-500/20
        transition-all duration-300 hover:border-white/20
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;