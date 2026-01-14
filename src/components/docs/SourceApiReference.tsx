import React, { useState, useEffect } from 'react';
import './docs.css';

const SourceApiReference: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setActiveSection(hash);
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      setActiveSection('overview');
    }

    const handleScroll = () => {
      const sections = [
        'overview',
        'grpc-service',
        'health-endpoint',
        'locations-endpoint',
        'availability-endpoint',
        'booking-endpoints',
        'data-formats',
        'error-handling',
        'implementation-examples'
      ];

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i]);
        if (section) {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100) {
            setActiveSection(sections[i]);
            window.history.replaceState(null, '', `#${sections[i]}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      setActiveSection(id);
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'grpc-service', label: 'gRPC Service Definition', icon: '🔌' },
    { id: 'health-endpoint', label: 'Health Endpoint', icon: '❤️' },
    { id: 'locations-endpoint', label: 'Locations Endpoint', icon: '📍' },
    { id: 'availability-endpoint', label: 'Availability Endpoint', icon: '🚗' },
    { id: 'booking-endpoints', label: 'Booking Endpoints', icon: '📝' },
    { id: 'data-formats', label: 'Data Formats', icon: '📊' },
    { id: 'error-handling', label: 'Error Handling', icon: '⚠️' },
    { id: 'implementation-examples', label: 'Implementation Examples', icon: '💻' },
  ];

  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      {/* Sidebar */}
      <aside style={{
        width: '280px',
        flexShrink: 0,
        position: 'sticky',
        top: '100px',
        height: 'fit-content',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        padding: '1.5rem',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: 700,
          color: '#4b5563',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 1rem 0',
          paddingBottom: '0.75rem',
          borderBottom: '2px solid #e5e7eb'
        }}>
          Table of Contents
        </h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '0.5rem',
                background: activeSection === item.id
                  ? 'linear-gradient(to right, #dbeafe, #bfdbfe)'
                  : 'transparent',
                color: activeSection === item.id ? '#1e40af' : '#4b5563',
                fontWeight: activeSection === item.id ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                transition: 'all 0.15s',
                boxShadow: activeSection === item.id ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none'
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="docs-main" style={{ flex: 1, maxWidth: '900px', padding: '2rem' }}>
        <h1 id="overview" style={{ scrollMarginTop: '100px' }}>Source API Reference</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
          Complete reference for implementing the Source Provider API that the middleware calls.
        </p>

        {/* Overview */}
        <section id="overview" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>How the Middleware Calls Your API</h2>
          <p>
            The middleware connects to your gRPC server at the endpoint you configure (e.g., <code>localhost:51061</code>).
            When an Agent searches for availability or creates a booking, the middleware:
          </p>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Receives the request from the Agent</li>
            <li>Looks up your configured gRPC endpoint from the database</li>
            <li>Calls your gRPC server using the <code>SourceProviderService</code> interface</li>
            <li>Passes the <code>agreement_ref</code> in every request (REQUIRED)</li>
            <li>Waits for your response (timeout: 120 seconds)</li>
            <li>Returns the response to the Agent</li>
          </ol>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
            <strong>⚠️ Important:</strong> You must implement all required gRPC methods defined in the proto file.
            The middleware will call these methods with specific data formats.
          </div>
        </section>

        {/* gRPC Service Definition */}
        <section id="grpc-service" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>gRPC Service Definition</h2>
          <p>
            You must implement the <code>SourceProviderService</code> interface defined in the proto file.
          </p>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
            <strong>📥 Download Proto File:</strong>
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <a 
                href="/docs/proto/source_provider.proto" 
                download="source_provider.proto"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                <span>⬇️</span>
                <span>Download source_provider.proto</span>
              </a>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                API: <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>GET /docs/proto/source_provider.proto</code>
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`service SourceProviderService {
  rpc GetHealth (Empty) returns (HealthResponse);
  rpc GetLocations (Empty) returns (LocationsResponse);
  rpc GetAvailability (AvailabilityRequest) returns (AvailabilityResponse);
  rpc CreateBooking (BookingCreateRequest) returns (BookingResponse);
  rpc ModifyBooking (BookingRef) returns (BookingResponse);
  rpc CancelBooking (BookingRef) returns (BookingResponse);
  rpc CheckBooking  (BookingRef) returns (BookingResponse);
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Required Methods</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>GetHealth</strong> - Health check endpoint (used for connectivity testing)</li>
            <li><strong>GetLocations</strong> - Return all supported locations (UN/LOCODEs)</li>
            <li><strong>GetAvailability</strong> - Return vehicle availability for search criteria</li>
            <li><strong>CreateBooking</strong> - Create a new booking</li>
            <li><strong>ModifyBooking</strong> - Modify an existing booking</li>
            <li><strong>CancelBooking</strong> - Cancel an existing booking</li>
            <li><strong>CheckBooking</strong> - Retrieve booking status/details</li>
          </ul>
        </section>

        {/* Health Endpoint */}
        <section id="health-endpoint" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>GetHealth Endpoint</h2>
          <p>
            Simple health check endpoint used by the middleware to verify your gRPC server is running.
          </p>

          <h3>Request</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message Empty {}`}
            </pre>
          </div>
          <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
            Empty message - no parameters required
          </p>

          <h3 style={{ marginTop: '1.5rem' }}>Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message HealthResponse {
  bool ok = 1;      // true if healthy
  string note = 2;  // optional status message
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Example Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "ok": true,
  "note": "Service is healthy"
}`}
            </pre>
          </div>
        </section>

        {/* Locations Endpoint */}
        <section id="locations-endpoint" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>GetLocations Endpoint</h2>
          <p>
            Returns all locations (branches) that your source supports. Locations must be in UN/LOCODE format.
          </p>

          <h3>Request</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message Empty {}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message LocationsResponse {
  repeated Location locations = 1;
}

message Location {
  string unlocode = 1;  // UN/LOCODE format (e.g., "GBMAN")
  string name = 2;      // Location name (e.g., "Manchester")
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Example Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "locations": [
    { "unlocode": "GBMAN", "name": "Manchester" },
    { "unlocode": "GBLON", "name": "London" },
    { "unlocode": "USNYC", "name": "New York" }
  ]
}`}
            </pre>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
            <strong>💡 Important:</strong> UN/LOCODEs must be in format: 2-letter country code + 3-character location code (e.g., GBMAN, USNYC).
            The middleware validates these against the UN/LOCODE database.
          </div>
        </section>

        {/* Availability Endpoint */}
        <section id="availability-endpoint" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>GetAvailability Endpoint</h2>
          <p>
            Returns vehicle availability and pricing for the given search criteria. This is called when an Agent searches for vehicles.
          </p>

          <h3>Request</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message AvailabilityRequest {
  string agreement_ref = 1;        // REQUIRED: Agreement reference
  string pickup_unlocode = 2;       // Pickup location (UN/LOCODE)
  string dropoff_unlocode = 3;      // Dropoff location (UN/LOCODE)
  string pickup_iso = 4;            // Pickup date/time (ISO 8601)
  string dropoff_iso = 5;           // Dropoff date/time (ISO 8601)
  int32 driver_age = 6;              // Driver age
  string residency_country = 7;     // Residency country (ISO 3166-1 alpha-2)
  repeated string vehicle_classes = 8; // Vehicle class filters (optional)
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message AvailabilityResponse {
  repeated VehicleOffer vehicles = 1;
}

message VehicleOffer {
  string supplier_offer_ref = 1;    // Your unique offer reference
  string vehicle_class = 2;          // OTA vehicle class code (e.g., "CDMR")
  string make_model = 3;            // Vehicle make/model (e.g., "Ford Focus")
  string currency = 4;               // Currency code (ISO 4217, e.g., "GBP")
  double total_price = 5;            // Total rental price
  string availability_status = 6;    // "AVAILABLE" | "ON_REQUEST" | "SOLD_OUT"
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Example Request</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "agreement_ref": "AGR-2024-001",
  "pickup_unlocode": "GBMAN",
  "dropoff_unlocode": "GBLON",
  "pickup_iso": "2024-06-15T10:00:00Z",
  "dropoff_iso": "2024-06-20T14:00:00Z",
  "driver_age": 30,
  "residency_country": "GB",
  "vehicle_classes": ["CDMR", "FDAR"]
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Example Response</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "vehicles": [
    {
      "supplier_offer_ref": "OFFER-123",
      "vehicle_class": "CDMR",
      "make_model": "Ford Focus",
      "currency": "GBP",
      "total_price": 250.00,
      "availability_status": "AVAILABLE"
    },
    {
      "supplier_offer_ref": "OFFER-124",
      "vehicle_class": "FDAR",
      "make_model": "BMW 3 Series",
      "currency": "GBP",
      "total_price": 450.00,
      "availability_status": "AVAILABLE"
    }
  ]
}`}
            </pre>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
            <strong>⚠️ Critical:</strong> The <code>agreement_ref</code> is REQUIRED and must be included in every request.
            Use it to determine pricing, availability, and location coverage for that specific agreement.
          </div>
        </section>

        {/* Booking Endpoints */}
        <section id="booking-endpoints" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>Booking Endpoints</h2>
          <p>
            All booking operations require the <code>agreement_ref</code> to be included in the request.
          </p>

          <h3>CreateBooking</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message BookingCreateRequest {
  string agreement_ref = 1;         // REQUIRED
  string supplier_offer_ref = 2;    // From availability response
  string agent_booking_ref = 3;     // Optional: Agent's booking reference
  string idempotency_key = 4;       // REQUIRED: Prevents duplicate bookings
}

message BookingResponse {
  string supplier_booking_ref = 1; // Your booking reference
  string status = 2;                // "REQUESTED" | "CONFIRMED" | "CANCELLED" | "FAILED"
}`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>ModifyBooking / CancelBooking / CheckBooking</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`message BookingRef {
  string agreement_ref = 1;         // REQUIRED: Must be sent on every call
  string supplier_booking_ref = 2;  // Your booking reference
}

message BookingResponse {
  string supplier_booking_ref = 1;
  string status = 2;                // Current booking status
}`}
            </pre>
          </div>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
            <strong>⚠️ Critical:</strong> The <code>agreement_ref</code> is REQUIRED in ALL booking operations.
            The middleware will reject requests without it.
          </div>
        </section>

        {/* Data Formats */}
        <section id="data-formats" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>Data Format Requirements</h2>

          <h3>UN/LOCODE Format</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Format:</strong> 2-letter country code + 3-character location code</li>
            <li><strong>Examples:</strong> <code>GBMAN</code> (Manchester, UK), <code>USNYC</code> (New York, USA), <code>FRPAR</code> (Paris, France)</li>
            <li><strong>Validation:</strong> Must match UN/LOCODE database</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>ISO 8601 Date/Time Format</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Format:</strong> <code>YYYY-MM-DDTHH:mm:ssZ</code></li>
            <li><strong>Example:</strong> <code>2024-06-15T10:00:00Z</code></li>
            <li><strong>Timezone:</strong> UTC (Z suffix) or with timezone offset</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Vehicle Class Codes (OTA Standard)</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><code>ECMN</code> - Economy</li>
            <li><code>CDMR</code> - Compact</li>
            <li><code>FDAR</code> - Full Size</li>
            <li><code>SDAR</code> - Standard</li>
            <li><code>FFAR</code> - Full Size Premium</li>
            <li><code>PDAR</code> - Premium</li>
            <li><code>LVAN</code> - Large Van</li>
            <li><code>MVAR</code> - Mini Van</li>
            <li><code>SPAR</code> - Special</li>
            <li><code>STAR</code> - Standard SUV</li>
            <li><code>XCAR</code> - Luxury</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Currency Codes (ISO 4217)</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Format:</strong> 3-letter uppercase code</li>
            <li><strong>Examples:</strong> <code>GBP</code>, <code>USD</code>, <code>EUR</code></li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Country Codes (ISO 3166-1 alpha-2)</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Format:</strong> 2-letter uppercase code</li>
            <li><strong>Examples:</strong> <code>GB</code>, <code>US</code>, <code>FR</code></li>
          </ul>
        </section>

        {/* Error Handling */}
        <section id="error-handling" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>Error Handling</h2>
          <p>
            When your gRPC service encounters an error, return an appropriate gRPC error status code.
          </p>

          <h3>gRPC Status Codes</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><code>OK (0)</code> - Success</li>
            <li><code>INVALID_ARGUMENT (3)</code> - Invalid request parameters</li>
            <li><code>NOT_FOUND (5)</code> - Resource not found (e.g., booking doesn't exist)</li>
            <li><code>PERMISSION_DENIED (7)</code> - Permission denied</li>
            <li><code>UNAVAILABLE (14)</code> - Service temporarily unavailable</li>
            <li><code>INTERNAL (13)</code> - Internal server error</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Response Time Requirements</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Target:</strong> Under 3 seconds for most requests</li>
            <li><strong>Timeout:</strong> 120 seconds maximum</li>
            <li><strong>Slow Requests:</strong> Requests over 3 seconds are tracked and may trigger health monitoring</li>
            <li><strong>Strikes:</strong> 3 slow requests = automatic backoff (15 min, 30 min, 1 hour, 2 hours, 4 hours)</li>
          </ul>

          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
            <strong>⚠️ Performance Warning:</strong> Slow responses will result in your source being temporarily excluded from availability requests.
            Optimize your API performance to avoid backoff.
          </div>
        </section>

        {/* Implementation Examples */}
        <section id="implementation-examples" style={{ marginBottom: '3rem', scrollMarginTop: '100px' }}>
          <h2>Implementation Examples</h2>
          <p>
            Here are example implementations in different languages. See the SDK Guide for complete SDK examples.
          </p>

          <h3>Node.js / TypeScript Example</h3>
          <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
            <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const packageDefinition = protoLoader.loadSync('source_provider.proto');
const proto = grpc.loadPackageDefinition(packageDefinition);

const server = new grpc.Server();

server.addService(proto.source_provider.SourceProviderService.service, {
  GetHealth: (call: any, callback: any) => {
    callback(null, { ok: true, note: 'Service is healthy' });
  },

  GetLocations: (call: any, callback: any) => {
    callback(null, {
      locations: [
        { unlocode: 'GBMAN', name: 'Manchester' },
        { unlocode: 'GBLON', name: 'London' }
      ]
    });
  },

  GetAvailability: (call: any, callback: any) => {
    const { agreement_ref, pickup_unlocode, dropoff_unlocode, 
            pickup_iso, dropoff_iso, driver_age, 
            residency_country, vehicle_classes } = call.request;

    // Use agreement_ref to determine pricing/availability
    // Query your inventory system
    // Return offers

    callback(null, {
      vehicles: [
        {
          supplier_offer_ref: 'OFFER-123',
          vehicle_class: 'CDMR',
          make_model: 'Ford Focus',
          currency: 'GBP',
          total_price: 250.00,
          availability_status: 'AVAILABLE'
        }
      ]
    });
  },

  CreateBooking: (call: any, callback: any) => {
    const { agreement_ref, supplier_offer_ref, 
            agent_booking_ref, idempotency_key } = call.request;

    // Check idempotency_key to prevent duplicates
    // Create booking in your system
    // Return booking reference

    callback(null, {
      supplier_booking_ref: 'BOOKING-789',
      status: 'CONFIRMED'
    });
  },

  // Implement ModifyBooking, CancelBooking, CheckBooking similarly
});

server.bindAsync('0.0.0.0:51061', grpc.ServerCredentials.createInsecure(), 
  (err, port) => {
    if (err) {
      console.error('Failed to start server:', err);
      return;
    }
    server.start();
    console.log('gRPC server listening on port', port);
  }
);`}
            </pre>
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Key Implementation Points</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>Load the proto file: <code>source_provider.proto</code></li>
            <li>Implement all 7 required methods</li>
            <li>Always include <code>agreement_ref</code> in your logic</li>
            <li>Handle idempotency in CreateBooking</li>
            <li>Return proper error codes on failures</li>
            <li>Keep response times under 3 seconds</li>
          </ul>
        </section>

        <div style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
          <h3 style={{ marginTop: 0 }}>Next Steps</h3>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Download the proto file using the link above or API endpoint: <code>GET /docs/proto/source_provider.proto</code></li>
            <li>Implement the gRPC service in your preferred language</li>
            <li>Test your implementation using the gRPC connection test in the Source UI</li>
            <li>Run verification to ensure all endpoints work correctly</li>
            <li>Go live with your first agreement</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SourceApiReference;

