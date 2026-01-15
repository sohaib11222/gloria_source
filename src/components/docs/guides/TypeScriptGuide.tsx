import React from 'react';
import { Download } from 'lucide-react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface TypeScriptGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
  downloadingProto?: boolean;
  onDownloadProto?: () => void;
}

const TypeScriptGuide: React.FC<TypeScriptGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID',
  downloadingProto = false,
  onDownloadProto
}) => {
  const quickStartCode = `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
let token = '';

// 1. Login
const loginRes = await axios.post(\`\${API_BASE}/auth/login\`, {
  email: 'source@example.com',
  password: 'password123'
});
token = loginRes.data.access;
const companyId = loginRes.data.user.company.id;

// 2. Configure endpoints
await axios.put(
  \`\${API_BASE}/endpoints/config\`,
  {
    httpEndpoint: 'http://localhost:9090',
    grpcEndpoint: 'localhost:51061',
    adapterType: 'grpc'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 3. Test endpoints
const testRes = await axios.post(
  \`\${API_BASE}/endpoints/test\`,
  { testHttp: true, testGrpc: true },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Test results:', testRes.data);

// 4. Import branches from supplier endpoint
await axios.post(
  \`\${API_BASE}/sources/import-branches\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 5. List your branches
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches?limit=25&offset=0\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Branches:', branchesRes.data.items);

// 6. Create a new branch
const newBranchRes = await axios.post(
  \`\${API_BASE}/sources/branches\`,
  {
    branchCode: 'BR001',
    name: 'Manchester Airport',
    natoLocode: 'GBMAN',
    latitude: 53.3656,
    longitude: -2.2729,
    city: 'Manchester',
    country: 'United Kingdom',
    countryCode: 'GB'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 7. Search for UN/LOCODE locations
const locationsRes = await axios.get(
  \`\${API_BASE}/sources/locations/search?query=Manchester&limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 8. Add location to coverage
await axios.post(
  \`\${API_BASE}/sources/locations\`,
  { unlocode: 'GBMAN' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 9. Sync location coverage from gRPC
await axios.post(
  \`\${API_BASE}/coverage/source/\${companyId}/sync\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 10. Create and offer agreement
const agreementRes = await axios.post(
  \`\${API_BASE}/agreements\`,
  {
    agent_id: 'agent_company_id',
    source_id: companyId,
    agreement_ref: 'AG-2025-001',
    valid_from: '2025-01-01T00:00:00Z',
    valid_to: '2025-12-31T23:59:59Z'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
const agreementId = agreementRes.data.id;

// Offer the agreement
await axios.post(
  \`\${API_BASE}/agreements/\${agreementId}/offer\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 11. List agreements
const agreementsRes = await axios.get(
  \`\${API_BASE}/agreements?sourceId=\${companyId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 12. Check health status
const healthRes = await axios.get(
  \`\${API_BASE}/health/my-source\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);

// 13. Get unmapped branches
const unmappedRes = await axios.get(
  \`\${API_BASE}/sources/branches/unmapped?limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 14. Update branch
await axios.patch(
  \`\${API_BASE}/sources/branches/\${branchId}\`,
  { natoLocode: 'GBMAN', city: 'Manchester' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 15. Remove location from coverage
await axios.delete(
  \`\${API_BASE}/sources/locations/GBMAN\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 16. Get endpoint notifications
const notificationsRes = await axios.get(
  \`\${API_BASE}/endpoints/notifications?limit=50&unreadOnly=true\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 17. Mark notification as read
await axios.post(
  \`\${API_BASE}/endpoints/notifications/\${notificationId}/read\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 18. Get endpoint status
const statusRes = await axios.get(
  \`\${API_BASE}/endpoints/status\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 19. Check for duplicate agreement
const duplicateCheck = await axios.post(
  \`\${API_BASE}/agreements/check-duplicate\`,
  {
    sourceId: companyId,
    agentId: 'agent_company_id',
    agreementRef: 'AG-2025-001'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);`;

  const errorHandlingCode = `// Error response format
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* Optional additional details */ }
}

// Common error codes:
// - AUTH_ERROR: Invalid credentials
// - FORBIDDEN: Insufficient permissions  
// - NOT_FOUND: Resource not found
// - VALIDATION_ERROR: Invalid request data
// - CONNECTION_ERROR: Cannot connect to supplier endpoint
// - BRANCH_CODE_EXISTS: Branch already exists
// - UNLOCODE_NOT_FOUND: UN/LOCODE not in database
// - COMPANY_CODE_MISMATCH: Company code mismatch
// - NOT_APPROVED: Source not approved yet
// - EMAIL_NOT_VERIFIED: Email not verified

// Example error handling
try {
  const response = await axios.post('/sources/branches', branchData, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  console.log('Success:', response.data);
} catch (error) {
  if (error.response) {
    const { error: errorCode, message, details } = error.response.data;
    switch (errorCode) {
      case 'BRANCH_CODE_EXISTS':
        console.error('Branch already exists:', message);
        break;
      case 'VALIDATION_ERROR':
        console.error('Validation errors:', details);
        break;
      case 'CONNECTION_ERROR':
        console.error('Cannot connect to supplier:', message);
        break;
      default:
        console.error('API Error:', errorCode, message);
    }
  } else {
    console.error('Network Error:', error.message);
  }
}`;

  const grpcImplementationCode = `const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto file
const packageDefinition = protoLoader.loadSync('source_provider.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const sourceProviderProto = grpc.loadPackageDefinition(packageDefinition).source_provider;

// Implement service
const server = new grpc.Server();

server.addService(sourceProviderProto.SourceProviderService.service, {
  GetHealth: (call, callback) => {
    callback(null, { ok: true, note: 'Service is healthy' });
  },
  
  GetLocations: (call, callback) => {
    callback(null, {
      locations: [
        { unlocode: 'GBMAN', name: 'Manchester Airport' },
        { unlocode: 'GBGLA', name: 'Glasgow Airport' }
      ]
    });
  },
  
  GetAvailability: (call, callback) => {
    const vehicles = [
      {
        supplier_offer_ref: \`OFFER-\${Date.now()}-1\`,
        vehicle_class: 'ECMN',
        make_model: 'Toyota Yaris',
        currency: 'USD',
        total_price: 45.99,
        availability_status: 'AVAILABLE'
      }
    ];
    callback(null, { vehicles });
  },
  
  CreateBooking: (call, callback) => {
    const supplierBookingRef = \`BKG-\${Date.now()}\`;
    callback(null, {
      supplier_booking_ref: supplierBookingRef,
      status: 'CONFIRMED'
    });
  },
  
  ModifyBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CONFIRMED'
    });
  },
  
  CancelBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CANCELLED'
    });
  },
  
  CheckBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CONFIRMED'
    });
  }
});

// Start server
const port = '0.0.0.0:51061';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Failed to start server:', error);
    return;
  }
  server.start();
  console.log(\`gRPC server listening on \${port}\`);
});`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>TypeScript Quick Start</h2>
            {role === 'source' && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                  <strong>For Sources:</strong> After login, configure your endpoints, sync locations, and offer agreements to agents. Use your Company ID ({companyId !== 'YOUR_COMPANY_ID' ? <code style={{ backgroundColor: '#fff', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', border: '1px solid #d1d5db' }}>{companyId}</code> : 'YOUR_COMPANY_ID'}) in API calls.
                </p>
              </div>
            )}
            {role === 'source' && (
              <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 600 }}>
                      📥 Need the gRPC Proto File?
                    </p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      Download the source_provider.proto file to implement your gRPC server
                    </p>
                  </div>
                  <button
                    onClick={onDownloadProto}
                    disabled={downloadingProto}
                    style={{
                      background: downloadingProto ? '#9ca3af' : '#1e293b',
                      color: 'white',
                      border: '1px solid #334155',
                      borderRadius: '0.25rem',
                      padding: '0.5rem 1rem',
                      cursor: downloadingProto ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!downloadingProto) {
                        e.currentTarget.style.background = '#334155';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!downloadingProto) {
                        e.currentTarget.style.background = '#1e293b';
                      }
                    }}
                  >
                    <Download size={16} />
                    {downloadingProto ? 'Downloading...' : 'Download Proto'}
                  </button>
                </div>
              </div>
            )}
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install axios
# or
yarn add axios`}</pre>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Note:</strong> You can use any HTTP client library (axios, fetch, etc.) to interact with the Gloria Connect API. The examples above use axios, but you can adapt them to your preferred library.
            </p>
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
              All API errors follow a consistent format. Always handle errors properly:
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
                <li><strong>Authentication:</strong> Store JWT tokens securely and refresh before expiration</li>
                <li><strong>Error Handling:</strong> Always implement proper error handling for network and API errors</li>
                <li><strong>Rate Limiting:</strong> Implement retry logic with exponential backoff for transient failures</li>
                <li><strong>Validation:</strong> Validate branch data before submission to avoid validation errors</li>
                <li><strong>Idempotency:</strong> Use unique branch codes and agreement references to avoid duplicates</li>
                <li><strong>Monitoring:</strong> Check health status regularly to ensure optimal performance</li>
                <li><strong>Branch Mapping:</strong> Always map branches to UN/LOCODEs for availability searches</li>
                <li><strong>Endpoint Testing:</strong> Test endpoints after configuration changes</li>
                <li><strong>Company Code:</strong> Ensure your supplier endpoint returns the correct CompanyCode</li>
                <li><strong>Branch Format:</strong> Follow the exact branch data format requirements for imports</li>
              </ul>
            </div>
          </div>
        );

      case 'api-reference':
        return (
          <div id="api-reference" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Complete Source API Reference</h2>
            <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Authentication</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/register</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Register a new source company</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/verify-email</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Verify email with OTP code</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/login</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Login and get JWT token</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Endpoint Configuration</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/config</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get endpoint configuration</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#475569', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>PUT</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/config</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Update endpoint configuration</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/test</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Test endpoint connectivity</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/status</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get endpoint status and health</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/notifications</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get source notifications</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/notifications/:id/read</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Mark notification as read</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Branches Management</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List branches (with filters: status, locationType, search, limit, offset)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Create a new branch</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/:id</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get branch details</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#475569', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>PATCH</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/:id</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Update branch</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/unmapped</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List branches without natoLocode</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/import-branches</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Import branches from supplier HTTP endpoint</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/upload-branches</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Upload branches from JSON file</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Location Coverage</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations/search</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Search UN/LOCODE database (query, limit, cursor)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Add location to coverage (unlocode)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#64748b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>DELETE</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations/:unlocode</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Remove location from coverage</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/coverage/source/:sourceId/sync</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Sync location coverage from gRPC adapter</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Agreements</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Create draft agreement (agent_id, source_id, agreement_ref, valid_from, valid_to)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/all</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List all agents with their agreements (status filter)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/:id</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get agreement details</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/:id/offer</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Offer agreement to agent</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/check-duplicate</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Check if agreement already exists (GET or POST)</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Health & Verification</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/health/my-source</td>
                    <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get health status (slowRate, backoffLevel, excludedUntil)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'grpc-implementation':
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              As a source, you must implement a gRPC server that implements the <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>SourceProviderService</code> interface. 
              The middleware will call your gRPC server to get availability, create bookings, and manage locations.
            </p>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                ⚠️ <strong>Important:</strong> Your gRPC server must be accessible at the endpoint you configure in the middleware. 
                Make sure your server is running and reachable before testing.
              </p>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Required gRPC Methods</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>1. GetHealth</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Health check endpoint. Return <code>{`{ ok: true, note: "Service is healthy" }`}</code> if your service is ready.
              </p>
              <CodeBlock code={`// Node.js example
GetHealth: (call, callback) => {
  callback(null, {
    ok: true,
    note: 'Service is healthy'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>2. GetLocations</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Return all locations (UN/LOCODEs) that your source supports. Used for location sync.
              </p>
              <CodeBlock code={`// Node.js example
GetLocations: (call, callback) => {
  const locations = [
    { unlocode: 'GBMAN', name: 'Manchester Airport' },
    { unlocode: 'GBGLA', name: 'Glasgow Airport' },
    { unlocode: 'GBLHR', name: 'London Heathrow' }
  ];
  callback(null, { locations });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>3. GetAvailability</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Return vehicle availability offers for the given criteria. This is called when an agent searches for availability.
              </p>
              <CodeBlock code={`// Node.js example
GetAvailability: (call, callback) => {
  const { 
    agreement_ref, 
    pickup_unlocode, 
    dropoff_unlocode, 
    pickup_iso, 
    dropoff_iso,
    driver_age,
    residency_country,
    vehicle_classes 
  } = call.request;

  // Query your inventory system
  const vehicles = [
    {
      supplier_offer_ref: \`OFFER-\${Date.now()}-1\`,
      vehicle_class: 'ECMN',
      make_model: 'Toyota Yaris',
      currency: 'USD',
      total_price: 45.99,
      availability_status: 'AVAILABLE'
    },
    {
      supplier_offer_ref: \`OFFER-\${Date.now()}-2\`,
      vehicle_class: 'CDMR',
      make_model: 'VW Golf',
      currency: 'USD',
      total_price: 67.50,
      availability_status: 'AVAILABLE'
    }
  ];

  callback(null, { vehicles });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>4. CreateBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Create a booking. Use the idempotency_key to prevent duplicate bookings. Return your booking reference and status.
              </p>
              <CodeBlock code={`// Node.js example
CreateBooking: (call, callback) => {
  const { 
    agreement_ref, 
    supplier_offer_ref, 
    agent_booking_ref, 
    idempotency_key 
  } = call.request;

  // Check idempotency - if booking with this key exists, return existing booking
  // Otherwise, create new booking in your system
  
  const supplierBookingRef = \`BKG-\${Date.now()}\`;
  
  callback(null, {
    supplier_booking_ref: supplierBookingRef,
    status: 'CONFIRMED' // or 'REQUESTED', 'FAILED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>5. ModifyBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Modify an existing booking. Return updated booking status.
              </p>
              <CodeBlock code={`// Node.js example
ModifyBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Update booking in your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CONFIRMED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>6. CancelBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Cancel an existing booking. Return cancelled booking status.
              </p>
              <CodeBlock code={`// Node.js example
CancelBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Cancel booking in your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CANCELLED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>7. CheckBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Check the status of an existing booking.
              </p>
              <CodeBlock code={`// Node.js example
CheckBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Query booking status from your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CONFIRMED' // or 'CANCELLED', 'FAILED', etc.
  });
}`} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Complete Node.js gRPC Server Example</h3>
            <CodeBlock code={grpcImplementationCode} />

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                💡 <strong>Tip:</strong> Download the proto file using the button above, then use it to generate client/server code for your language. 
                Most gRPC libraries can generate code from proto files automatically.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div>{renderSection()}</div>;
};

export default TypeScriptGuide;

