import { DAppProvider } from '@mysten/dapp-kit';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { Home } from './Home';
import { networkConfig } from './networkConfig';
import '@mysten/dapp-kit/dist/index.css';
import './global.css'; // Impor CSS global

export default function App() {
	return (
		<div
			style={{
				background: 'linear-gradient(135deg, #001f3f, #00ff9d)', // Latar belakang crypto
				minHeight: '100vh', // Pastikan full height
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				fontFamily: 'Orbitron, sans-serif',
			}}
		>
			<DAppProvider>
				<SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
					<WalletProvider autoConnect>
						<div
							style={{
								textAlign: 'center',
								color: '#00d4ff', // Biru digital
								marginBottom: '2rem',
							}}
						>
							<h1
								style={{
									background: 'linear-gradient(90deg, #00ff9d, #8b00ff)',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
									fontSize: '2.5rem',
								}}
							>
								Crypto Vault
							</h1>
							<p style={{ color: '#8b00ff', fontFamily: 'monospace' }}>
								Securely Access Blockchain-Sealed Files 🔗
							</p>
						</div>
						<Home />
					</WalletProvider>
				</SuiClientProvider>
			</DAppProvider>
		</div>
	);
}
