// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, TextField, Text } from '@radix-ui/themes';
import { useNetworkVariable } from './networkConfig';
import './styles/crypto-style.css'; // Tambahkan file CSS custom untuk style NFT vibes

export function CreateAllowlist() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
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

  const createAllowlist = () => {
    if (name.trim() === '') {
      setErrorMsg('Allowlist name cannot be empty');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const tx = new Transaction();
    tx.moveCall({
      arguments: [tx.pure.string(name.trim())],
      target: `${packageId}::allowlist::create`,
    });
    tx.setGasBudget(10000000);

    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Allowlist created:', result);
          setSuccessMsg('Allowlist successfully created!');
          setName('');
          setIsLoading(false);
        },
        onError: (err) => {
          console.error(err);
          setErrorMsg('Something went wrong creating the allowlist.');
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <Card className="custom-card dark-mode-card" style={{ padding: '2rem' }}>
      <Text size="5" weight="bold" className="gradient-title">
        Create New Allowlist
      </Text>

      <Flex direction="column" gap="3" mt="3">
        <TextField.Root
          placeholder="Enter allowlist name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          className="text-field-custom"
        />
        <Button
          onClick={createAllowlist}
          disabled={isLoading}
          className="glow-button"
          style={{ width: 'fit-content' }}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>

        {successMsg && <Text color="green">{successMsg}</Text>}
        {errorMsg && <Text color="red">{errorMsg}</Text>}
      </Flex>
    </Card>
  );
}
