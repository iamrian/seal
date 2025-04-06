// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';

export interface Cap {
  id: string;
  service_id: string;
}

export interface CardItem {
  id: string;
  fee: string;
  ttl: string;
  name: string;
  owner: string;
}

export function AllServices() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  useEffect(() => {
    async function getCapObj() {
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address!,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Cap`,
        },
      });

      const caps = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return {
            id: fields?.id.id,
            service_id: fields?.service_id,
          };
        })
        .filter((item) => item !== null) as Cap[];

      const cardItems: CardItem[] = await Promise.all(
        caps.map(async (cap) => {
          const service = await suiClient.getObject({
            id: cap.service_id,
            options: { showContent: true },
          });
          const fields = (service.data?.content as { fields: any })?.fields || {};
          return {
            id: cap.service_id,
            fee: fields.fee,
            ttl: fields.ttl,
            owner: fields.owner,
            name: fields.name,
          };
        }),
      );
      setCardItems(cardItems);
    }

    getCapObj();
    const intervalId = setInterval(() => {
      getCapObj();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [currentAccount?.address]);

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '2rem',
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
      }}
    >
      <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '1rem', color: '#111' }}>
        Admin View: Owned Subscription Services
      </h2>
      <p style={{ marginBottom: '2rem', color: '#555', fontSize: '1rem' }}>
        This is all the services that you have created. Click "Manage" to upload new files to the
        service.
      </p>

      <Flex direction="column" gap="4">
        {cardItems.map((item) => (
          <Card
            key={item.id}
            style={{
              background: '#f9fafb',
              borderRadius: '16px',
              padding: '1.5rem',
              border: '1px solid #e0e7ff',
            }}
          >
            <p style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              {item.name}{' '}
              <a
                href={getObjectExplorerLink(item.id)}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '0.9rem',
                  color: '#6a5acd',
                  textDecoration: 'underline',
                }}
              >
                (View on Explorer)
              </a>
            </p>
            <p style={{ marginBottom: '0.3rem', color: '#333' }}>
              <strong>Subscription Fee:</strong> {item.fee} MIST
            </p>
            <p style={{ marginBottom: '1rem', color: '#333' }}>
              <strong>Subscription Duration:</strong>{' '}
              {item.ttl ? parseInt(item.ttl) / 60 / 1000 : 'null'} minutes
            </p>
            <Button
              onClick={() =>
                window.open(
                  `${window.location.origin}/subscription-example/admin/service/${item.id}`,
                  '_blank',
                )
              }
              style={{
                background: 'linear-gradient(to right, #00bfff, #6a5acd)',
                color: 'white',
                borderRadius: '10px',
                padding: '0.5rem 1.25rem',
                fontWeight: 'bold',
              }}
            >
              Manage
            </Button>
          </Card>
        ))}
      </Flex>
    </div>
  );
}
