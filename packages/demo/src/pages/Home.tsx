import {
  ConnectButton,
  useCurrentAccount,
  useCurrentWallet,
  useDisconnectWallet,
  useSignAndExecuteTransaction,
} from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

export const Home = () => {
  const account = useCurrentAccount();

  const { connectionStatus } = useCurrentWallet();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const { mutate: disconnect } = useDisconnectWallet();

  const handleTransaction = async () => {
    if (account) {
      const transaction = new Transaction();
      transaction.setSender(account?.address);
      signAndExecuteTransaction(
        { transaction: await transaction.toJSON() },
        {
          onSuccess: ({ digest }) => {
            console.log('Transaction success', digest);
          },
          onError: (error) => {
            console.error('Transaction error', error);
          },
        },
      );
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return (
    <>
      <div>
        <img src="/logo-sui.svg" className="logo sui" alt="React logo" />
      </div>
      <h1>Passkey Wallet Standard</h1>
      <div className="card">
        {account && connectionStatus === 'connected' ? (
          <>
            <p>{account?.address}</p>
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
