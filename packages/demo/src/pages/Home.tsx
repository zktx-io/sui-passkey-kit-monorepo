import {
  ConnectButton,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSignTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSuiPasskey } from '@zktx.io/sui-passkey-kit';
import { enqueueSnackbar } from 'notistack';
import { Ed25519PublicKey } from '@mysten/sui/keypairs/ed25519';
import { Secp256k1PublicKey } from '@mysten/sui/keypairs/secp256k1';
import { Secp256r1PublicKey } from '@mysten/sui/keypairs/secp256r1';
import { ZkLoginPublicIdentifier } from '@mysten/sui/zklogin';
import { MultiSigPublicKey } from '@mysten/sui/multisig';
import { PasskeyPublicKey } from '@mysten/sui/keypairs/passkey';

import { NETWORK } from '../config';
import { IntentScope } from '@mysten/sui/cryptography';
import { useWalrusWallet } from '@zktx.io/walrus-wallet';

export const Home = () => {
  const account = useCurrentAccount();

  const { connectionStatus } = useCurrentWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { mutate: signTransaction } = useSignTransaction();
  const { mutate: disconnect } = useDisconnectWallet();
  const { read } = useSuiPasskey();
  const { scan } = useWalrusWallet();

  const handleTransaction = async () => {
    if (account) {
      const transaction = new Transaction();
      transaction.setSender(account?.address);
      signAndExecuteTransaction(
        { transaction: await transaction.toJSON() },
        {
          onSuccess: ({ digest }) => {
            enqueueSnackbar(digest, {
              variant: 'success',
              style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            });
          },
          onError: (error) => {
            enqueueSnackbar(`${error}`, {
              variant: 'error',
              style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              },
            });
          },
        },
      );
    }
  };

  const handleScan = async () => {
    if (account) {
      await scan({
        toSuiAddress: () => account.address,
        getPublicKey: () => {
          switch (account.publicKey[0]) {
            case 0x00:
              return new Ed25519PublicKey(account.publicKey.slice(1));
            case 0x01:
              return new Secp256k1PublicKey(account.publicKey.slice(1));
            case 0x02:
              return new Secp256r1PublicKey(account.publicKey.slice(1));
            case 0x03:
              return new MultiSigPublicKey(account.publicKey.slice(1));
            case 0x05:
              return new ZkLoginPublicIdentifier(account.publicKey);
            case 0x06:
              return new PasskeyPublicKey(account.publicKey.slice(1));
            default:
              break;
          }
          throw new Error('Not implemented (getPublicKey)');
        },
        getKeyScheme: () => {
          throw new Error('Not implemented (getKeyScheme)');
        },
        signPersonalMessage: async (bytes: Uint8Array) => {
          return new Promise((resolve, reject) => {
            signPersonalMessage(
              {
                message: bytes,
              },
              {
                onSuccess: (result) => {
                  resolve(result);
                },
                onError: (error) => {
                  reject(error);
                },
              },
            );
          });
        },
        signTransaction: async (bytes: Uint8Array) => {
          const transaction = await Transaction.from(bytes).toJSON();
          return new Promise((resolve, reject) => {
            signTransaction(
              {
                transaction,
              },
              {
                onSuccess: (result) => {
                  resolve(result);
                },
                onError: (error) => {
                  reject(error);
                },
              },
            );
          });
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        signWithIntent: (_bytes: Uint8Array, _intent: IntentScope) => {
          throw new Error('Not implemented (signWithIntent)');
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        sign: async (_bytes: Uint8Array) => {
          throw new Error('Not implemented (sign)');
        },
      });
    }
  };

  const handleLoad = () => {
    console.log(read());
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <>
      <div>
        <img src="/logo-sui.svg" className="logo" />
      </div>
      <h1>Passkey Wallet Standard</h1>
      <div className="card">
        {account && connectionStatus === 'connected' ? (
          <>
            <p>{NETWORK.toUpperCase()}</p>
            <p>{account?.address}</p>
            <div>
              <button onClick={handleLoad}>Read Data</button>
            </div>
            <div>
              <button onClick={handleTransaction}>Transaction</button>
            </div>
            <div>
              <button onClick={handleScan}>Scan</button>
            </div>
            <div>
              <button onClick={handleDisconnect}>Disconnect</button>
            </div>
          </>
        ) : (
          <ConnectButton />
        )}
      </div>
    </>
  );
};
