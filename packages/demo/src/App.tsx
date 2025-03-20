import { useState } from 'react';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SuiPasskey } from '@zktx.io/sui-passkey-kit';
import { WalrusScan } from '@zktx.io/walrus-scan';
import { enqueueSnackbar } from 'notistack';

import './App.css';
import '@mysten/dapp-kit/dist/index.css';
import { Home } from './pages/Home';
import { ICON, NETWORK } from './config';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

function App() {
  const [activeNetwork, setActiveNetwork] = useState<'testnet' | 'devnet'>(
    NETWORK,
  );
  return (
    <WalrusScan
      network={NETWORK}
      icon={ICON}
      onEvent={(notification) => {
        enqueueSnackbar(notification.message, {
          variant: notification.variant,
          style: {
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        });
      }}
    >
      <SuiPasskey network={activeNetwork}>
        <SuiClientProvider
          networks={{
            testnet: { url: getFullnodeUrl('testnet') },
            devnet: { url: getFullnodeUrl('devnet') },
          }}
          defaultNetwork={activeNetwork as 'testnet' | 'devnet'}
          onNetworkChange={(network) => {
            setActiveNetwork(network);
          }}
        >
          <WalletProvider autoConnect>
            <RouterProvider router={router} />
          </WalletProvider>
        </SuiClientProvider>
      </SuiPasskey>
    </WalrusScan>
  );
}

export default App;
