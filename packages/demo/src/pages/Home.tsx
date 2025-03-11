import {
  ConnectButton,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useSuiPasskey } from '@zktx.io/sui-passkey';
import { enqueueSnackbar } from 'notistack';

export const NETWORK = 'devnet';

export const Home = () => {
  const account = useCurrentAccount();

  const { connectionStatus } = useCurrentWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: disconnect } = useDisconnectWallet();
  const { read } = useSuiPasskey();

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
