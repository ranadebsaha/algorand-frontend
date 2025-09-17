import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, User, Users, Shield } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/organizer', icon: Users, label: 'Organizer' },
    { path: '/attendee', icon: User, label: 'Attendee' },
    { path: '/verify', icon: Shield, label: 'Verify' },
  ];

  return (
    <div className="relative z-10 min-h-screen pb-20">
      {/* Header */}
      <header className="container mx-auto px-4 py-4">
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-xl border-t border-white/10 z-50">
        <div className="flex justify-around items-center py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'text-cyan-400 bg-cyan-400/10' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={20} />
                  <span className="text-xs mt-1">{item.label}</span>
                  {isActive && (
                    <motion.div
                      className="w-1 h-1 bg-cyan-400 rounded-full mt-1"
                      layoutId="activeIndicator"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;