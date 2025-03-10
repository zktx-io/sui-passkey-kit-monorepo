# Sui Passkey Provider for Sui Dapp-Kit

![passkey](https://docs.zktx.io/images/sui-passkey.png)

The **Sui Passkey Provider** enables **Passkey wallets** in Dapp-Kit.

With this **React Provider**, developers can seamlessly integrate **Passkey-based wallets** into their dApps. Since it **follows the Wallet Standard**, it ensures a consistent experience not only for developers but also for users, maintaining the same UX as traditional wallets.

By leveraging **Passkey**, users can **sign transactions without passwords or seed phrases**, enhancing security while providing a seamless authentication experience based on **WebAuthn**.

The **Sui Passkey Provider** helps build a **more secure and user-friendly Web3 experience**.

## getting-started

### Installation

```bash
npm install @zktx.io/sui-passkey
```

### Usage
```typescript
import { SuiPasskey } from '@zktx.io/sui-passkey';

const NETWORK = 'testnet';

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
```

### SuiPasskey Props

* network: **Testnet**, and **Devnet**.