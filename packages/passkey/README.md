# Sui Passkey Provider for Sui Dapp-Kit

![passkey](https://docs.zktx.io/images/sui-passkey.png)

The **Sui Passkey Provider** enables **Passkey wallets** in Sui Dapp-Kit.

With this **React Provider**, developers can seamlessly integrate **Passkey-based wallets** into their dApps. Because it adheres to the **Wallet Standard**, it provides a consistent experience for both developers and users, maintaining the same UX as traditional wallets.

By leveraging **Passkey**, users can sign transactions without passwords or seed phrases, enhancing security while providing a seamless authentication experience based on **WebAuthn**.

---

## Key Management Considerations

### Passkeys Cannot Be Exported

A passkey created on one device cannot be manually transferred to another device unless cloud synchronization is enabled.

### Public Keys Are Only Available at Creation

The public key is only retrievable during the initial creation of the passkey. This public key is stored locally upon creation. Losing or deleting the stored public key means it cannot be recovered, making verification of passkey ownership impossible.

### Local-Only Passkeys Are Non-Recoverable

If a passkey is stored only on a single device, and that device is lost or reset, recovery is impossible since WebAuthn does not allow extraction of private keys.

### Cloud-Synced Passkeys Carry Risks

Users may lose access to their wallet if their cloud account is compromised. It is advisable to set up multiple authenticators for critical accounts.

### Hardware Security Keys Provide Self-Custody

Users preferring complete control can use hardware-based passkeys (e.g., YubiKeys) to avoid cloud dependency.

---

## React Provider Usage

### Installation

```bash
npm install @zktx/passkey-provider
```

### Basic Example

```tsx
import { SuiPasskey } from '@zktx/passkey-provider';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui.js/client';

function App() {
  const NETWORK = 'testnet';

  return (
    <SuiPasskey network={NETWORK}>
      <SuiClientProvider
        networks={{
          testnet: { url: getFullnodeUrl('testnet') },
          devnet: { url: getFullnodeUrl('devnet') },
        }}
        defaultNetwork={NETWORK}
      >
        <WalletProvider>{/* Your App Components Here */}</WalletProvider>
      </SuiClientProvider>
    </SuiPasskey>
  );
}

export default App;
```

---

## Provider Hooks

### `useSuiPasskey`

```typescript
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { useSuiPasskey } from '@zktx.io/sui-passkey';

export const Home = () => {

  const { mutate: disconnect } = useDisconnectWallet();
  const { read, write, reset } = useSuiPasskey();

  const handleLoad = () => {
    console.log(read());
    /*
      {
          rp: {
            name: 'localhost',
            id: 'localhost',
          },
          user: {
            name: '...',
            displayName: 'Sui Passkey',
          },
          credentialId: '...',
          publicKey: '...',
        }
    */
  }

  const handleWrite = () => {
    write({
    rp: {
      name: 'localhost',
      id: 'localhost',
    },
    user: {
      name: '...',
      displayName: 'Sui Passkey',
    },
    credentialId: '...',
    publicKey: '...',
  })
    disconnect();
  }

  const handleReset = () => {
    reset();
    disconnect();
  }

  const handleDisconnect = () => {
    disconnect();
  }

  return <>
    <div>
      <button onClick={handleLoad}>Read Data</button>
      <button onClick={handleWrite}>Write Data</button>
      <button onClick={handleReset}>Reset Data</button>
      <button onClick={handleDisconnect}>Disconnect</button>
    </div>
  </>
}
```

This hook provides methods to manage Passkey data:

- **`read()`**: Retrieves the stored Passkey data, including the public key and credential details.
- **`write(data)`**: Stores Passkey data locally. Ensure the public key is securely stored; overwriting or deleting this key makes recovery impossible.
- **`reset()`**: Permanently clears all stored Passkey data. Executing this action deletes the data irreversibly.

---

## Important Security Considerations

- Executing **`reset()`** permanently deletes stored Passkey data.
- Always securely store and back up the public key obtained at the initial creation of the passkey to prevent irreversible loss.

The **Sui Passkey Provider** facilitates a secure and user-friendly Web3 experience while ensuring proper key management practices.
