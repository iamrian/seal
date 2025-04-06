// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { Card, Flex, Text } from '@radix-ui/themes';
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
    <Flex direction="column" gap="4" justify="start" style={{ padding: '2rem' }}>
      <Card
        key={`${service?.id}`}
        style={{
          borderRadius: '16px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e0e0e0',
          padding: '2rem',
        }}
      >
        <Text as="div" size="5" weight="bold" style={{ marginBottom: '1.5rem', color: '#333' }}>
          Admin View: Service{' '}
          <span style={{ color: '#5b5fef' }}>{service?.name}</span> (
          <a
            href={getObjectExplorerLink(service?.id || '')}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', color: '#7e3ff2' }}
          >
            View on Explorer
          </a>
          )
        </Text>

        <Text as="p" size="3" style={{ marginBottom: '1.5rem', color: '#666' }}>
          Share{' '}
          <a
            href={`${window.location.origin}/subscription-example/view/service/${service?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'underline', color: '#7e3ff2' }}
          >
            this link
          </a>{' '}
          with other users to subscribe to this service and access its files.
        </Text>

        <Flex direction="column" gap="2" justify="start">
          <Text size="3" style={{ color: '#444' }}>
            <strong>Subscription duration:</strong>{' '}
            {service?.ttl ? service?.ttl / 60 / 1000 : 'null'} minutes
          </Text>
          <Text size="3" style={{ color: '#444' }}>
            <strong>Subscription fee:</strong> {service?.fee} MIST
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}

export default Service;
