import React, { createContext, useEffect, useRef } from 'react';

import { registerWallet } from '@mysten/wallet-standard';

import { resetCredential } from './localStorage';
import { IRpOptions, WalletStandard } from './walletStandard';

interface ISuiPasskeyContext {
  reset: () => void;
}

const PasskeyContext = createContext<ISuiPasskeyContext | undefined>(undefined);

export const SuiPasskey = ({
  network,
  options,
  children,
}: {
  network: 'mainnet' | 'testnet' | 'devnet';
  options?: IRpOptions;
  children: React.ReactNode;
}) => {
  const initialized = useRef<boolean>(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const wallet = new WalletStandard({ network, options });
      registerWallet(wallet);
    }
  }, [network, options]);
  return (
    <PasskeyContext.Provider
      value={{
        reset: () => {
          resetCredential();
        },
      }}
    >
      {children}
    </PasskeyContext.Provider>
  );
};
