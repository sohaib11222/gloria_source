import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface PerlGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const PerlGuide: React.FC<PerlGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
}) => {
  const quickStartCode = `use LWP::UserAgent;
use JSON;
use URI;

my $API_BASE = 'http://localhost:8080';
my $token = '';
my $company_id = '';

my $ua = LWP::UserAgent->new;
my $json = JSON->new;

# Helper function for authenticated requests
sub api_request {
    my ($method, $endpoint, $data) = @_;
    my $req = HTTP::Request->new($method, "$API_BASE$endpoint");
    $req->header('Authorization' => "Bearer $token");
    $req->header('Content-Type' => 'application/json');
    if ($data) {
        $req->content($json->encode($data));
    }
    my $res = $ua->request($req);
    return $json->decode($res->decoded_content);
}

# 1. Login
my $login_res = api_request('POST', '/auth/login', {
    email => 'source@example.com',
    password => 'password123'
});
$token = $login_res->{access};
$company_id = $login_res->{user}{company}{id};

# 2. Configure endpoints
api_request('PUT', '/endpoints/config', {
    httpEndpoint => 'http://localhost:9090',
    grpcEndpoint => 'localhost:51061',
    adapterType => 'grpc'
});

# 3. Test endpoints
api_request('POST', '/endpoints/test', {
    testHttp => 1,
    testGrpc => 1
});

# 4. Import branches from supplier endpoint
api_request('POST', '/sources/import-branches');

# 5. List branches with filters
my $branches = api_request('GET', '/sources/branches?limit=25&offset=0&status=Active');
print "Found " . scalar(@{$branches->{items}}) . " branches\\n";

# 6. Create a new branch
api_request('POST', '/sources/branches', {
    branchCode => 'BR001',
    name => 'Manchester Airport',
    natoLocode => 'GBMAN',
    latitude => 53.3656,
    longitude => -2.2729,
    city => 'Manchester',
    country => 'United Kingdom',
    countryCode => 'GB'
});

# 7. Search UN/LOCODE locations
my $locations = api_request('GET', '/sources/locations/search?query=Manchester&limit=25');
print "Found " . scalar(@{$locations->{items}}) . " locations\\n";

# 8. Add location to coverage
api_request('POST', '/sources/locations', { unlocode => 'GBMAN' });

# 9. Sync location coverage
api_request('POST', "/coverage/source/$company_id/sync");

# 10. Create agreement
my $agreement = api_request('POST', '/agreements', {
    agent_id => 'agent_company_id',
    source_id => $company_id,
    agreement_ref => 'AG-2025-001',
    valid_from => '2025-01-01T00:00:00Z',
    valid_to => '2025-12-31T23:59:59Z'
});

# 11. Offer agreement
api_request('POST', "/agreements/$agreement->{id}/offer");

# 12. Get health status
my $health = api_request('GET', '/health/my-source');
print "Health: " . $json->encode($health) . "\\n";`;

  const errorHandlingCode = `my $res = $ua->request($req);
if ($res->is_error) {
    my $error_data = $json->decode($res->decoded_content);
    print "API Error: " . $error_data->{error} . " - " . $error_data->{message} . "\\n";
    return;
}

my $data = $json->decode($res->decoded_content);`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Perl Quick Start</h2>
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`cpanm LWP::UserAgent JSON`}</pre>
            </div>
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Handle HTTP errors and API responses:</p>
            <CodeBlock code={errorHandlingCode} />
          </div>
        );

      case 'best-practices':
        return (
          <div id="best-practices" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Best Practices</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>Error Handling:</strong> Check HTTP response status codes and handle errors properly</li>
                <li><strong>LWP::UserAgent:</strong> Configure proper timeout and SSL options</li>
                <li><strong>Validation:</strong> Validate input data before API calls</li>
                <li><strong>Idempotency:</strong> Use unique identifiers for branches and agreements</li>
                <li><strong>Resource Management:</strong> Properly handle HTTP responses</li>
                <li><strong>Health Monitoring:</strong> Regularly check endpoint health status</li>
                <li><strong>Branch Mapping:</strong> Map all branches to UN/LOCODEs</li>
                <li><strong>Security:</strong> Store tokens securely and never expose them</li>
                <li><strong>Error Logging:</strong> Use proper logging for debugging</li>
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
              Perl has limited native gRPC server support. Consider using a different language (Node.js, Go, Python, Java) for gRPC server implementation.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
                ⚠️ <strong>Note:</strong> Perl gRPC server implementation is not widely supported. 
                We recommend implementing your gRPC server in Node.js, Go, Python, or Java. See those guides for complete examples.
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                💡 <strong>Alternative:</strong> Consider using a microservice architecture where a separate service (Node.js/Go) handles gRPC 
                and communicates with your Perl application via REST API.
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

export default PerlGuide;

