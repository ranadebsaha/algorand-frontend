import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, User, Shield, Sparkles } from 'lucide-react';
import GlowingButton from '../components/GlowingButton';
import FloatingElement from '../components/FloatingElement';
import { TypeAnimation } from 'react-type-animation';

const LandingPage: React.FC = () => {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-center mb-16"
      >
        <motion.div 
          className="text-5xl md:text-7xl font-bold mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <TypeAnimation
            sequence={[
              'Own Your Attendance',
              2000,
              'Own Your Presence',
              2000,
              'Own Your Identity',
              2000,
            ]}
            wrapper="h1"
            speed={50}
            repeat={Infinity}
            className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          />
        </motion.div>
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <span className="text-cyan-400">Verified on Algorand</span>
        </motion.p>
        
        {/* Glitch effect for subtitle */}
        <motion.div
          className="text-sm text-gray-500 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span className="inline-block animate-pulse">{'>'} BLOCKCHAIN-VERIFIED ATTENDANCE PROOF {'<'}</span>
        </motion.div>
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        className="flex flex-col md:flex-row gap-6 mb-16"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
      >
        <Link to="/organizer">
          <GlowingButton icon={Users} gradient="from-purple-500 to-pink-500">
            Organizer
          </GlowingButton>
        </Link>
        
        <Link to="/attendee">
          <GlowingButton icon={User} gradient="from-cyan-500 to-blue-500">
            Attendee
          </GlowingButton>
        </Link>
        
        <Link to="/verify">
          <GlowingButton icon={Shield} gradient="from-green-500 to-teal-500">
            Verifier
          </GlowingButton>
        </Link>
      </motion.div>

      {/* Floating 3D Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingElement delay={0} className="top-20 left-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-sm border border-white/10" />
        </FloatingElement>
        
        <FloatingElement delay={2} className="top-40 right-20">
          <div className="w-16 h-16 rotate-45 bg-gradient-to-r from-pink-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10" />
        </FloatingElement>
        
        <FloatingElement delay={4} className="bottom-40 left-20">
          <Sparkles className="w-12 h-12 text-cyan-400/30" />
        </FloatingElement>
      </div>

      {/* Footer */}
      <motion.div
        className="absolute bottom-8 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <p>Powered by Algorand Blockchain</p>
        <div className="flex items-center justify-center mt-2 gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>Network Status: Active</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;