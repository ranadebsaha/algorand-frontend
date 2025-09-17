import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AttendeeDashboard from './pages/AttendeeDashboard';
import VerifierPage from './pages/VerifierPage';
import { WalletProvider } from './components/wallet/WalletContext';

function App() {
  return (
    <WalletProvider>
      <Router>
        <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
          {/* Background gradient */}
          <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900 to-cyan-900/20" />
          
          {/* Animated background particles */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
                initial={{ 
                  x: Math.random() * window.innerWidth, 
                  y: Math.random() * window.innerHeight 
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          ))}
        </div>

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/organizer" element={<Layout><OrganizerDashboard /></Layout>} />
          <Route path="/attendee" element={<Layout><AttendeeDashboard /></Layout>} />
          <Route path="/verify" element={<Layout><VerifierPage /></Layout>} />
        </Routes>
      </div>
    </Router>
    </WalletProvider>
  );
}

export default App;