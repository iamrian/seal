import { DAppProvider } from '@mysten/dapp-kit';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { Allowlist } from './Allowlist';
import { networkConfig } from './networkConfig';
import '@mysten/dapp-kit/dist/index.css';
import './global.css'; // Impor CSS global untuk animasi

export default function App() {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #001f3f, #00ff9d)', // Gradient crypto
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				fontFamily: 'Orbitron, sans-serif',
			}}
		>
			<header
				style={{
					textAlign: 'center',
					color: '#00d4ff', // Biru digital
					marginBottom: '2rem',
					marginTop: '1rem',
				}}
			>
				<h1
					style={{
						background: 'linear-gradient(90deg, #00ff9d, #8b00ff)', // Hijau ke ungu
						WebkitBackgroundClip: 'text',
						WebkitTextFillColor: 'transparent',
						fontSize: '2.5rem',
						textShadow: '0 0 10px rgba(0, 255, 157, 0.7)',
					}}
				>
					Crypto Vault
				</h1>
				<p style={{ color: '#8b00ff', fontFamily: 'monospace' }}>
					Unlock Blockchain-Sealed Secrets 🔗
				</p>
			</header>
			<DAppProvider>
				<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
					<WalletProvider autoConnect>
						<Allowlist suiAddress="0x0" /> {/* Ganti dengan address Anda jika perlu */}
					</WalletProvider>
				</SuiClientProvider>
			</DAppProvider>
			<footer
				style={{
					marginTop: '2rem',
					color: '#8b00ff',
					fontFamily: 'monospace',
					fontSize: '0.9rem',
				}}
			>
				Powered by Blockchain Technology ⚡️
			</footer>
		</div>
	);
}
