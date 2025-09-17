import { createContext, useContext, useState, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextType {
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  connect: async () => {},
  disconnect: async () => {},
});

const peraWallet = new PeraWalletConnect();

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);

  const connect = async () => {
    try {
      const accounts = await peraWallet.connect();
      setAddress(accounts[0]);
    } catch (error) {
      console.error("Connection Failed:", error);
    }
  };

  const disconnect = async () => {
    await peraWallet.disconnect();
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ connect, disconnect, address }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);