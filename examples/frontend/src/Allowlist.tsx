import { useEffect, useState } from 'react';
import { useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { AlertDialog, Button, Card, Dialog, Flex, Text } from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { getAllowlistedKeyServers, SealClient, SessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, MoveCallConstructor } from './utils';
import './global.css'; // Pastikan ini ada

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

export const Allowlist = ({ suiAddress }: { suiAddress: string }) => {
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
			allowlistName: fields?.name || 'Unnamed Chain',
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
	};

	return (
		<Card
			style={{
				background: 'linear-gradient(135deg, #001f3f, #00ff9d)', // Gradient crypto
				color: '#ffffff',
				padding: '2rem',
				borderRadius: '1rem',
				boxShadow: '0 0 25px rgba(0, 255, 157, 0.5)', // Glow neon
				border: '1px solid #00d4ff', // Biru digital
				fontFamily: 'Orbitron, sans-serif',
			}}
		>
			<Flex direction="column" gap="1" style={{ marginBottom: '1rem' }}>
				<Text size="2" style={{ color: '#00ff9d' }}>Blockchain ID:</Text>
				<a
					href={getObjectExplorerLink(feed?.allowlistId || '')}
					target="_blank"
					rel="noreferrer"
					style={{
						color: '#00d4ff',
						textDecoration: 'underline',
						fontFamily: 'monospace',
						fontSize: '14px',
					}}
				>
					{feed?.allowlistId || 'N/A'}
				</a>
			</Flex>
			<Text style={{ color: '#8b00ff' }}>
				Chain Name: <span style={{ color: '#00d4ff' }}>{feed?.allowlistName || 'Loading...'}</span>
			</Text>

			{feed?.blobIds.length === 0 ? (
				<Text style={{ color: '#8b00ff', marginTop: '1rem' }}>
					No encrypted files on this blockchain.
				</Text>
			) : (
				<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<Dialog.Trigger>
						<Button
							onClick={() => feed && onView(feed.blobIds, feed.allowlistId)}
							style={{
								background: 'linear-gradient(to right, #00ff9d, #8b00ff)',
								color: '#001f3f',
								fontWeight: 'bold',
								borderRadius: '0.75rem',
								boxShadow: '0 4px 15px rgba(0, 255, 157, 0.6)',
								transition: 'all 0.3s ease-in-out',
								animation: 'pulse 2s infinite',
								marginTop: '1rem',
							}}
						>
							🔗 Reveal Crypto Files
						</Button>
					</Dialog.Trigger>

					{decryptedFileUrls.length > 0 && (
						<Dialog.Content
							style={{
								backgroundColor: '#001f3f',
								color: '#fff',
								border: '1px solid #00ff9d',
							}}
							key={reloadKey}
						>
							<Flex direction="column" gap="3">
								<Text style={{ color: '#00ff9d' }}>🔐 Decrypted Blockchain Files</Text>
								{decryptedFileUrls.map((url, i) => (
									<img
										key={i}
										src={url}
										alt={`Decrypted File ${i}`}
										style={{
											borderRadius: '0.5rem',
											maxWidth: '100%',
											border: '2px solid #8b00ff',
										}}
									/>
								))}
							</Flex>
						</Dialog.Content>
					)}
				</Dialog.Root>
			)}
			<AlertDialog.Root open={!!error} onOpenChange={() => setError(null)}>
				<AlertDialog.Content style={{ backgroundColor: '#001f3f', color: '#fff' }}>
					<AlertDialog.Description style={{ color: '#ff4d4d' }}>
						Crypto Error: {error}
					</AlertDialog.Description>
					<AlertDialog.Action>
						<Button
							onClick={() => setError(null)}
							style={{ backgroundColor: '#00ff9d', color: '#001f3f' }}
						>
							Ok
						</Button>
					</AlertDialog.Action>
				</AlertDialog.Content>
			</AlertDialog.Root>
			<Text
				size="1"
				style={{
					marginTop: '1rem',
					color: '#8b00ff',
					fontFamily: 'monospace',
					textAlign: 'center',
				}}
			>
				Powered by Blockchain ⚡️
			</Text>
		</Card>
	);
};
