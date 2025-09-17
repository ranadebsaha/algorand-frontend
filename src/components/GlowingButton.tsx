import React from 'react';
import { motion } from 'framer-motion';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface GlowingButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  gradient?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const GlowingButton: React.FC<GlowingButtonProps> = ({ 
  children, 
  icon: Icon, 
  gradient = 'from-cyan-500 to-purple-500',
  className = '',
  onClick,
  disabled = false
}) => {
  return (
    <motion.button
      className={`
        relative group px-8 py-4 rounded-2xl font-semibold text-white
        bg-gradient-to-r ${gradient} 
        shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40
        transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05, y: -2 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </div>
      
      {/* Border glow */}
      <div className="absolute inset-0 rounded-2xl border border-white/20 group-hover:border-white/40 transition-colors duration-300" />
    </motion.button>
  );
};

export default GlowingButton;