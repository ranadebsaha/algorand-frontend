import { useWallet } from './WalletContext';
import GlowingButton from '../GlowingButton';

export const WalletConnect = () => {
  const { connect, disconnect, address } = useWallet();

  return (
    <GlowingButton 
      onClick={address ? disconnect : connect}
      className="glassmorphic-button"
    >
      {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Algorand Wallet'}
    </GlowingButton>
  );
};