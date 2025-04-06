import React, { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Container, Flex, Grid, Card } from '@radix-ui/themes';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

import { CreateAllowlist } from './CreateAllowlist';
import { Allowlist } from './Allowlist';
import WalrusUpload from './EncryptAndUpload';
import { CreateService } from './CreateSubscriptionService';
import SubscriptionView from './SubscriptionView';
import { Service } from './SubscriptionService';
import { AllAllowlist } from './OwnedAllowlists';
import { AllServices } from './OwnedSubscriptionServices';
import Feeds from './AllowlistView';

function LandingPage() {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        minHeight: '100vh',
        padding: '2rem',
      }}
    >
      <h1
        style={{
          textAlign: 'center',
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '2rem',
          color: '#4fc3f7',
        }}
      >
        Choose Access Type
      </h1>

      <Grid
        columns={{ initial: '1', sm: '2' }}
        gap="5"
        style={{ maxWidth: '1000px', margin: '0 auto' }}
      >
        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 10px 20px rgba(79, 195, 247, 0.2)',
            padding: '2rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e0f7fa',
          }}
        >
          <Flex direction="column" gap="3" align="center" justify="between" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#4fc3f7' }}>Allowlist Access</h2>
              <p style={{ marginTop: '1rem', color: '#555' }}>
                Create an allowlist-based access. Add users, upload encrypted files, and ensure only
                listed users can decrypt.
              </p>
            </div>
            <Link to="/allowlist-example">
              <button
                style={{
                  background: 'linear-gradient(to right, #4fc3f7, #ba68c8)',
                  color: '#fff',
                  padding: '0.7rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  marginTop: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
            </Link>
          </Flex>
        </Card>

        <Card
          style={{
            borderRadius: '16px',
            boxShadow: '0 10px 20px rgba(79, 195, 247, 0.2)',
            padding: '2rem',
            backgroundColor: '#ffffff',
            border: '1px solid #e0f7fa',
          }}
        >
          <Flex direction="column" gap="3" align="center" justify="between" style={{ height: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#4fc3f7' }}>Subscription Access</h2>
              <p style={{ marginTop: '1rem', color: '#555' }}>
                Define a subscription-based model using NFTs. Only paid, valid users can access your
                encrypted content.
              </p>
            </div>
            <Link to="/subscription-example">
              <button
                style={{
                  background: 'linear-gradient(to right, #4fc3f7, #ba68c8)',
                  color: '#fff',
                  padding: '0.7rem 1.5rem',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  marginTop: '1.5rem',
                  cursor: 'pointer',
                }}
              >
                Create
              </button>
            </Link>
          </Flex>
        </Card>
      </Grid>
    </div>
  );
}

function App() {
  const currentAccount = useCurrentAccount();
  const [recipientAllowlist, setRecipientAllowlist] = useState<string>('');
  const [capId, setCapId] = useState<string>('');

  return (
    <div style={{ backgroundColor: '#ffffff', minHeight: '100vh' }}>
      <Container>
        <Flex
          position="sticky"
          px="4"
          py="2"
          justify="between"
          style={{
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            borderRadius: '12px',
            marginBottom: '1rem',
          }}
        >
          <h1
            style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#1f2937',
              fontFamily: 'Segoe UI, sans-serif',
            }}
          >
            Cryptosealtzu
          </h1>
          <Box>
            <ConnectButton
              style={{
                background: 'linear-gradient(to right, #6dd5ed, #2193b0)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            />
          </Box>
        </Flex>
        {currentAccount ? (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/allowlist-example/*"
                element={
                  <Routes>
                    <Route path="/" element={<CreateAllowlist />} />
                    <Route
                      path="/admin/allowlist/:id"
                      element={
                        <div>
                          <Allowlist
                            setRecipientAllowlist={setRecipientAllowlist}
                            setCapId={setCapId}
                          />
                          <WalrusUpload
                            policyObject={recipientAllowlist}
                            cap_id={capId}
                            moduleName="allowlist"
                          />
                        </div>
                      }
                    />
                    <Route path="/admin/allowlists" element={<AllAllowlist />} />
                    <Route
                      path="/view/allowlist/:id"
                      element={<Feeds suiAddress={currentAccount.address} />}
                    />
                  </Routes>
                }
              />
              <Route
                path="/subscription-example/*"
                element={
                  <Routes>
                    <Route path="/" element={<CreateService />} />
                    <Route
                      path="/admin/service/:id"
                      element={
                        <div>
                          <Service
                            setRecipientAllowlist={setRecipientAllowlist}
                            setCapId={setCapId}
                          />
                          <WalrusUpload
                            policyObject={recipientAllowlist}
                            cap_id={capId}
                            moduleName="subscription"
                          />
                        </div>
                      }
                    />
                    <Route path="/admin/services" element={<AllServices />} />
                    <Route
                      path="/view/service/:id"
                      element={<SubscriptionView setRecipientAllowlist={setRecipientAllowlist} setCapId={setCapId} />}
                    />
                  </Routes>
                }
              />
            </Routes>
          </BrowserRouter>
        ) : (
          <p>Please connect your wallet to continue</p>
        )}
      </Container>
    </div>
  );
}

export default App;
