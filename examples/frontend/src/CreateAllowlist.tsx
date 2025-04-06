import { Transaction } from '@mysten/sui/transactions';
import { Card, Flex } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useNavigate } from 'react-router-dom';

export function CreateAllowlist() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  function createAllowlist(name: string) {
    if (name === '') {
      alert('Please enter a name for the allowlist');
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::create_allowlist_entry`,
      arguments: [tx.pure.string(name)],
    });
    tx.setGasBudget(10000000);

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          const allowlistObject = result.effects?.created?.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const createdObjectId = allowlistObject?.reference?.objectId;
          if (createdObjectId) {
            window.open(
              `${window.location.origin}/allowlist-example/admin/allowlist/${createdObjectId}`,
              '_blank',
            );
          }
        },
      },
    );
  }

  const handleViewAll = () => {
    navigate(`/allowlist-example/admin/allowlists`);
  };

  return (
    <div style={{ padding: '2rem', background: '#fff', minHeight: '100vh' }}>
      <Card
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e0f7fa',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <h2
          style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, #4fc3f7, #ba68c8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: 'Segoe UI, sans-serif',
          }}
        >
          Create a New Allowlist
        </h2>

        <Flex direction="row" gap="3" align="center">
          <input
            placeholder="Allowlist Name"
            onChange={(e) => setName(e.target.value)}
            style={{
              padding: '0.7rem 1rem',
              borderRadius: '12px',
              border: '1px solid #cfd8dc',
              backgroundColor: '#f9f9f9',
              width: '250px',
              fontSize: '1rem',
              fontFamily: 'Segoe UI, sans-serif',
              color: '#333',
            }}
          />

          <button
            onClick={() => createAllowlist(name)}
            style={{
              background: 'linear-gradient(to right, #4fc3f7, #ba68c8)',
              color: '#fff',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Create
          </button>

          <button
            onClick={handleViewAll}
            style={{
              background: 'linear-gradient(to right, #00c6ff, #0072ff)',
              color: '#fff',
              border: 'none',
              padding: '0.7rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            View All
          </button>
        </Flex>
      </Card>
    </div>
  );
}
