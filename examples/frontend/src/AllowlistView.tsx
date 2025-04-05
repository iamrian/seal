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
  Grid,
  Text,
  Heading,
} from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, MoveCallConstructor } from './utils';

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

const Feeds: React.FC<{ suiAddress: string }> = ({ suiAddress }) => {
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
            const moveCallConstructor = constructMoveCall(packageId, allowlistId);
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
        background: 'linear-gradient(to bottom right, #1d1f3f, #3b1f5e)',
        color: '#f0f4ff',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 0 15px #7f5af0',
      }}
    >
      <Heading size="6" style={{ marginBottom: '1rem', color: '#7fdbff' }}>
        Files for: <span style={{ color: '#ffffff' }}>{feed?.allowlistName}</span>
      </Heading>
      <Flex direction="column" gap="1" style={{ marginBottom: '1rem' }}>
  <Text size="2">ID:</Text>
  <Text size="2" as="a"
    href={getObjectExplorerLink(feed?.allowlistId || '')}
    target="_blank"
    rel="noreferrer"
    style={{ color: '#a78bfa', textDecoration: 'underline' }}
  >
    {feed?.allowlistId}
  </Text>
</Flex>



      {feed?.blobIds.length === 0 ? (
        <Text>No files found for this allowlist.</Text>
      ) : (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Dialog.Trigger>
            <Button
              size="3"
              style={{
                backgroundColor: '#7f5af0',
                color: '#ffffff',
                borderRadius: '0.5rem',
              }}
              onClick={() => onView(feed!.blobIds, feed!.allowlistId)}
            >
              🚀 Decrypt & View All Files
            </Button>
          </Dialog.Trigger>

          {decryptedFileUrls.length > 0 && (
            <Dialog.Content
              maxWidth="600px"
              style={{ backgroundColor: '#1e1e2f', color: '#fff' }}
              key={reloadKey}
            >
              <Dialog.Title style={{ color: '#7fdbff' }}>
                🖼️ Decrypted Files
              </Dialog.Title>
              <Flex direction="column" gap="3" mt="3">
                {decryptedFileUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Decrypted File ${i + 1}`}
                    style={{ borderRadius: '0.5rem', maxWidth: '100%' }}
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

export default Feeds;
