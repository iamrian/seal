// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useNavigate } from 'react-router-dom';

export function CreateService() {
  const [price, setPrice] = useState('');
  const [ttl, setTtl] = useState('');
  const [name, setName] = useState('');
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const navigate = useNavigate();
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

  function createService(price: number, ttl: number, name: string) {
    if (price === 0 || ttl === 0 || name === '') {
      alert('Please fill in all fields');
      return;
    }
    const ttlMs = ttl * 60 * 1000;
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::subscription::create_service_entry`,
      arguments: [tx.pure.u64(price), tx.pure.u64(ttlMs), tx.pure.string(name)],
    });
    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          const subscriptionObject = result.effects?.created?.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const createdObjectId = subscriptionObject?.reference?.objectId;
          if (createdObjectId) {
            window.open(
              `${window.location.origin}/subscription-example/admin/service/${createdObjectId}`,
              '_blank',
            );
          }
        },
      },
    );
  }

  const handleViewAll = () => {
    navigate(`/subscription-example/admin/services`);
  };

  return (
    <Card
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#111' }}>
        Admin View: Subscription
      </h2>
      <Flex direction="column" gap="4">
        <label
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            background: 'linear-gradient(to right, #3b82f6, #9333ea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
          }}
        >
          Price in MIST
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Enter price in MIST"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid #cbd5e0',
            backgroundColor: '#f9fafb',
            fontSize: '1rem',
          }}
        />

        <label
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            background: 'linear-gradient(to right, #3b82f6, #9333ea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
          }}
        >
          Subscription duration (minutes)
        </label>
        <input
          type="number"
          value={ttl}
          onChange={(e) => setTtl(e.target.value)}
          placeholder="Enter duration"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid #cbd5e0',
            backgroundColor: '#f9fafb',
            fontSize: '1rem',
          }}
        />

        <label
          style={{
            fontWeight: 600,
            fontSize: '1rem',
            background: 'linear-gradient(to right, #3b82f6, #9333ea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.25rem',
          }}
        >
          Name of the service
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter service name"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            border: '1px solid #cbd5e0',
            backgroundColor: '#f9fafb',
            fontSize: '1rem',
          }}
        />

        <Flex direction="row" gap="3" justify="start" style={{ marginTop: '1rem' }}>
          <Button
            onClick={() => createService(parseInt(price), parseInt(ttl), name)}
            style={{
              background: 'linear-gradient(to right, #00bfff, #6a5acd)',
              color: 'white',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
            }}
          >
            Create Service
          </Button>
          <Button
            onClick={handleViewAll}
            style={{
              background: '#e0e7ff',
              color: '#4f46e5',
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              fontWeight: 'bold',
            }}
          >
            View All Services
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
