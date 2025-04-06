// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Card, Flex } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNetworkVariable } from './networkConfig';
import { getObjectExplorerLink } from './utils';

export interface Service {
  id: string;
  fee: number;
  ttl: number;
  owner: string;
  name: string;
}

interface AllowlistProps {
  setRecipientAllowlist: React.Dispatch<React.SetStateAction<string>>;
  setCapId: React.Dispatch<React.SetStateAction<string>>;
}

export function Service({ setRecipientAllowlist, setCapId }: AllowlistProps) {
  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const [service, setService] = useState<Service>();
  const { id } = useParams();

  useEffect(() => {
    async function getService() {
      const service = await suiClient.getObject({
        id: id!,
        options: { showContent: true },
      });
      const fields = (service.data?.content as { fields: any })?.fields || {};
      setService({
        id: id!,
        fee: fields.fee,
        ttl: fields.ttl,
        owner: fields.owner,
        name: fields.name,
      });
      setRecipientAllowlist(id!);

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

      const capId = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return {
            id: fields?.id.id,
            service_id: fields?.service_id,
          };
        })
        .filter((item) => item.service_id === id)
        .map((item) => item.id) as string[];
      setCapId(capId[0]);
    }

    getService();
    const intervalId = setInterval(() => getService(), 3000);
    return () => clearInterval(intervalId);
  }, [id]);

  return (
    <Flex
      direction="column"
      gap="4"
      justify="start"
      align="center"
      style={{
        padding: '2rem',
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        fontFamily: 'Inter, sans-serif',
        color: '#1e1e1e',
      }}
    >
      <Card
        key={`${service?.id}`}
        style={{
          width: '100%',
          maxWidth: '700px',
          borderRadius: '20px',
          background: '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          padding: '2rem',
          border: '1px solid #e0e0e0',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#3b82f6',
            marginBottom: '1rem',
          }}
        >
          Admin View: {service?.name}{' '}
          <span style={{ fontWeight: 400, fontSize: '0.9rem' }}>
            (ID {service?.id && getObjectExplorerLink(service.id)})
          </span>
        </h2>

        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 500,
            color: '#6b7280',
            marginBottom: '1.5rem',
          }}
        >
          Share{' '}
          <a
            href={`${window.location.origin}/subscription-example/view/service/${service?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'underline',
              color: '#7c3aed',
              fontWeight: 600,
            }}
          >
            this link
          </a>{' '}
          with other users to subscribe to this service and access its files.
        </h3>

        <Flex direction="column" gap="2">
          <p style={{ fontSize: '1rem' }}>
            <strong style={{ color: '#4f46e5' }}>Subscription duration:</strong>{' '}
            {service?.ttl ? service?.ttl / 60 / 1000 : 'null'} minutes
          </p>
          <p style={{ fontSize: '1rem' }}>
            <strong style={{ color: '#4f46e5' }}>Subscription fee:</strong> {service?.fee} MIST
          </p>
        </Flex>
      </Card>
    </Flex>
  );
}
