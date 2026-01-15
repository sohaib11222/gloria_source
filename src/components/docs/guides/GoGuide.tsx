import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface GoGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const GoGuide: React.FC<GoGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
}) => {
  const quickStartCode = `package main

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

func main() {
    API_BASE := "http://localhost:8080"
    var token string
    var companyId string
    
    // 1. Login
    loginData := map[string]string{
        "email":    "source@example.com",
        "password": "password123",
    }
    jsonData, _ := json.Marshal(loginData)
    resp, _ := http.Post(API_BASE+"/auth/login", "application/json", bytes.NewBuffer(jsonData))
    var loginResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&loginResp)
    token = loginResp["access"].(string)
    user := loginResp["user"].(map[string]interface{})
    company := user["company"].(map[string]interface{})
    companyId = company["id"].(string)
    
    // Create HTTP client with auth
    client := &http.Client{Timeout: 30 * time.Second}
    
    // 2. Configure endpoints
    configData := map[string]interface{}{
        "httpEndpoint": "http://localhost:9090",
        "grpcEndpoint": "localhost:51061",
        "adapterType":  "grpc",
    }
    configJson, _ := json.Marshal(configData)
    req, _ := http.NewRequest("PUT", API_BASE+"/endpoints/config", bytes.NewBuffer(configJson))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 3. Test endpoints
    testData, _ := json.Marshal(map[string]bool{"testHttp": true, "testGrpc": true})
    req, _ = http.NewRequest("POST", API_BASE+"/endpoints/test", bytes.NewBuffer(testData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 4. Import branches from supplier endpoint
    req, _ = http.NewRequest("POST", API_BASE+"/sources/import-branches", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 5. List branches with filters
    req, _ = http.NewRequest("GET", API_BASE+"/sources/branches?limit=25&offset=0&status=Active", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    resp, _ = client.Do(req)
    var branchesResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&branchesResp)
    fmt.Println("Branches:", branchesResp["items"])
    
    // 6. Create a new branch
    branchData, _ := json.Marshal(map[string]interface{}{
        "branchCode": "BR001",
        "name":       "Manchester Airport",
        "natoLocode": "GBMAN",
        "latitude":   53.3656,
        "longitude":  -2.2729,
        "city":       "Manchester",
        "country":    "United Kingdom",
        "countryCode": "GB",
    })
    req, _ = http.NewRequest("POST", API_BASE+"/sources/branches", bytes.NewBuffer(branchData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 7. Search UN/LOCODE locations
    req, _ = http.NewRequest("GET", API_BASE+"/sources/locations/search?query=Manchester&limit=25", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 8. Add location to coverage
    locData, _ := json.Marshal(map[string]string{"unlocode": "GBMAN"})
    req, _ = http.NewRequest("POST", API_BASE+"/sources/locations", bytes.NewBuffer(locData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 9. Sync location coverage
    req, _ = http.NewRequest("POST", API_BASE+"/coverage/source/"+companyId+"/sync", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 10. Create agreement
    agreementData := map[string]interface{}{
        "agent_id":       "agent_company_id",
        "source_id":      companyId,
        "agreement_ref":  "AG-2025-001",
        "valid_from":     "2025-01-01T00:00:00Z",
        "valid_to":       "2025-12-31T23:59:59Z",
    }
    agreementJson, _ := json.Marshal(agreementData)
    req, _ = http.NewRequest("POST", API_BASE+"/agreements", bytes.NewBuffer(agreementJson))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    resp, _ = client.Do(req)
    var agreementResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&agreementResp)
    agreementId := agreementResp["id"].(string)
    
    // 11. Offer agreement
    req, _ = http.NewRequest("POST", API_BASE+"/agreements/"+agreementId+"/offer", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 12. Get health status
    req, _ = http.NewRequest("GET", API_BASE+"/health/my-source", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    resp, _ = client.Do(req)
    var healthResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&healthResp)
    fmt.Println("Health:", healthResp)
}`;

  const errorHandlingCode = `resp, err := client.Do(req)
if err != nil {
    fmt.Printf("Request error: %v\\n", err)
    return
}
defer resp.Body.Close()

if resp.StatusCode >= 400 {
    var errorResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&errorResp)
    fmt.Printf("API Error: %s - %s\\n", 
        errorResp["error"], errorResp["message"])
    return
}

var data map[string]interface{}
json.NewDecoder(resp.Body).Decode(&data)`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Go Quick Start</h2>
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`go get github.com/gorilla/http
# or use standard net/http package`}</pre>
            </div>
          </div>
        );

      case 'error-handling':
        return (
          <div id="error-handling" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Error Handling</h2>
            <p>Handle HTTP errors and API responses:</p>
            <CodeBlock code={errorHandlingCode} />
          </div>
        );

      case 'best-practices':
        return (
          <div id="best-practices" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Best Practices</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li><strong>Context:</strong> Always use <code>context.Context</code> for request cancellation and timeouts</li>
                <li><strong>Error Handling:</strong> Return proper Go errors and handle HTTP status codes correctly</li>
                <li><strong>Goroutines:</strong> Use goroutines for concurrent operations but manage them properly</li>
                <li><strong>Connection Pooling:</strong> Reuse HTTP clients with proper timeout configurations</li>
                <li><strong>Validation:</strong> Validate input data before making API calls</li>
                <li><strong>Idempotency:</strong> Use unique identifiers for branches and agreements</li>
                <li><strong>Health Checks:</strong> Monitor endpoint health and implement circuit breakers</li>
                <li><strong>Branch Mapping:</strong> Map all branches to UN/LOCODEs for proper location coverage</li>
                <li><strong>Endpoint Testing:</strong> Test endpoints after configuration changes</li>
                <li><strong>Resource Cleanup:</strong> Always close HTTP response bodies and clean up resources</li>
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
        const goGrpcCode = `package main

import (
    "context"
    "fmt"
    "log"
    "net"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    
    pb "path/to/generated/proto" // Generated from source_provider.proto
)

// Implement SourceProviderService
type sourceProviderServer struct {
    pb.UnimplementedSourceProviderServiceServer
}

// GetHealth implements health check
func (s *sourceProviderServer) GetHealth(ctx context.Context, req *pb.Empty) (*pb.HealthResponse, error) {
    return &pb.HealthResponse{
        Ok:   true,
        Note: "Service is healthy",
    }, nil
}

// GetLocations returns all supported locations
func (s *sourceProviderServer) GetLocations(ctx context.Context, req *pb.Empty) (*pb.LocationsResponse, error) {
    locations := []*pb.Location{
        {Unlocode: "GBMAN", Name: "Manchester Airport"},
        {Unlocode: "GBGLA", Name: "Glasgow Airport"},
        {Unlocode: "GBLHR", Name: "London Heathrow"},
    }
    return &pb.LocationsResponse{Locations: locations}, nil
}

// GetAvailability returns vehicle availability
func (s *sourceProviderServer) GetAvailability(ctx context.Context, req *pb.AvailabilityRequest) (*pb.AvailabilityResponse, error) {
    // Query your inventory system based on req
    vehicles := []*pb.VehicleOffer{
        {
            SupplierOfferRef: fmt.Sprintf("OFFER-%d-1", req.DriverAge),
            VehicleClass:      "ECMN",
            MakeModel:         "Toyota Yaris",
            Currency:          "USD",
            TotalPrice:        45.99,
            AvailabilityStatus: "AVAILABLE",
        },
    }
    return &pb.AvailabilityResponse{Vehicles: vehicles}, nil
}

// CreateBooking creates a new booking
func (s *sourceProviderServer) CreateBooking(ctx context.Context, req *pb.BookingCreateRequest) (*pb.BookingResponse, error) {
    // Check idempotency key, create booking in your system
    supplierBookingRef := fmt.Sprintf("BKG-%d", req.IdempotencyKey)
    return &pb.BookingResponse{
        SupplierBookingRef: supplierBookingRef,
        Status:             "CONFIRMED",
    }, nil
}

// ModifyBooking modifies an existing booking
func (s *sourceProviderServer) ModifyBooking(ctx context.Context, req *pb.BookingRef) (*pb.BookingResponse, error) {
    // Update booking in your system
    return &pb.BookingResponse{
        SupplierBookingRef: req.SupplierBookingRef,
        Status:             "CONFIRMED",
    }, nil
}

// CancelBooking cancels a booking
func (s *sourceProviderServer) CancelBooking(ctx context.Context, req *pb.BookingRef) (*pb.BookingResponse, error) {
    // Cancel booking in your system
    return &pb.BookingResponse{
        SupplierBookingRef: req.SupplierBookingRef,
        Status:             "CANCELLED",
    }, nil
}

// CheckBooking checks booking status
func (s *sourceProviderServer) CheckBooking(ctx context.Context, req *pb.BookingRef) (*pb.BookingResponse, error) {
    // Query booking status from your system
    return &pb.BookingResponse{
        SupplierBookingRef: req.SupplierBookingRef,
        Status:             "CONFIRMED",
    }, nil
}

func main() {
    lis, err := net.Listen("tcp", ":51061")
    if err != nil {
        log.Fatalf("Failed to listen: %v", err)
    }
    
    s := grpc.NewServer()
    pb.RegisterSourceProviderServiceServer(s, &sourceProviderServer{})
    
    log.Println("gRPC server listening on :51061")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("Failed to serve: %v", err)
    }
}`;
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Implement the <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>SourceProviderService</code> interface using Go's native gRPC support.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                ⚠️ <strong>Important:</strong> Generate Go code from the proto file first using <code>protoc</code> with the Go gRPC plugin.
              </p>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Generate Proto Code</h3>
            <CodeBlock code={`# Install protoc and Go plugins
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

# Generate Go code from proto
protoc --go_out=. --go-grpc_out=. source_provider.proto`} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Complete Go gRPC Server</h3>
            <CodeBlock code={goGrpcCode} />
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                💡 <strong>Tip:</strong> Use <code>context.Context</code> for request cancellation and timeouts. Implement proper error handling using gRPC status codes.
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

export default GoGuide;

