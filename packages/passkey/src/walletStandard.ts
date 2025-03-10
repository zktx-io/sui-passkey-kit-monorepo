import {
  ReadonlyWalletAccount,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsOnMethod,
  SUI_CHAINS,
  SuiFeatures,
  SuiSignAndExecuteTransactionMethod,
  SuiSignPersonalMessageMethod,
  SuiSignTransactionMethod,
  Wallet,
} from '@mysten/wallet-standard';
import mitt, { Emitter } from 'mitt';

type WalletEventsMap = {
  [E in keyof StandardEventsListeners]: Parameters<
    StandardEventsListeners[E]
  >[0];
};

export class WalletStandard implements Wallet {
  readonly #events: Emitter<WalletEventsMap>;
  #accounts: ReadonlyWalletAccount[] = [];
  #network: 'mainnet' | 'testnet' | 'devnet';

  get name() {
    return 'Sui Passkey' as const;
  }

  get icon() {
    return 'data:image/png;base64,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' as const;
  }

  get version() {
    return '1.0.0' as const;
  }

  get chains() {
    return SUI_CHAINS;
  }

  get accounts() {
    return this.#accounts;
  }

  constructor({ network }: { network: 'mainnet' | 'testnet' | 'devnet' }) {
    this.#accounts = [];
    this.#events = mitt();
    this.#network = network;
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SuiFeatures {
    return {
      'standard:connect': {
        version: '1.0.0',
        connect: this.#connect,
      },
      'standard:events': {
        version: '1.0.0',
        on: this.#on,
      },
      'standard:disconnect': {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      'sui:signTransaction': {
        version: '2.0.0',
        signTransaction: this.#signTransaction,
      },
      'sui:signAndExecuteTransaction': {
        version: '2.0.0',
        signAndExecuteTransaction: this.#signAndExecuteTransaction,
      },
      'sui:signPersonalMessage': {
        version: '1.0.0',
        signPersonalMessage: this.#signPersonalMessage,
      },
    };
  }

  #connect: StandardConnectMethod = async (input) => {
    throw new Error('not implemented');
  };

  #disconnect: StandardDisconnectMethod = async () => {
    this.#accounts = [];
    this.#events.emit('change', { accounts: undefined });
  };

  #on: StandardEventsOnMethod = (event, listener) => {
    this.#events.on(event, listener);
    return () => this.#events.off(event, listener);
  };

  #signTransaction: SuiSignTransactionMethod = async ({
    transaction,
    chain,
  }) => {
    throw new Error('not implemented');
  };

  #signAndExecuteTransaction: SuiSignAndExecuteTransactionMethod = async ({
    transaction,
    chain,
  }) => {
    throw new Error('not implemented');
  };

  #signPersonalMessage: SuiSignPersonalMessageMethod = async ({ message }) => {
    throw new Error('not implemented');
  };
}
