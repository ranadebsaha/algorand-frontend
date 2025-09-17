import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, QrCode, Calendar, User, Hash, ChevronLeft, ChevronRight, Wallet, Copy, CheckCircle2, FileSearch, X, Download } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import GlowingButton from '../components/GlowingButton';
import { useWallet } from '../components/wallet/WalletContext';

interface NFTCard {
  id: number;
  eventName: string;
  date: string;
  organizer: string;
  hash: string;
  rarity: 'common' | 'rare' | 'legendary';
}

const TypingAnimation = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(prev => prev + text[index]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50); // Adjust typing speed here (milliseconds)

    return () => clearInterval(interval);
  }, [text]);

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-mono"
    >
      {displayedText}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        |
      </motion.span>
    </motion.span>
  );
};

const NoCertificatesMessage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <GlassCard className="max-w-md mx-auto">
        <div className="p-8 space-y-6">
          <motion.div 
            className="w-16 h-16 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            <FileSearch className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">No Certificates Found</h3>
            <div className="text-gray-400">
              <TypingAnimation text="Your wallet is awaiting its first verified certificate" />
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
};

const WalletAddressDisplay = ({ address }: { address: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.div
      className="flex items-center justify-center gap-2 mt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div className="px-4 py-2 rounded-lg bg-gray-900/50 border border-gray-700">
        <code className="font-mono text-sm text-gray-300">{formatAddress(address)}</code>
      </div>
      <motion.button
        onClick={handleCopy}
        className="p-2 rounded-lg hover:bg-gray-800 transition-colors duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4 text-gray-400" />
        )}
      </motion.button>
    </motion.div>
  );
};

interface CertificatePopupProps {
  nft: NFTCard;
  onClose: () => void;
}

const CertificatePopup = ({ nft, onClose }: CertificatePopupProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl"
        onClick={e => e.stopPropagation()}
      >
        <GlassCard>
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{nft.eventName}</h2>
                <p className="text-gray-400">Certificate of Attendance</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Certificate Content */}
            <div className="space-y-8">
              {/* QR Section */}
              <div className="flex justify-center">
                <motion.div
                  className="w-48 h-48 bg-gradient-to-br from-cyan-500 to-purple-500 p-1 rounded-2xl"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.2)',
                      '0 0 30px rgba(168, 85, 247, 0.4)',
                      '0 0 20px rgba(6, 182, 212, 0.2)'
                    ]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  <div className="w-full h-full bg-gray-900 rounded-xl p-4 flex items-center justify-center">
                    <QrCode className="w-full h-full text-white" />
                  </div>
                </motion.div>
              </div>

              {/* Certificate Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-gray-400 text-sm">Event Date</div>
                    <div className="text-white font-medium">
                      {new Date(nft.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-400 text-sm">Organizer</div>
                    <div className="text-white font-medium">{nft.organizer}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-gray-400 text-sm">Certificate Hash</div>
                    <div className="text-white font-mono text-sm break-all">{nft.hash}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-400 text-sm">Rarity</div>
                    <div className="text-white font-medium capitalize">{nft.rarity}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
              <GlowingButton
                onClick={() => {
                  // Add download functionality here
                  console.log('Downloading certificate...');
                }}
                className="!px-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Certificate
              </GlowingButton>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

const NFTCollectionCard = ({ nft }: { nft: NFTCard }) => {
  const [showCertificate, setShowCertificate] = useState(false);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'rare': return 'from-purple-400 to-pink-500';
      default: return 'from-cyan-400 to-blue-500';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '🌟 Legendary';
      case 'rare': return '✨ Rare';
      default: return '🔷 Common';
    }
  };

  return (
    <GlassCard className="max-w-2xl mx-auto overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/3">
            <motion.div
              className={`aspect-square rounded-xl bg-gradient-to-br ${getRarityColor(nft.rarity)} p-1`}
              animate={{
                boxShadow: [
                  '0 0 20px rgba(234, 179, 8, 0)',
                  '0 0 30px rgba(234, 179, 8, 0.3)',
                  '0 0 20px rgba(234, 179, 8, 0)'
                ]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <div className="w-full h-full rounded-lg bg-gray-900 p-4 flex items-center justify-center">
                <QrCode className="w-full h-full text-white opacity-50" />
              </div>
            </motion.div>
          </div>

          <div className="w-full md:w-2/3 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{nft.eventName}</h3>
              <span className="inline-block px-3 py-1 rounded-full text-sm bg-gradient-to-r from-yellow-400 to-orange-500">
                {getRarityBadge(nft.rarity)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Date</span>
                </div>
                <p className="text-white">{new Date(nft.date).toLocaleDateString()}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Organizer</span>
                </div>
                <p className="text-white">{nft.organizer}</p>
              </div>

              <div className="col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-gray-400">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Token ID</span>
                </div>
                <p className="text-white font-mono text-sm truncate">{nft.hash}</p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-2">
              <GlowingButton 
                className="w-full sm:w-auto"
                onClick={() => setShowCertificate(true)}
              >
                View Certificate
              </GlowingButton>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCertificate && (
          <CertificatePopup
            nft={nft}
            onClose={() => setShowCertificate(false)}
          />
        )}
      </AnimatePresence>
    </GlassCard>
  );
};

const AttendeeDashboard = () => {
  const { address, connect } = useWallet();
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [hasCertificates, setHasCertificates] = useState<boolean>(false);
  
  // Simulated fetch of certificates
  useEffect(() => {
    if (address) {
      // Here you would normally fetch certificates from the blockchain
      // For now, we're using the nftCollection array to simulate
      setHasCertificates(nftCollection.length > 0);
    }
  }, [address]);
  
  const nftCollection: NFTCard[] = [
    {
      id: 1,
      eventName: "Algorand Developer Summit 2024",
      date: "2024-03-15",
      organizer: "Algorand Foundation",
      hash: "QmX7Yh3K9p2mNxR4F8qW5tL9bH6vJ2nM8cZ1xQ3wE7rT5uI",
      rarity: 'legendary'
    },
    {
      id: 2,
      eventName: "Blockchain Workshop Series",
      date: "2024-02-28",
      organizer: "Tech University",
      hash: "QmB8Kp4L2nR7mS9xT6vU3wY1zA5qH8jF9dG7eC4iN0oP2mK",
      rarity: 'rare'
    },
    {
      id: 3,
      eventName: "DeFi Meetup Miami",
      date: "2024-01-20",
      organizer: "DeFi Community",
      hash: "QmF3Rt8uY9vL2nK4jH7mS6wP1qX5eZ9bG8cI0dR3tY7uL2n",
      rarity: 'common'
    }
  ];

  const nextCard = () => {
    setCurrentCardIndex((prev) => (prev + 1) % nftCollection.length);
  };

  const prevCard = () => {
    setCurrentCardIndex((prev) => (prev - 1 + nftCollection.length) % nftCollection.length);
  };

  return (
    <div className="max-w-6xl mx-auto min-h-[80vh] flex flex-col">
      <motion.h1
        className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Attendee Dashboard
      </motion.h1>

      {!address ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex items-center justify-center"
        >
          <GlassCard className="max-w-md mx-auto p-8">
            <div className="text-center space-y-6">
              <motion.div
                className="w-24 h-24 mx-auto bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center"
                animate={{ 
                  rotate: [0, 360],
                  transition: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gray-900 flex items-center justify-center"
                  initial={{ rotate: 0 }}
                >
                  <Wallet className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              <h2 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-6">Connect your Algorand wallet to view your NFT collection</p>
              
              <GlowingButton
                onClick={connect}
                className="w-full"
              >
                Connect Algorand Wallet
              </GlowingButton>
            </div>
          </GlassCard>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Connected Wallet Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <GlassCard className="max-w-md mx-auto">
              <div className="p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Connected Wallet</h3>
                </div>
                <WalletAddressDisplay address={address} />
              </div>
            </GlassCard>
          </motion.div>

          {/* Gamification Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
        >
          <GlassCard className="max-w-md mx-auto">
            <div className="flex items-center justify-center gap-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">POAP Collector</h3>
                <p className="text-gray-400">3 Events Attended</p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Certificates Section */}
        {hasCertificates ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCardIndex}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className="w-full"
                >
                  <NFTCollectionCard nft={nftCollection[currentCardIndex]} />
                </motion.div>
              </AnimatePresence>

              {nftCollection.length > 1 && (
                <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none">
                  <GlowingButton
                    onClick={prevCard}
                    className="!p-2 pointer-events-auto"
                    aria-label="Previous NFT"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </GlowingButton>
                  <GlowingButton
                    onClick={nextCard}
                    className="!p-2 pointer-events-auto"
                    aria-label="Next NFT"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </GlowingButton>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <NoCertificatesMessage />
        )}
        </motion.div>
      )}
    </div>
  );
};

export default AttendeeDashboard;