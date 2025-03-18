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
import { FiCopy } from 'react-icons/fi';
import { MdDownload } from 'react-icons/md';

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
  const { read, write } = useSuiPasskey();
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

  const handleBackup = () => {
    try {
      const backupData = read();

      if (!backupData) {
        enqueueSnackbar('No data available to backup', { variant: 'warning' });
        return;
      }

      const jsonData = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `sui-wallet-backup-${new Date().toISOString().split('T')[0]}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      enqueueSnackbar('Backup file downloaded successfully', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Backup failed:', error);
      enqueueSnackbar(`Backup failed: ${error}`, { variant: 'error' });
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleRestore = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) {
        return;
      }

      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const contents = e.target?.result as string;
          const jsonData = JSON.parse(contents);

          if (!jsonData) {
            enqueueSnackbar('Invalid backup file format', { variant: 'error' });
            return;
          }

          write(jsonData);

          enqueueSnackbar('Wallet data restored successfully', {
            variant: 'success',
          });
        } catch (error) {
          console.error('Restore failed:', error);
          enqueueSnackbar(`Failed to restore: ${error}`, { variant: 'error' });
        }
      };

      reader.onerror = () => {
        enqueueSnackbar('Error reading file', { variant: 'error' });
      };

      reader.readAsText(file);
    };

    fileInput.click();
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div>
        <img src={'/logo-sui.svg'} className="w-32 h-32 mb-4" alt="logo" />
      </div>
      <h1 className="text-3xl font-bold">Passkey Wallet Standard</h1>
      <div className="max-w-md p-4 rounded-lg shadow-md mt-4">
        {account && connectionStatus === 'connected' ? (
          <div>
            <p>{NETWORK.toUpperCase()}</p>
            <div className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
              <p className="text-gray-700 font-mono text-sm mr-4">
                {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
              </p>
              <button
                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  navigator.clipboard.writeText(account.address);
                  enqueueSnackbar('Address copied', { variant: 'success' });
                }}
              >
                <FiCopy className="w-5 h-5 text-gray-600" />
              </button>
              <button
                className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleBackup}
              >
                <MdDownload className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleTransaction}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Tx
              </button>
              <button
                onClick={handleScan}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Scan
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            <button
              className="w-full bg-blue-500 text-white py-2 px-2 rounded-lg cursor-pointer"
              onClick={handleRestore}
            >
              Restore Data
            </button>
            <ConnectButton />
          </div>
        )}
      </div>
    </div>
  );
};
