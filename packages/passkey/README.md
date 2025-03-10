# Sui Passkey Provider for Sui Dapp-Kit

![passkey](https://docs.zktx.io/images/sui-passkey.png)

The **Sui Passkey Provider** enables **Passkey wallets** in Dapp-Kit.

With this **React Provider**, developers can seamlessly integrate **Passkey-based wallets** into their dApps. Since it **follows the Wallet Standard**, it ensures a consistent experience not only for developers but also for users, maintaining the same UX as traditional wallets.

By leveraging **Passkey**, users can **sign transactions without passwords or seed phrases**, enhancing security while providing a seamless authentication experience based on **WebAuthn**.

## Key Management Considerations
+ **Passkeys cannot be exported**: A passkey created on one device cannot be manually transferred to another device unless cloud synchronization is enabled.
+ **Public keys are only available at creation**: The **public key can only be extracted at the time of passkey creation**. When a wallet is first connected, a public key is generated and stored locally. If this public key is lost or deleted, it cannot be recovered, making it impossible to verify ownership of the passkey.
+ **Local-only passkeys are non-recoverable**: If a passkey is stored only on a single device and the device is lost or reset, recovery is impossible since WebAuthn does not allow private key extraction.
+ **Cloud-synced passkeys carry risks**: If a user loses access to their cloud account, they may lose access to their wallet. For critical accounts, setting up multiple authenticators is recommended.
+ **Hardware security keys offer self-custody**: Users preferring full control can use hardware-based passkeys (e.g., YubiKeys) to avoid cloud dependency.

The **Sui Passkey Provider** helps build a **more secure and user-friendly Web3 experience** while ensuring proper key management practices.

# Getting started

## Installation

```bash
npm install @zktx.io/sui-passkey
```

## Usage
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

## SuiPasskey Props

* network: **Testnet**, and **Devnet**.