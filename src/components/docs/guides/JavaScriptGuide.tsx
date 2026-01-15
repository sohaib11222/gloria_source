import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface JavaScriptGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const JavaScriptGuide: React.FC<JavaScriptGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
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

// 3. Import branches
await axios.post(
  \`\${API_BASE}/sources/import-branches\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 4. List branches
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 5. Add location to coverage
await axios.post(
  \`\${API_BASE}/sources/locations\`,
  { unlocode: 'GBMAN' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 6. Test endpoints
const testRes = await axios.post(
  \`\${API_BASE}/endpoints/test\`,
  { testHttp: true, testGrpc: true },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 7. Get endpoint status
const statusRes = await axios.get(
  \`\${API_BASE}/endpoints/status\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 8. List branches with filters
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches?limit=25&offset=0&status=Active&search=Airport\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Branches:', branchesRes.data.items);

// 9. Create a new branch
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

// 10. Update branch
await axios.patch(
  \`\${API_BASE}/sources/branches/\${branchId}\`,
  { natoLocode: 'GBMAN', city: 'Manchester', country: 'United Kingdom' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 11. Get unmapped branches
const unmappedRes = await axios.get(
  \`\${API_BASE}/sources/branches/unmapped?limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 12. Search UN/LOCODE locations
const locationsRes = await axios.get(
  \`\${API_BASE}/sources/locations/search?query=Manchester&limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Locations:', locationsRes.data.items);

// 13. Remove location from coverage
await axios.delete(
  \`\${API_BASE}/sources/locations/GBMAN\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 14. Sync location coverage
await axios.post(
  \`\${API_BASE}/coverage/source/\${companyId}/sync\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 15. Create draft agreement
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

// 16. Offer agreement to agent
await axios.post(
  \`\${API_BASE}/agreements/\${agreementId}/offer\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 17. List all agents with their agreements
const agentsRes = await axios.get(
  \`\${API_BASE}/agreements/all?status=ACTIVE\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 18. Check for duplicate agreement
const duplicateCheck = await axios.post(
  \`\${API_BASE}/agreements/check-duplicate\`,
  {
    sourceId: companyId,
    agentId: 'agent_company_id',
    agreementRef: 'AG-2025-001'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 19. Get health status
const healthRes = await axios.get(
  \`\${API_BASE}/health/my-source\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);

// 20. Get source notifications
const notificationsRes = await axios.get(
  \`\${API_BASE}/endpoints/notifications?limit=50&unreadOnly=true\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 21. Mark notification as read
await axios.post(
  \`\${API_BASE}/endpoints/notifications/\${notificationId}/read\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);`;

  const errorHandlingCode = `try {
  const response = await axios.get(\`\${API_BASE}/sources/branches\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  console.log('Branches:', response.data.items);
} catch (error) {
  if (error.response) {
    // API returned error response
    console.error('API Error:', error.response.data.error);
    console.error('Message:', error.response.data.message);
  } else {
    // Network or other error
    console.error('Network Error:', error.message);
  }
}`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>JavaScript Quick Start</h2>
            {role === 'source' && (
              <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                  <strong>For Sources:</strong> Configure endpoints, sync locations, and manage agreements. Your Company ID is: <code style={{ backgroundColor: '#fff', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', border: '1px solid #d1d5db' }}>{companyId !== 'YOUR_COMPANY_ID' ? companyId : 'YOUR_COMPANY_ID'}</code>
                </p>
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
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Always implement proper error handling for robust integrations:</p>
            <CodeBlock code={errorHandlingCode} />
          </div>
        );

      case 'best-practices':
        return (
          <div id="best-practices" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Best Practices</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>Authentication:</strong> Store JWT tokens securely (use httpOnly cookies or secure storage) and refresh before expiration</li>
                <li><strong>Error Handling:</strong> Always implement proper error handling for network and API errors with retry logic</li>
                <li><strong>Rate Limiting:</strong> Implement retry logic with exponential backoff for transient failures (429, 503 errors)</li>
                <li><strong>Validation:</strong> Validate branch data before submission to avoid validation errors</li>
                <li><strong>Idempotency:</strong> Use unique branch codes and agreement references to avoid duplicates</li>
                <li><strong>Monitoring:</strong> Check health status regularly to ensure optimal performance</li>
                <li><strong>Branch Mapping:</strong> Always map branches to UN/LOCODEs for availability searches</li>
                <li><strong>Endpoint Testing:</strong> Test endpoints after configuration changes using the /endpoints/test endpoint</li>
                <li><strong>Company Code:</strong> Ensure your supplier endpoint returns the correct CompanyCode matching your company ID</li>
                <li><strong>Branch Format:</strong> Follow the exact branch data format requirements for imports from supplier endpoints</li>
                <li><strong>Location Sync:</strong> Regularly sync locations from your gRPC server to keep coverage up to date</li>
                <li><strong>Agreement Management:</strong> Use unique agreement references per agent to avoid conflicts</li>
              </ul>
            </div>
          </div>
        );

      case 'api-reference':
        return (
          <div id="api-reference" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>API Reference</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Complete API reference for source endpoints. All endpoints require authentication via Bearer token in the Authorization header.
            </p>
            <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Key Endpoints</h3>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>POST /auth/login</strong> - Login and get JWT token</li>
                <li><strong>PUT /endpoints/config</strong> - Configure HTTP/gRPC endpoints</li>
                <li><strong>POST /endpoints/test</strong> - Test endpoint connectivity</li>
                <li><strong>GET /sources/branches</strong> - List branches (with filters)</li>
                <li><strong>POST /sources/branches</strong> - Create new branch</li>
                <li><strong>POST /sources/import-branches</strong> - Import branches from supplier endpoint</li>
                <li><strong>GET /sources/locations/search</strong> - Search UN/LOCODE database</li>
                <li><strong>POST /sources/locations</strong> - Add location to coverage</li>
                <li><strong>POST /coverage/source/:sourceId/sync</strong> - Sync locations from gRPC</li>
                <li><strong>POST /agreements</strong> - Create draft agreement</li>
                <li><strong>POST /agreements/:id/offer</strong> - Offer agreement to agent</li>
                <li><strong>GET /health/my-source</strong> - Get health status</li>
              </ul>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                📖 <strong>Full API Reference:</strong> See the TypeScript guide for complete endpoint documentation with request/response examples.
              </p>
            </div>
          </div>
        );

      case 'grpc-implementation':
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              As a source, you must implement a gRPC server that implements the <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>SourceProviderService</code> interface.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                ⚠️ <strong>Note:</strong> JavaScript/Node.js gRPC server implementation is identical to TypeScript. See the TypeScript guide for complete gRPC server implementation examples.
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                💡 <strong>Tip:</strong> Use the same <code>@grpc/grpc-js</code> and <code>@grpc/proto-loader</code> packages as shown in the TypeScript guide. 
                The implementation is the same for JavaScript and TypeScript.
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

export default JavaScriptGuide;

