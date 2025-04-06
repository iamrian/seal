// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex, Text, Heading } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';

export interface Cap {
  id: string;
  allowlist_id: string;
}

export interface CardItem {
  cap_id: string;
  allowlist_id: string;
  list: string[];
  name: string;
}

export function AllAllowlist() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  const getCapObj = useCallback(async () => {
    if (!currentAccount?.address) return;

    const res = await suiClient.getOwnedObjects({
      owner: currentAccount?.address,
      options: {
        showContent: true,
        showType: true,
      },
      filter: {
        StructType: `${packageId}::allowlist::Cap`,
      },
    });
    const caps = res.data
      .map((obj) => {
        const fields = (obj!.data!.content as { fields: any }).fields;
        return {
          id: fields?.id.id,
          allowlist_id: fields?.allowlist_id,
        };
      })
      .filter((item) => item !== null) as Cap[];

    const cardItems: CardItem[] = await Promise.all(
      caps.map(async (cap) => {
        const allowlist = await suiClient.getObject({
          id: cap.allowlist_id,
          options: { showContent: true },
        });
        const fields = (allowlist.data?.content as { fields: any })?.fields || {};
        return {
          cap_id: cap.id,
          allowlist_id: cap.allowlist_id,
          list: fields.list,
          name: fields.name,
        };
      }),
    );

    setCardItems(cardItems);
  }, [currentAccount?.address]);

  useEffect(() => {
    getCapObj();
  }, [getCapObj]);

  return (
    <Card
      style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 0 15px rgba(0, 0, 0, 0.07)',
        padding: '2rem',
      }}
    >
      <Heading size="6" mb="3" style={{ color: '#2D2F87' }}>
        🧾 Owned Allowlists
      </Heading>
      <Text size="2" mb="4" color="gray">
        Below are the allowlists you’ve created. Click <strong>Manage</strong> to edit and upload new files.
      </Text>

      <Flex direction="column" gap="4">
        {cardItems.map((item) => (
          <Card
            key={`${item.cap_id}-${item.allowlist_id}`}
            style={{
              background: 'linear-gradient(135deg, #f5f5ff, #ffffff)',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Flex direction="column" gap="2">
              <Text size="3" weight="bold" style={{ color: '#4361EE' }}>
                {item.name}
              </Text>
              <Text size="2" color="gray">
                ID:{' '}
                <a
                  href={getObjectExplorerLink(item.allowlist_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#4CC9F0', textDecoration: 'underline' }}
                >
                  {item.allowlist_id}
                </a>
              </Text>
              <Button
                size="2"
                style={{
                  marginTop: '0.75rem',
                  background: 'linear-gradient(135deg, #4CC9F0, #4361EE)',
                  color: 'white',
                  fontWeight: 'bold',
                  borderRadius: '10px',
                }}
                onClick={() => {
                  window.open(
                    `${window.location.origin}/allowlist-example/admin/allowlist/${item.allowlist_id}`,
                    '_blank',
                  );
                }}
              >
                Manage
              </Button>
            </Flex>
          </Card>
        ))}
      </Flex>
    </Card>
  );
}
