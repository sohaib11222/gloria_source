import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface PhpGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const PhpGuide: React.FC<PhpGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
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
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`composer require carhire/middleware-php`}</pre>
            </div>
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p>All errors are thrown as <code>CarHireException</code> with structured information:</p>
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
                📖 <strong>Full API Reference:</strong> See the TypeScript guide for complete endpoint documentation.
              </p>
            </div>
          </div>
        );

      case 'grpc-implementation':
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              PHP has limited native gRPC server support. Consider using a different language (Node.js, Go, Python, Java) for gRPC server implementation, 
              or use PHP extensions like <code>grpc</code> if available.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
                ⚠️ <strong>Note:</strong> PHP gRPC server implementation is complex and not widely supported. 
                We recommend implementing your gRPC server in Node.js, Go, Python, or Java. See those guides for complete examples.
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                💡 <strong>Alternative:</strong> If you must use PHP, consider using a microservice architecture where a separate service (Node.js/Go) handles gRPC 
                and communicates with your PHP application via REST API.
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

export default PhpGuide;

