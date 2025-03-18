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
import { useEffect, useState } from 'react';

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

  const TruncatedAddress = ({ address }: { address: string }) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
      const handleResize = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!address) return null;

    const truncatedAddress = isMobile
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : address;

    return (
      <div className="address-wrapper">
        <p className="address-text">{truncatedAddress}</p>
        <button
          className="copy-btn"
          onClick={() => {
            navigator.clipboard.writeText(address);
            enqueueSnackbar('Address copied', { variant: 'success' });
          }}
        >
          Copy Address
        </button>
      </div>
    );
  };

  return (
    <>
      <div>
        <img src="/logo-sui.svg" className="logo" />
      </div>
      <h1>Passkey Wallet Standard</h1>
      <div className="card">
        {account && connectionStatus === 'connected' ? (
          <div>
            <p>{NETWORK.toUpperCase()}</p>
            <TruncatedAddress address={account.address} />
            <div>
              <button onClick={handleBackup}>Backup Data</button>
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
            <div>
              <button onClick={handleRestore}>Restore Data</button>
            </div>
            <ConnectButton />
          </div>
        )}
      </div>
    </>
  );
};
