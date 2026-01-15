import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface PythonGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const PythonGuide: React.FC<PythonGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
}) => {
  const quickStartCode = `import requests
import json

API_BASE = 'http://localhost:8080'
token = ''
company_id = ''

# Helper function for authenticated requests
def api_request(method, endpoint, data=None):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    url = f'{API_BASE}{endpoint}'
    if method == 'GET':
        return requests.get(url, headers=headers).json()
    elif method == 'POST':
        return requests.post(url, headers=headers, json=data).json()
    elif method == 'PUT':
        return requests.put(url, headers=headers, json=data).json()
    elif method == 'PATCH':
        return requests.patch(url, headers=headers, json=data).json()
    elif method == 'DELETE':
        return requests.delete(url, headers=headers).json()

# 1. Login
login_res = requests.post(f'{API_BASE}/auth/login', json={
    'email': 'source@example.com',
    'password': 'password123'
}).json()
token = login_res['access']
company_id = login_res['user']['company']['id']

# 2. Configure endpoints
api_request('PUT', '/endpoints/config', {
    'httpEndpoint': 'http://localhost:9090',
    'grpcEndpoint': 'localhost:51061',
    'adapterType': 'grpc'
})

# 3. Test endpoints
api_request('POST', '/endpoints/test', {'testHttp': True, 'testGrpc': True})

# 4. Import branches from supplier endpoint
api_request('POST', '/sources/import-branches')

# 5. List branches with filters
branches = api_request('GET', '/sources/branches?limit=25&offset=0&status=Active')
print(f"Found {len(branches['items'])} branches")

# 6. Create a new branch
api_request('POST', '/sources/branches', {
    'branchCode': 'BR001',
    'name': 'Manchester Airport',
    'natoLocode': 'GBMAN',
    'latitude': 53.3656,
    'longitude': -2.2729,
    'city': 'Manchester',
    'country': 'United Kingdom',
    'countryCode': 'GB'
})

# 7. Search UN/LOCODE locations
locations = api_request('GET', '/sources/locations/search?query=Manchester&limit=25')
print(f"Found {len(locations['items'])} locations")

# 8. Add location to coverage
api_request('POST', '/sources/locations', {'unlocode': 'GBMAN'})

# 9. Sync location coverage
api_request('POST', f'/coverage/source/{company_id}/sync')

# 10. Create agreement
agreement = api_request('POST', '/agreements', {
    'agent_id': 'agent_company_id',
    'source_id': company_id,
    'agreement_ref': 'AG-2025-001',
    'valid_from': '2025-01-01T00:00:00Z',
    'valid_to': '2025-12-31T23:59:59Z'
})

# 11. Offer agreement
api_request('POST', f"/agreements/{agreement['id']}/offer")

# 12. Get health status
health = api_request('GET', '/health/my-source')
print(f"Health: {health}")`;

  const errorHandlingCode = `try:
    response = api_request('GET', '/sources/branches')
    print('Branches:', response['items'])
except requests.exceptions.HTTPError as e:
    if e.response.status_code >= 400:
        error_data = e.response.json()
        print(f"API Error: {error_data.get('error')} - {error_data.get('message')}")
except requests.exceptions.RequestException as e:
    print(f"Network Error: {e}")`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Python Quick Start</h2>
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`pip install requests`}</pre>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
              The examples above use the <code>requests</code> library, which is the standard HTTP client for Python.
            </p>
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
                <li><strong>Async/Await:</strong> Use async/await for non-blocking operations (consider using httpx for async HTTP)</li>
                <li><strong>Error Handling:</strong> Handle HTTP errors and API exceptions properly with try/except</li>
                <li><strong>Connection Pooling:</strong> Reuse HTTP sessions for better performance</li>
                <li><strong>Validation:</strong> Validate data before API calls using pydantic or similar</li>
                <li><strong>Idempotency:</strong> Use unique identifiers for branches and agreements</li>
                <li><strong>Health Monitoring:</strong> Regularly check endpoint health status</li>
                <li><strong>Branch Mapping:</strong> Map all branches to UN/LOCODEs</li>
                <li><strong>Resource Management:</strong> Use context managers for proper resource cleanup</li>
                <li><strong>Type Hints:</strong> Use Python type hints for better code maintainability</li>
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
        const pythonGrpcCode = `import grpc
from concurrent import futures
import source_provider_pb2
import source_provider_pb2_grpc

class SourceProviderService(source_provider_pb2_grpc.SourceProviderServiceServicer):
    def GetHealth(self, request, context):
        return source_provider_pb2.HealthResponse(
            ok=True,
            note="Service is healthy"
        )
    
    def GetLocations(self, request, context):
        locations = [
            source_provider_pb2.Location(unlocode="GBMAN", name="Manchester Airport"),
            source_provider_pb2.Location(unlocode="GBGLA", name="Glasgow Airport"),
            source_provider_pb2.Location(unlocode="GBLHR", name="London Heathrow"),
        ]
        return source_provider_pb2.LocationsResponse(locations=locations)
    
    def GetAvailability(self, request, context):
        # Query your inventory system based on request
        vehicles = [
            source_provider_pb2.VehicleOffer(
                supplier_offer_ref=f"OFFER-{request.driver_age}-1",
                vehicle_class="ECMN",
                make_model="Toyota Yaris",
                currency="USD",
                total_price=45.99,
                availability_status="AVAILABLE"
            ),
        ]
        return source_provider_pb2.AvailabilityResponse(vehicles=vehicles)
    
    def CreateBooking(self, request, context):
        # Check idempotency key, create booking in your system
        supplier_booking_ref = f"BKG-{request.idempotency_key}"
        return source_provider_pb2.BookingResponse(
            supplier_booking_ref=supplier_booking_ref,
            status="CONFIRMED"
        )
    
    def ModifyBooking(self, request, context):
        # Update booking in your system
        return source_provider_pb2.BookingResponse(
            supplier_booking_ref=request.supplier_booking_ref,
            status="CONFIRMED"
        )
    
    def CancelBooking(self, request, context):
        # Cancel booking in your system
        return source_provider_pb2.BookingResponse(
            supplier_booking_ref=request.supplier_booking_ref,
            status="CANCELLED"
        )
    
    def CheckBooking(self, request, context):
        # Query booking status from your system
        return source_provider_pb2.BookingResponse(
            supplier_booking_ref=request.supplier_booking_ref,
            status="CONFIRMED"
        )

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    source_provider_pb2_grpc.add_SourceProviderServiceServicer_to_server(
        SourceProviderService(), server
    )
    server.add_insecure_port('[::]:51061')
    server.start()
    print("gRPC server listening on :51061")
    server.wait_for_termination()

if __name__ == '__main__':
    serve()`;
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Implement the <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>SourceProviderService</code> interface using Python's grpcio library.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                ⚠️ <strong>Important:</strong> Generate Python code from the proto file first using <code>protoc</code> with the Python gRPC plugin.
              </p>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Install Dependencies</h3>
            <CodeBlock code={`pip install grpcio grpcio-tools`} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Generate Proto Code</h3>
            <CodeBlock code={`python -m grpc_tools.protoc -I. --python_out=. --grpc_python_out=. source_provider.proto`} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Complete Python gRPC Server</h3>
            <CodeBlock code={pythonGrpcCode} />
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                💡 <strong>Tip:</strong> Use <code>futures.ThreadPoolExecutor</code> for concurrent request handling. Implement proper error handling using gRPC status codes.
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

export default PythonGuide;

