import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType =
  | 'quick-start'
  | 'architecture-flow'
  | 'installation'
  | 'error-handling'
  | 'best-practices'
  | 'api-reference'
  | 'grpc-implementation';

interface PhpGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
  downloadingProto?: boolean;
  onDownloadProto?: () => void;
}

const PhpGuide: React.FC<PhpGuideProps> = ({
  activeSection,
  role = 'source',
  companyId = 'YOUR_COMPANY_ID',
  downloadingProto = false,
  onDownloadProto,
}) => {
  const quickStartCode = `<?php

$API_BASE = 'http://localhost:8080';
$token = '';
$companyId = '';

// 1. Login
$ch = curl_init($API_BASE . '/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'source@example.com',
    'password' => 'password123'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = json_decode(curl_exec($ch), true);
$token = $response['access'];
$companyId = $response['user']['company']['id'];

// Helper function for authenticated requests
function apiRequest($method, $endpoint, $data = null) {
    global $API_BASE, $token;
    $ch = curl_init($API_BASE . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ]);
    if ($data) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    return json_decode(curl_exec($ch), true);
}

// 2. Configure endpoints
apiRequest('PUT', '/endpoints/config', [
    'httpEndpoint' => 'http://localhost:9090',
    'grpcEndpoint' => 'localhost:51061',
    'adapterType' => 'grpc'
]);

// 3. Test endpoints
apiRequest('POST', '/endpoints/test', ['testHttp' => true, 'testGrpc' => true]);

// 4. Import branches from supplier endpoint
apiRequest('POST', '/sources/import-branches');

// 5. List branches with filters
$branches = apiRequest('GET', '/sources/branches?limit=25&offset=0&status=Active');
echo "Found " . count($branches['items']) . " branches\\n";

// 6. Create a new branch
apiRequest('POST', '/sources/branches', [
    'branchCode' => 'BR001',
    'name' => 'Manchester Airport',
    'natoLocode' => 'GBMAN',
    'latitude' => 53.3656,
    'longitude' => -2.2729,
    'city' => 'Manchester',
    'country' => 'United Kingdom',
    'countryCode' => 'GB'
]);

// 7. Search UN/LOCODE locations
$locations = apiRequest('GET', '/sources/locations/search?query=Manchester&limit=25');
echo "Found " . count($locations['items']) . " locations\\n";

// 8. Add location to coverage
apiRequest('POST', '/sources/locations', ['unlocode' => 'GBMAN']);

// 9. Sync location coverage
apiRequest('POST', '/coverage/source/' . $companyId . '/sync');

// 10. Create agreement
$agreement = apiRequest('POST', '/agreements', [
    'agent_id' => 'agent_company_id',
    'source_id' => $companyId,
    'agreement_ref' => 'AG-2025-001',
    'valid_from' => '2025-01-01T00:00:00Z',
    'valid_to' => '2025-12-31T23:59:59Z'
]);

// 11. Offer agreement
apiRequest('POST', '/agreements/' . $agreement['id'] . '/offer');

// 12. Get health status
$health = apiRequest('GET', '/health/my-source');
echo "Health: " . json_encode($health) . "\\n";`;

  const errorHandlingCode = `$res = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode >= 400) {
    $errorData = json_decode($res, true);
    echo "API Error: " . ($errorData['error'] ?? 'UNKNOWN') . "\\n";
    echo "Message: " . ($errorData['message'] ?? 'No message') . "\\n";
    if (isset($errorData['details'])) {
        echo "Details: " . json_encode($errorData['details']) . "\\n";
    }
} else {
    $data = json_decode($res, true);
    // Process successful response
}

curl_close($ch);`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>PHP Quick Start</h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9375rem', lineHeight: 1.55 }}>
              These examples call the Gloria <strong>Source REST API</strong> with plain PHP and cURL (login, branches, agreements). They do not use the OTA adapter package. For the supplier OTA + Laravel + gRPC bundle, use{' '}
              <strong>Download Source PHP bundle</strong> in the SDK header (ZIP <code>php-source</code>).
            </p>
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'architecture-flow':
        return (
          <div id="architecture-flow" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Architecture & flow</h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9375rem', lineHeight: 1.55 }}>
              You have <strong>two</strong> integration surfaces: (1) <strong>Gloria Source REST</strong> — this portal and the cURL examples in Quick Start; (2){' '}
              <strong>Source PHP bundle</strong> — OTA XML to your fleet, Laravel routes under <code>/glora</code>, optional Node gRPC bridge, and{' '}
              <code>gloria_client_supplier.proto</code> for inbound calls from Gloria.
            </p>
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                End-to-end (Mermaid — use{' '}
                <a href="https://mermaid.live" style={{ color: '#2563eb' }}>
                  mermaid.live
                </a>{' '}
                to render)
              </p>
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.75rem',
                  lineHeight: 1.5,
                  fontFamily: 'ui-monospace, monospace',
                  whiteSpace: 'pre-wrap',
                  color: '#0f172a',
                }}
              >
                {`flowchart TB
  subgraph Portal["Gloria Source portal"]
    UI[Branches / coverage / agreements]
  end
  subgraph GloriaAPI["Gloria Source API"]
    REST[REST JSON]
    IMP[Import branches / locations]
  end
  subgraph YourStack["Your supplier stack (PHP bundle)"]
    LRV[Laravel /glora HTTP]
    OTA[OTA XML adapter]
    GRPC[Optional gRPC server]
    FLT[Fleet / PMS]
  end
  UI -->|JWT| REST
  REST --> IMP
  IMP -->|HTTP XML or gRPC GetLocations| LRV
  LRV --> OTA
  OTA --> FLT
  GloriaAPI -->|When adapterType grpc| GRPC
  GRPC --> OTA`}
              </pre>
            </div>
            <div style={{ backgroundColor: '#1f2937', color: '#e2e8f0', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.75rem', lineHeight: 1.5, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap' }}>
                {`Location list import (conceptual)

  Gloria UI          Gloria API              Your endpoint
      |                   |                        |
      |-- save transport->| PUT .../config         |
      |-- import -------->| POST import-location-* |--> HTTP XML or gRPC
      |<-- branches/locs -|                        |`}
              </pre>
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.65 }}>
              <li>
                <strong>REST first</strong> — Login, <code>PUT /endpoints/config</code>, health checks, and branch/agreement flows match the Quick Start script (replace <code>$API_BASE</code> and credentials).
              </li>
              <li>
                <strong>Company id</strong> — Use your Gloria source company id on coverage paths and agreement payloads (shown in the SDK shell when logged in).
              </li>
              <li>
                <strong>Location transport</strong> — Under Location & Branches, choose HTTP POST XML or gRPC <code>GetLocations</code>; Gloria calls the endpoint you registered.
              </li>
              <li>
                <strong>Bundle</strong> — Unzip <code>gloria-php-source-supplier.zip</code> (<code>php-source</code>), run <code>composer install</code> in the bundle, wire env for your fleet URLs, then align OTA RQ/RS with <code>MAPPING.md</code> in the ZIP.
              </li>
            </ol>
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9375rem', lineHeight: 1.55 }}>
              <strong>Path A — Source REST (this tab):</strong> no Composer package is required; PHP 8+ and cURL are enough. <strong>Path B — Supplier OTA bridge:</strong> unzip the Source PHP bundle, then install the adapter library.
            </p>
            <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '0.375rem', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#065f46' }}>Supplier OTA bundle (from portal download)</p>
              <pre style={{ margin: 0, fontSize: '0.8125rem', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`# After unzipping gloria-php-source-supplier.zip:
cd php
composer install`}</pre>
            </div>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>REST-only integration</p>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>Use the Quick Start cURL patterns; wire your own HTTP client or framework as needed.</p>
            </div>
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9375rem', lineHeight: 1.55 }}>
              For Source REST calls, inspect the HTTP status code and JSON body (<code>error</code>, <code>message</code>, <code>details</code>). The OTA adapter bundle uses PHP exceptions from <code>gloria/client-supplier-adapter</code> — see that package&apos;s README.
            </p>
            <CodeBlock code={errorHandlingCode} />
          </div>
        );

      case 'best-practices':
        return (
          <div id="best-practices" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Best Practices</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>Error Handling:</strong> Use try/catch blocks and handle API errors properly</li>
                <li><strong>cURL Options:</strong> Set proper timeout and SSL options for cURL requests</li>
                <li><strong>Validation:</strong> Validate input data before API calls</li>
                <li><strong>Idempotency:</strong> Use unique identifiers for branches and agreements</li>
                <li><strong>Resource Management:</strong> Close cURL handles properly</li>
                <li><strong>Health Monitoring:</strong> Regularly check endpoint health status</li>
                <li><strong>Branch Mapping:</strong> Map all branches to UN/LOCODEs</li>
                <li><strong>Security:</strong> Store tokens securely and never expose them in logs</li>
                <li><strong>Error Logging:</strong> Log errors appropriately for debugging</li>
              </ul>
            </div>
          </div>
        );

      case 'api-reference':
        return (
          <div id="api-reference" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>API Reference</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Complete API reference for source endpoints. All endpoints require Bearer token authentication.
            </p>
            <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Key Endpoints</h3>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>POST /auth/login</strong> - Login and get JWT token</li>
                <li><strong>PUT /endpoints/config</strong> - Configure HTTP/gRPC endpoints</li>
                <li><strong>POST /sources/branches</strong> - Create or list branches</li>
                <li><strong>POST /sources/import-branches</strong> - Import from supplier endpoint</li>
                <li><strong>POST /sources/locations</strong> - Add location to coverage</li>
                <li><strong>POST /coverage/source/:sourceId/sync</strong> - Sync locations from gRPC</li>
                <li><strong>POST /agreements</strong> - Create agreement</li>
                <li><strong>POST /agreements/:id/offer</strong> - Offer agreement to agent</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                📖 <strong>Full API Reference:</strong> See Gloria OpenAPI / backend docs for every route; this PHP guide lists the main Source paths above.
              </p>
            </div>
          </div>
        );

      case 'grpc-implementation':
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              The <strong>Source PHP bundle</strong> ships an optional small Node (or similar) gRPC server that implements <code>SourceProviderService</code> from{' '}
              <code>gloria_client_supplier.proto</code>, forwards to your Laravel <code>/glora/*</code> routes, and returns normalized payloads. Native PHP gRPC servers are possible but uncommon; the bundle path is the supported default.
            </p>
            {onDownloadProto && (
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={onDownloadProto}
                  disabled={downloadingProto}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: downloadingProto ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: downloadingProto ? 'not-allowed' : 'pointer',
                  }}
                >
                  {downloadingProto ? 'Downloading…' : 'Download source_provider.proto'}
                </button>
              </div>
            )}
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e3a8a', fontWeight: 500 }}>
                Wire <code>adapterType</code> and <code>grpcEndpoint</code> in <code>PUT /endpoints/config</code> so Gloria dials your listener; keep TLS and whitelist entries aligned with ops.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const sourcePhpIntro =
    role === 'source' ? (
      <div
        style={{
          marginBottom: '1.5rem',
          padding: '1rem 1.25rem',
          backgroundColor: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '0.5rem',
        }}
      >
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534', lineHeight: 1.55 }}>
          <strong>Two different &quot;PHP&quot; integrations:</strong> (1) <strong>This guide</strong> — HTTP/cURL against Gloria Source APIs. (2){' '}
          <strong>Source PHP bundle ZIP</strong> — OTA XML adapter, Laravel routes, optional Node gRPC server, and <code>gloria_client_supplier.proto</code> for suppliers connecting fleet systems to Gloria.
        </p>
      </div>
    ) : null;

  return (
    <div>
      {sourcePhpIntro}
      {renderSection()}
    </div>
  );
};

export default PhpGuide;

