import React, { createContext, useContext, useEffect, useRef } from 'react';

import { registerWallet } from '@mysten/wallet-standard';

import {
  getCredential,
  ISuiPasskeyData,
  resetCredential,
  setCredential,
} from './localStorage';
import { NETWORK, WalletStandard } from './walletStandard';

interface ISuiPasskeyContext {
  read: () => ISuiPasskeyData | undefined;
  write: (data: ISuiPasskeyData) => void;
  reset: () => void;
}

const SuiPasskeyContext = createContext<ISuiPasskeyContext | undefined>(
  undefined,
);

export const SuiPasskey = ({
  network,
  children,
}: {
  network: NETWORK;
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
    <SuiPasskeyContext.Provider
      value={{
        read: () => {
          return getCredential();
        },
        write: (data: ISuiPasskeyData) => {
          setCredential(data);
        },
        reset: () => {
          resetCredential();
        },
      }}
    >
      {children}
    </SuiPasskeyContext.Provider>
  );
};

export const useSuiPasskey = () => {
  const context = useContext(SuiPasskeyContext);
  if (!context) {
    throw new Error('useSuiPasskey must be used within a SuiPasskeyProvider');
  }
  return context;
};
