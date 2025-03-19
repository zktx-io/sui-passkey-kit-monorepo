# Sui Passkey kit for Sui Dapp-Kit

![passkey](https://docs.zktx.io/images/sui-passkey-kit.png)

The **Sui Passkey kit** enables **Passkey wallets** in Sui Dapp-Kit.

With this **React Provider**, developers can seamlessly integrate **Passkey-based wallets** into their dApps. Because it adheres to the **Wallet Standard**, it provides a consistent experience for both developers and users, maintaining the same UX as traditional wallets.

By leveraging **Passkey**, users can sign transactions without passwords or seed phrases, enhancing security while providing a seamless authentication experience based on **WebAuthn**.

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

## Links

[github](https://github.com/zktx-io/sui-passkey-kit-monorepo)

[docs](https://docs.zktx.io/sui-passkey-kit/)

[passkey.walrus.site](https://passkey.walrus.site)
