import React, { createContext, useEffect, useRef } from 'react';

import { registerWallet } from '@mysten/wallet-standard';

import {
  getCredential,
  ISuiPasskeyData,
  resetCredential,
  setCredential,
} from './localStorage';
import { NETWORK, WalletStandard } from './walletStandard';

interface ISuiPasskeyContext {
  export: () => ISuiPasskeyData | undefined;
  import: (data: ISuiPasskeyData) => void;
  reset: () => void;
}

const PasskeyContext = createContext<ISuiPasskeyContext | undefined>(undefined);

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
    <PasskeyContext.Provider
      value={{
        export: () => {
          return getCredential();
        },
        import: (data: ISuiPasskeyData) => {
          setCredential(data);
        },
        reset: () => {
          resetCredential();
        },
      }}
    >
      {children}
    </PasskeyContext.Provider>
  );
};
