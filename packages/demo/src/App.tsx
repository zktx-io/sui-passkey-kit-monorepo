import { useState } from 'react';

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { SuiPasskey } from '@zktx.io/sui-passkey';

import './App.css';
import '@mysten/dapp-kit/dist/index.css';
import { Home, NETWORK } from './pages/Home';

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
  );
}

export default App;
