import React from 'react';
import CodeBlock from '../CodeBlock';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

interface JavaGuideProps {
  activeSection: SectionType;
  role?: 'agent' | 'source' | 'admin';
  companyId?: string;
}

const JavaGuide: React.FC<JavaGuideProps> = ({ 
  activeSection, 
  role = 'source',
  companyId = 'YOUR_COMPANY_ID'
}) => {
  const quickStartCode = `import java.net.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;

String API_BASE = "http://localhost:8080";
String token = "";
String companyId = "";

HttpClient client = HttpClient.newHttpClient();
ObjectMapper mapper = new ObjectMapper();

// 1. Login
Map<String, String> loginData = Map.of(
    "email", "source@example.com",
    "password", "password123"
);
HttpRequest loginReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/auth/login"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(loginData)))
    .build();
HttpResponse<String> loginResp = client.send(loginReq, HttpResponse.BodyHandlers.ofString());
Map<String, Object> loginResult = mapper.readValue(loginResp.body(), Map.class);
token = (String) loginResult.get("access");
Map<String, Object> user = (Map<String, Object>) loginResult.get("user");
Map<String, Object> company = (Map<String, Object>) user.get("company");
companyId = (String) company.get("id");

// 2. Configure endpoints
Map<String, Object> configData = Map.of(
    "httpEndpoint", "http://localhost:9090",
    "grpcEndpoint", "localhost:51061",
    "adapterType", "grpc"
);
HttpRequest configReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/endpoints/config"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .PUT(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(configData)))
    .build();
client.send(configReq, HttpResponse.BodyHandlers.ofString());

// 3. Import branches
HttpRequest importReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/import-branches"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(importReq, HttpResponse.BodyHandlers.ofString());

// 4. List branches
HttpRequest branchesReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches?limit=25&offset=0"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
HttpResponse<String> branchesResp = client.send(branchesReq, HttpResponse.BodyHandlers.ofString());
Map<String, Object> branches = mapper.readValue(branchesResp.body(), Map.class);
System.out.println("Branches: " + branches.get("items"));

// 5. Create branch
Map<String, Object> branchData = Map.of(
    "branchCode", "BR001",
    "name", "Manchester Airport",
    "natoLocode", "GBMAN",
    "latitude", 53.3656,
    "longitude", -2.2729,
    "city", "Manchester",
    "country", "United Kingdom",
    "countryCode", "GB"
);
HttpRequest createBranchReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(branchData)))
    .build();
client.send(createBranchReq, HttpResponse.BodyHandlers.ofString());

// 6. Add location to coverage
Map<String, String> locData = Map.of("unlocode", "GBMAN");
HttpRequest addLocReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/locations"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(locData)))
    .build();
client.send(addLocReq, HttpResponse.BodyHandlers.ofString());

// 7. Create agreement
Map<String, Object> agreementData = new HashMap<>();
agreementData.put("agent_id", "agent_company_id");
agreementData.put("source_id", companyId);
agreementData.put("agreement_ref", "AG-2025-001");
agreementData.put("valid_from", "2025-01-01T00:00:00Z");
agreementData.put("valid_to", "2025-12-31T23:59:59Z");
HttpRequest createAgreementReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/agreements"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(agreementData)))
    .build();
HttpResponse<String> agreementResp = client.send(createAgreementReq, HttpResponse.BodyHandlers.ofString());
Map<String, Object> agreement = mapper.readValue(agreementResp.body(), Map.class);
String agreementId = (String) agreement.get("id");

// 8. Offer agreement
HttpRequest offerReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/agreements/" + agreementId + "/offer"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(offerReq, HttpResponse.BodyHandlers.ofString());`;

  const errorHandlingCode = `try {
    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() >= 400) {
        Map<String, Object> errorData = mapper.readValue(response.body(), Map.class);
        System.err.println("API Error: " + errorData.get("error") + " - " + errorData.get("message"));
    }
} catch (IOException e) {
    System.err.println("Network Error: " + e.getMessage());
} catch (InterruptedException e) {
    System.err.println("Request interrupted: " + e.getMessage());
}`;

  const renderSection = () => {
    switch (activeSection) {
      case 'quick-start':
        return (
          <div id="quick-start" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Java Quick Start</h2>
            <CodeBlock code={quickStartCode} />
          </div>
        );

      case 'installation':
        return (
          <div id="installation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`// Use Java 11+ built-in HTTP client
// Add Jackson for JSON:
// Maven:
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.2</version>
</dependency>`}</pre>
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
                <li><strong>CompletableFuture:</strong> Use CompletableFuture for async operations and proper error handling</li>
                <li><strong>Error Handling:</strong> Handle HTTP errors and exceptions with try/catch blocks</li>
                <li><strong>Connection Pooling:</strong> Reuse HTTP clients with connection pooling</li>
                <li><strong>Validation:</strong> Validate input data before API calls</li>
                <li><strong>Idempotency:</strong> Use unique identifiers for branches and agreements</li>
                <li><strong>Resource Management:</strong> Properly close HTTP responses and connections</li>
                <li><strong>Health Monitoring:</strong> Regularly check endpoint health status</li>
                <li><strong>Branch Mapping:</strong> Map all branches to UN/LOCODEs</li>
                <li><strong>Thread Safety:</strong> Ensure thread-safe operations when using shared resources</li>
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
        const javaGrpcCode = `import io.grpc.Server;
import io.grpc.ServerBuilder;
import io.grpc.stub.StreamObserver;
import source.provider.SourceProviderGrpc;
import source.provider.SourceProviderProto.*;

import java.io.IOException;

public class SourceProviderServer {
    private Server server;
    
    static class SourceProviderServiceImpl extends SourceProviderGrpc.SourceProviderServiceImplBase {
        @Override
        public void getHealth(Empty request, StreamObserver<HealthResponse> responseObserver) {
            HealthResponse response = HealthResponse.newBuilder()
                .setOk(true)
                .setNote("Service is healthy")
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void getLocations(Empty request, StreamObserver<LocationsResponse> responseObserver) {
            LocationsResponse response = LocationsResponse.newBuilder()
                .addLocations(Location.newBuilder().setUnlocode("GBMAN").setName("Manchester Airport").build())
                .addLocations(Location.newBuilder().setUnlocode("GBGLA").setName("Glasgow Airport").build())
                .addLocations(Location.newBuilder().setUnlocode("GBLHR").setName("London Heathrow").build())
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void getAvailability(AvailabilityRequest request, StreamObserver<AvailabilityResponse> responseObserver) {
            // Query your inventory system
            VehicleOffer offer = VehicleOffer.newBuilder()
                .setSupplierOfferRef("OFFER-" + request.getDriverAge() + "-1")
                .setVehicleClass("ECMN")
                .setMakeModel("Toyota Yaris")
                .setCurrency("USD")
                .setTotalPrice(45.99)
                .setAvailabilityStatus("AVAILABLE")
                .build();
            
            AvailabilityResponse response = AvailabilityResponse.newBuilder()
                .addVehicles(offer)
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void createBooking(BookingCreateRequest request, StreamObserver<BookingResponse> responseObserver) {
            // Check idempotency key, create booking
            String supplierBookingRef = "BKG-" + request.getIdempotencyKey();
            BookingResponse response = BookingResponse.newBuilder()
                .setSupplierBookingRef(supplierBookingRef)
                .setStatus("CONFIRMED")
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void modifyBooking(BookingRef request, StreamObserver<BookingResponse> responseObserver) {
            BookingResponse response = BookingResponse.newBuilder()
                .setSupplierBookingRef(request.getSupplierBookingRef())
                .setStatus("CONFIRMED")
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void cancelBooking(BookingRef request, StreamObserver<BookingResponse> responseObserver) {
            BookingResponse response = BookingResponse.newBuilder()
                .setSupplierBookingRef(request.getSupplierBookingRef())
                .setStatus("CANCELLED")
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
        
        @Override
        public void checkBooking(BookingRef request, StreamObserver<BookingResponse> responseObserver) {
            BookingResponse response = BookingResponse.newBuilder()
                .setSupplierBookingRef(request.getSupplierBookingRef())
                .setStatus("CONFIRMED")
                .build();
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        }
    }
    
    public void start() throws IOException {
        int port = 51061;
        server = ServerBuilder.forPort(port)
            .addService(new SourceProviderServiceImpl())
            .build()
            .start();
        System.out.println("gRPC server started, listening on " + port);
        
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.err.println("Shutting down gRPC server");
            if (server != null) {
                server.shutdown();
            }
        }));
    }
    
    public void blockUntilShutdown() throws InterruptedException {
        if (server != null) {
            server.awaitTermination();
        }
    }
    
    public static void main(String[] args) throws IOException, InterruptedException {
        SourceProviderServer server = new SourceProviderServer();
        server.start();
        server.blockUntilShutdown();
    }
}`;
        return (
          <div id="grpc-implementation" style={{ scrollMarginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>gRPC Server Implementation</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
              Implement the <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>SourceProviderService</code> interface using Java's gRPC library.
            </p>
            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                ⚠️ <strong>Important:</strong> Generate Java code from the proto file first using <code>protoc</code> with the Java gRPC plugin.
              </p>
            </div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Maven Dependencies</h3>
            <CodeBlock code={`<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-netty-shaded</artifactId>
    <version>1.58.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-protobuf</artifactId>
    <version>1.58.0</version>
</dependency>
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-stub</artifactId>
    <version>1.58.0</version>
</dependency>`} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Generate Proto Code</h3>
            <CodeBlock code={`protoc --java_out=src/main/java --grpc-java_out=src/main/java source_provider.proto`} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Complete Java gRPC Server</h3>
            <CodeBlock code={javaGrpcCode} />
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937', fontWeight: 500 }}>
                💡 <strong>Tip:</strong> Use <code>StreamObserver</code> for async responses. Implement proper error handling using gRPC status codes.
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

export default JavaGuide;

