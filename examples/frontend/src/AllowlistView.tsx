// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import {
  AlertDialog,
  Button,
  Card,
  Dialog,
  Flex,
  Heading,
  Text,
} from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import {
  downloadAndDecrypt,
  getObjectExplorerLink,
  MoveCallConstructor,
} from './utils';

const TTL_MIN = 10;

export interface FeedData {
  allowlistId: string;
  allowlistName: string;
  blobIds: string[];
}

function constructMoveCall(packageId: string, allowlistId: string): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::allowlist::seal_approve`,
      arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId)],
    });
  };
}

const AllowlistView: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
  const suiClient = useSuiClient();
  const client = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers('testnet'),
    verifyKeyServers: false,
  });
  const packageId = useNetworkVariable('packageId');

  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionKey, setCurrentSessionKey] = useState<SessionKey | null>(null);
  const { id } = useParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  useEffect(() => {
    getFeed();
    const intervalId = setInterval(() => getFeed(), 3000);
    return () => clearInterval(intervalId);
  }, [id, suiClient, packageId]);

  async function getFeed() {
    const allowlist = await suiClient.getObject({
      id: id!,
      options: { showContent: true },
    });
    const encryptedObjects = await suiClient
      .getDynamicFields({ parentId: id! })
      .then((res) => res.data.map((obj) => obj.name.value as string));
    const fields = (allowlist.data?.content as { fields: any })?.fields || {};
    setFeed({
      allowlistId: id!,
      allowlistName: fields?.name,
      blobIds: encryptedObjects,
    });
  }

  const onView = async (blobIds: string[], allowlistId: string) => {
    if (
      currentSessionKey &&
      !currentSessionKey.isExpired() &&
      currentSessionKey.getAddress() === suiAddress
    ) {
      const moveCallConstructor = constructMoveCall(packageId, allowlistId);
      downloadAndDecrypt(
        blobIds,
        currentSessionKey,
        suiClient,
        client,
        moveCallConstructor,
        setError,
        setDecryptedFileUrls,
        setIsDialogOpen,
        setReloadKey,
      );
      return;
    }

    setCurrentSessionKey(null);

    const sessionKey = new SessionKey({
      address: suiAddress,
      packageId,
      ttlMin: TTL_MIN,
    });

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            const moveCallConstructor = await constructMoveCall(packageId, allowlistId);
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              suiClient,
              client,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setIsDialogOpen,
              setReloadKey,
            );
            setCurrentSessionKey(sessionKey);
          },
        },
      );
    } catch (error: any) {
      console.error('Error:', error);
    }
  };

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
        🔐 Files for Allowlist{' '}
        <span style={{ color: '#5E60CE' }}>{feed?.allowlistName}</span>
      </Heading>
      <Text size="2" mb="4" color="gray">
        ID:{' '}
        {feed?.allowlistId ? (
          <a
            href={`${getObjectExplorerLink(feed.allowlistId)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4CC9F0', textDecoration: 'underline' }}
          >
            {feed.allowlistId}
          </a>
        ) : (
          'N/A'
        )}
      </Text>

      {feed?.blobIds.length === 0 ? (
        <Text color="gray">No files found for this allowlist.</Text>
      ) : (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger>
            <Button
              size="3"
              style={{
                background: 'linear-gradient(135deg, #4CC9F0, #4361EE)',
                color: 'white',
                fontWeight: 'bold',
              }}
              onClick={() => onView(feed!.blobIds, feed!.allowlistId)}
            >
              Download & Decrypt All Files
            </Button>
          </Dialog.Trigger>
          {decryptedFileUrls.length > 0 && (
            <Dialog.Content maxWidth="600px" key={reloadKey}>
              <Dialog.Title>🖼️ Decrypted Files</Dialog.Title>
              <Flex direction="column" gap="3" mt="3">
                {decryptedFileUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Decrypted ${i}`}
                    style={{
                      width: '100%',
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  />
                ))}
              </Flex>
              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button
                    variant="soft"
                    color="gray"
                    onClick={() => setDecryptedFileUrls([])}
                  >
                    Close
                  </Button>
                </Dialog.Close>
              </Flex>
            </Dialog.Content>
          )}
        </Dialog.Root>
      )}

      <AlertDialog.Root open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Error</AlertDialog.Title>
          <AlertDialog.Description size="2">{error}</AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button variant="solid" color="gray" onClick={() => setError(null)}>
                Close
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
};

export default AllowlistView;
