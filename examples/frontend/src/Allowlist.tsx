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
          return { id: fields?.id.id, allowlist_id: fields?.allowlist_id };
        })
        .filter((item) => item.allowlist_id === id)
        .map((item) => item.id) as string[];

      setCapId(capId[0]);
      setInnerCapId(capId[0]);

      const allowlist = await suiClient.getObject({ id: id!, options: { showContent: true } });
      const fields = (allowlist.data?.content as { fields: any })?.fields || {};
      setAllowlist({ id: id!, name: fields.name, list: fields.list });
      setRecipientAllowlist(id!);
    }

    getAllowlist();
    const intervalId = setInterval(() => getAllowlist(), 3000);
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

      signAndExecute({ transaction: tx }, { onSuccess: async (result) => console.log('res', result) });
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

      signAndExecute({ transaction: tx }, { onSuccess: async (result) => console.log('res', result) });
    }
  };

  return (
    <Flex direction="column" gap="4" justify="start" className="bg-gradient-to-br from-[#7dd3fc] via-[#c084fc] to-[#1e1e2f] p-6 rounded-xl text-white shadow-lg">
      <Card key={`${allowlist?.id}`} className="bg-[#1e1e2f] text-white">
        <h2 className="text-xl font-bold mb-4">
          Admin View: Allowlist {allowlist?.name} (ID{' '}
          {allowlist?.id && getObjectExplorerLink(allowlist.id)})
        </h2>
        <h3 className="mb-4">
          Share{' '}
          <a
            href={`${window.location.origin}/allowlist-example/view/allowlist/${allowlist?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#93c5fd]"
          >
            this link
          </a>{' '}
          with users to access the files associated with this allowlist.
        </h3>

        <Flex direction="row" gap="2" className="mb-4">
          <input placeholder="Add new address" className="bg-[#2e2e3f] text-white p-2 rounded-md" />
          <Button
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              addItem(input.value, id!, capId!);
              input.value = '';
            }}
          >
            Add
          </Button>
        </Flex>

        <h4 className="text-lg font-semibold mb-2">Allowed Users:</h4>
        {Array.isArray(allowlist?.list) && allowlist?.list.length > 0 ? (
          <ul className="space-y-2">
            {allowlist?.list.map((listItem, itemIndex) => (
              <li key={itemIndex}>
                <Flex direction="row" gap="2" align="center">
                  <p>{listItem}</p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(listItem, id!, capId!);
                    }}
                  >
                    <X />
                  </Button>
                </Flex>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400">No user in this allowlist.</p>
        )}
      </Card>
    </Flex>
  );
}
