import React from 'react';
import { motion } from 'framer-motion';

interface FloatingElementProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const FloatingElement: React.FC<FloatingElementProps> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      className={`absolute ${className}`}
      initial={{ y: 0, rotate: 0 }}
      animate={{ 
        y: [-20, 20, -20],
        rotate: [-5, 5, -5],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
    >
      {children}
    </motion.div>
  );
};

export default FloatingElement;