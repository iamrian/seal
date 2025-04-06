// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useNetworkVariable } from './networkConfig';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { getObjectExplorerLink } from './utils';

export interface Allowlist {
  id: string;
  name: string;
  list: string[];
}

interface AllowlistProps {
  setRecipientAllowlist: React.Dispatch<React.SetStateAction<string>>;
  setCapId: React.Dispatch<React.SetStateAction<string>>;
}

export function Allowlist({ setRecipientAllowlist, setCapId }: AllowlistProps) {
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const [allowlist, setAllowlist] = useState<Allowlist>();
  const { id } = useParams();
  const [capId, setInnerCapId] = useState<string>();

  useEffect(() => {
    async function getAllowlist() {
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address!,
        options: { showContent: true, showType: true },
        filter: { StructType: `${packageId}::allowlist::Cap` },
      });

      const capId = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return {
            id: fields?.id.id,
            allowlist_id: fields?.allowlist_id,
          };
        })
        .filter((item) => item.allowlist_id === id)
        .map((item) => item.id) as string[];

      setCapId(capId[0]);
      setInnerCapId(capId[0]);

      const allowlist = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });

      const fields = (allowlist.data?.content as { fields: any })?.fields || {};
      setAllowlist({
        id: id!,
        name: fields.name,
        list: fields.list,
      });
      setRecipientAllowlist(id!);
    }

    getAllowlist();
    const intervalId = setInterval(getAllowlist, 3000);
    return () => clearInterval(intervalId);
  }, [id, currentAccount?.address]);

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showRawEffects: true, showEffects: true },
      }),
  });

  const addItem = (newAddressToAdd: string, wl_id: string, cap_id: string) => {
    if (newAddressToAdd.trim() !== '') {
      if (!isValidSuiAddress(newAddressToAdd.trim())) {
        alert('Invalid address');
        return;
      }
      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.address(newAddressToAdd.trim())],
        target: `${packageId}::allowlist::add`,
      });
      tx.setGasBudget(10000000);
      signAndExecute({ transaction: tx });
    }
  };

  const removeItem = (addressToRemove: string, wl_id: string, cap_id: string) => {
    if (addressToRemove.trim() !== '') {
      const tx = new Transaction();
      tx.moveCall({
        arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.address(addressToRemove.trim())],
        target: `${packageId}::allowlist::remove`,
      });
      tx.setGasBudget(10000000);
      signAndExecute({ transaction: tx });
    }
  };

  return (
    <Flex direction="column" gap="4" style={{ padding: '1rem' }}>
      <Card
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '2rem',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e0eafc',
        }}
      >
        <h2
          style={{
            marginBottom: '1rem',
            fontSize: '1.8rem',
            fontWeight: 'bold',
            background: 'linear-gradient(to right, #6a11cb, #2575fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Admin View: {allowlist?.name}
        </h2>

        <h3 style={{ marginBottom: '1rem', color: '#444' }}>
          Share&nbsp;
          <a
            href={`${window.location.origin}/allowlist-example/view/allowlist/${allowlist?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2575fc', textDecoration: 'underline' }}
          >
            this link
          </a>{' '}
          with users.
        </h3>

        <Flex direction="row" gap="2" align="center" style={{ marginBottom: '1.5rem' }}>
          <input
            placeholder="Add new address"
            style={{
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              width: '300px',
            }}
          />
          <button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              addItem(input.value, id!, capId!);
              input.value = '';
            }}
            style={{
              background: 'linear-gradient(to right, #6a11cb, #2575fc)',
              color: '#fff',
              border: 'none',
              padding: '0.7rem 1.3rem',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Add
          </button>
        </Flex>

        <h4 style={{ marginBottom: '0.5rem' }}>Allowed Users:</h4>
        {Array.isArray(allowlist?.list) && allowlist?.list.length > 0 ? (
          <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
            {allowlist?.list.map((listItem, itemIndex) => (
              <li key={itemIndex} style={{ marginBottom: '0.8rem' }}>
                <Flex
                  direction="row"
                  align="center"
                  justify="between"
                  style={{
                    background: '#f1f5f9',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                  }}
                >
                  <p style={{ wordBreak: 'break-all', color: '#333' }}>{listItem}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(listItem, id!, capId!);
                    }}
                    style={{
                      backgroundColor: '#ff6b6b',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.4rem 0.6rem',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </Flex>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#999' }}>No user in this allowlist.</p>
        )}
      </Card>
    </Flex>
  );
}
