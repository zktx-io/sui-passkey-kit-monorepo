import React, { createContext, useEffect, useRef } from 'react';

import { registerWallet } from '@mysten/wallet-standard';

import { WalletStandard } from './walletStandard';

interface ISuiPasskeyContext {}

const PasskeyContext = createContext<ISuiPasskeyContext | undefined>(undefined);

export const SuiPasskey = ({
  network,
  children,
}: {
  network: 'mainnet' | 'testnet' | 'devnet';
  children: React.ReactNode;
}) => {
  const initialized = useRef<boolean>(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const wallet = new WalletStandard({ network });
      registerWallet(wallet);
    }
  }, [network]);
  return (
    <PasskeyContext.Provider value={{}}>{children}</PasskeyContext.Provider>
  );
};
