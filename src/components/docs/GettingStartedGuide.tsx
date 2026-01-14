import React, { useState, useEffect } from 'react';
import './docs.css';

const GettingStartedGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    // Set initial active section
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

    // Update active section on scroll
    const handleScroll = () => {
      const sections = [
        'overview',
        'step-1',
        'step-2',
        'step-3',
        'step-4',
        'step-5',
        'step-6',
        'step-7',
        'step-8',
        'best-practices',
        'next-steps',
        'support'
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
    { id: 'step-1', label: 'Account Setup & Configuration', icon: '1️⃣' },
    { id: 'step-2', label: 'Manage Your Branches', icon: '2️⃣' },
    { id: 'step-3', label: 'Implement Your gRPC API', icon: '3️⃣' },
    { id: 'step-4', label: 'Sync Location Coverage', icon: '4️⃣' },
    { id: 'step-5', label: 'Request New Locations', icon: '5️⃣' },
    { id: 'step-6', label: 'Create & Offer Agreements', icon: '6️⃣' },
    { id: 'step-7', label: 'Run Verification', icon: '7️⃣' },
    { id: 'step-8', label: 'Monitor Health & Performance', icon: '8️⃣' },
    { id: 'best-practices', label: 'Best Practices', icon: '✨' },
    { id: 'next-steps', label: 'Next Steps', icon: '🚀' },
    { id: 'support', label: 'Need Help?', icon: '💬' },
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
              onMouseEnter={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }
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
        <h1 id="overview" style={{ scrollMarginTop: '100px' }}>Getting Started Guide for Sources</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '2rem' }}>
          Welcome! This guide will walk you through everything you need to know to start using Gloria Connect as a Source (Car Rental Supplier).
        </p>

        {/* Overview */}
        <section id="overview" style={{ marginBottom: '3rem', padding: '1.5rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem', scrollMarginTop: '100px' }}>
          <h2 style={{ marginTop: 0 }}>What is a Source?</h2>
          <p>
            As a <strong>Source</strong> (Car Rental Supplier), you provide vehicle availability and booking services 
            to Agents (OTAs) through the middleware. You receive availability requests, return offers, and handle bookings.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Your main responsibilities:</strong>
          </p>
          <ul>
            <li>Configure your HTTP and gRPC endpoints</li>
            <li>Manage your branch locations</li>
            <li>Sync location coverage with UN/LOCODEs</li>
            <li>Create and offer agreements to agents</li>
            <li>Handle availability requests and bookings</li>
            <li>Maintain system health and performance</li>
          </ul>
        </section>

        {/* Step 1 */}
        <section id="step-1" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              1
            </div>
            <h2 style={{ margin: 0 }}>Account Setup & Configuration</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Initial Setup</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Register Your Account:</strong> 
                <ul>
                  <li>Navigate to the Source UI registration page</li>
                  <li>Fill in your company name, email, and password</li>
                  <li>Click "Create Account" to register</li>
                  <li>You'll receive an email verification code - verify your email</li>
                </ul>
              </li>
              <li>
                <strong>Wait for Admin Approval:</strong> 
                <ul>
                  <li>After registration, your account status will be <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>PENDING_VERIFICATION</code></li>
                  <li>Your approval status will be <code style={{ backgroundColor: '#fef3c7', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>PENDING</code></li>
                  <li>An administrator will review and approve your account</li>
                  <li>Once approved, your approval status becomes <code style={{ backgroundColor: '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>APPROVED</code></li>
                  <li>Admin will also activate your account (status becomes <code style={{ backgroundColor: '#d1fae5', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>ACTIVE</code>)</li>
                </ul>
              </li>
              <li>
                <strong>Login:</strong> Once approved and activated, log in to the Source UI with your email and password.
              </li>
              <li>
                <strong>Configure Endpoints:</strong> In the Dashboard tab, set your:
                <ul>
                  <li><strong>HTTP Endpoint:</strong> Your supplier adapter HTTP URL (e.g., <code>http://localhost:9090</code>)</li>
                  <li><strong>gRPC Endpoint:</strong> Your supplier adapter gRPC address (e.g., <code>localhost:51061</code>)</li>
                </ul>
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
              <strong>💡 Tip:</strong> Your endpoints must be accessible from the middleware server. Ensure proper network configuration and firewall rules.
            </div>
          </div>
        </section>

        {/* Step 2 */}
        <section id="step-2" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#10b981', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              2
            </div>
            <h2 style={{ margin: 0 }}>Manage Your Branches</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Understanding Branches</h3>
            <p>
              <strong>Branches</strong> are your rental locations (pickup/dropoff points). Each branch needs to be:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Imported from your supplier system or manually created</li>
              <li>Mapped to a UN/LOCODE (United Nations Location Code) for standardization</li>
              <li>Configured with correct location details (address, coordinates, contact info)</li>
            </ul>

            <h3>Preparing Your Supplier Endpoint</h3>
            <p>
              Your supplier HTTP endpoint must return branch data in a specific format. The endpoint will be called with:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Method:</strong> GET</li>
              <li><strong>Header:</strong> <code>Request-Type: LocationRq</code></li>
              <li><strong>Response Format:</strong> JSON with <code>CompanyCode</code> and <code>Branches</code> array</li>
            </ul>

            <h3>Branch Data Format</h3>
            <p>
              Your supplier endpoint must return branches in the following exact format:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "CompanyCode": "CMP00023",
  "Branches": [
    {
      "Branchcode": "BR001",
      "Name": "Manchester Airport",
      "AtAirport": true,
      "LocationType": "Airport",
      "CollectionType": "Pickup",
      "Status": "Active",
      "EmailAddress": "manchester@example.com",
      "Telephone": {
        "attr": {
          "PhoneNumber": "+441612345678"
        }
      },
      "Latitude": 53.3656,
      "Longitude": -2.2729,
      "Address": {
        "AddressLine": {
          "value": "Terminal 1, Manchester Airport"
        },
        "CityName": {
          "value": "Manchester"
        },
        "PostalCode": {
          "value": "M90 1QX"
        },
        "CountryName": {
          "value": "United Kingdom",
          "attr": {
            "Code": "GB"
          }
        }
      },
      "Opening": {
        "Monday": {
          "attr": {
            "Open": "08:00",
            "Closed": "20:00"
          }
        },
        "Tuesday": {
          "attr": {
            "Open": "08:00",
            "Closed": "20:00"
          }
        },
        "Wednesday": {
          "attr": {
            "Open": "08:00",
            "Closed": "20:00"
          }
        },
        "Thursday": {
          "attr": {
            "Open": "08:00",
            "Closed": "20:00"
          }
        },
        "Friday": {
          "attr": {
            "Open": "08:00",
            "Closed": "20:00"
          }
        },
        "Saturday": {
          "attr": {
            "Open": "09:00",
            "Closed": "18:00"
          }
        },
        "Sunday": {
          "attr": {
            "Open": "09:00",
            "Closed": "18:00"
          }
        }
      },
      "NatoLocode": "GBMAN",
      "ReturnInstructions": {
        "attr": {
          "Pickup": "Return to same location"
        }
      }
    }
  ]
}`}
              </pre>
            </div>

            <h3>Required Fields</h3>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
              <p style={{ marginTop: 0, fontWeight: 600 }}>⚠️ All of these fields are REQUIRED:</p>
              <ul style={{ lineHeight: '1.8', marginBottom: 0 }}>
                <li><code>Branchcode</code> - Unique branch identifier</li>
                <li><code>Name</code> - Branch name</li>
                <li><code>AtAirport</code> - Boolean (true/false)</li>
                <li><code>LocationType</code> - e.g., "Airport", "City", "Station"</li>
                <li><code>CollectionType</code> - e.g., "Pickup", "Dropoff", "Both"</li>
                <li><code>EmailAddress</code> - Valid email format</li>
                <li><code>Telephone.attr.PhoneNumber</code> - Must match pattern <code>^\+[0-9]{10,15}$</code> (e.g., +441612345678)</li>
                <li><code>Latitude</code> - Number (decimal degrees)</li>
                <li><code>Longitude</code> - Number (decimal degrees)</li>
                <li><code>Address.AddressLine.value</code> - Street address</li>
                <li><code>Address.CityName.value</code> - City name</li>
                <li><code>Address.PostalCode.value</code> - Postal/ZIP code</li>
                <li><code>Address.CountryName.value</code> - Country name</li>
                <li><code>Address.CountryName.attr.Code</code> - ISO-3166 alpha-2 country code (e.g., "GB", "US")</li>
                <li><code>Opening</code> - All 7 days (Monday-Sunday) with <code>attr.Open</code> and <code>attr.Closed</code> times</li>
              </ul>
            </div>

            <h3>Optional Fields</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>Status</code> - Branch status (e.g., "Active", "Inactive")</li>
              <li><code>NatoLocode</code> - UN/LOCODE (e.g., "GBMAN"). If not provided, you'll need to map it manually after import.</li>
              <li><code>ReturnInstructions.attr.Pickup</code> - Return instructions (required if ReturnInstructions is present)</li>
            </ul>

            <h3>Importing Branches</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Ensure Prerequisites:</strong> Your account must be:
                <ul>
                  <li>Status: <code>ACTIVE</code></li>
                  <li>Approval Status: <code>APPROVED</code></li>
                  <li>Email: Verified</li>
                  <li>HTTP Endpoint: Configured</li>
                  <li>Company Code: Set (assigned by admin)</li>
                </ul>
              </li>
              <li>
                <strong>Go to Branches Tab:</strong> Navigate to the "Branches" section in the sidebar.
              </li>
              <li>
                <strong>Click "Import Branches":</strong> This will:
                <ul>
                  <li>Call your HTTP endpoint with <code>Request-Type: LocationRq</code> header</li>
                  <li>Validate the <code>CompanyCode</code> matches your assigned code</li>
                  <li>Validate each branch against the required format</li>
                  <li>Import or update branches in the database</li>
                </ul>
              </li>
              <li>
                <strong>Verify Import:</strong> Check that all branches were imported correctly. 
                If validation fails, you'll see specific error messages.
              </li>
            </ol>

            <h3>Branch to UN/LOCODE Mapping</h3>
            <p>
              <strong>UN/LOCODE</strong> (United Nations Location Code) is a standardized location identifier 
              used globally (e.g., <code>GBMAN</code> for Manchester, UK). This mapping is critical because:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Agents search for availability using UN/LOCODEs</li>
              <li>Branches without UN/LOCODE mapping won't appear in search results</li>
              <li>It ensures consistency across different suppliers and agents</li>
            </ul>

            <h3>How to Map Branches to UN/LOCODEs</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Find Unmapped Branches:</strong> 
                <ul>
                  <li>Go to the Branches tab</li>
                  <li>Use the filter or search to find branches with empty <code>natoLocode</code></li>
                  <li>Or look for the "Unmapped" indicator in the branch list</li>
                </ul>
              </li>
              <li>
                <strong>Find the Correct UN/LOCODE:</strong>
                <ul>
                  <li>Use the Locations tab to search for locations by city/country</li>
                  <li>UN/LOCODEs follow the pattern: <code>[CountryCode][LocationCode]</code> (e.g., <code>GBMAN</code> = GB + MAN)</li>
                  <li>Common examples: <code>GBLON</code> (London), <code>USNYC</code> (New York), <code>FRPAR</code> (Paris)</li>
                </ul>
              </li>
              <li>
                <strong>Edit the Branch:</strong>
                <ul>
                  <li>Click "Edit" on the branch you want to map</li>
                  <li>Enter the UN/LOCODE in the <code>natoLocode</code> field</li>
                  <li>The system will validate that the UN/LOCODE exists in the database</li>
                  <li>Click "Save" to update</li>
                </ul>
              </li>
              <li>
                <strong>Verify Mapping:</strong> After mapping, the branch will appear in location searches and availability requests.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
              <strong>✅ Important:</strong> 
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, lineHeight: '1.8' }}>
                <li>Branches without UN/LOCODE mapping cannot be used in availability searches</li>
                <li>Always map your branches after import</li>
                <li>If a location doesn't have a UN/LOCODE, you can request it to be added (see Location Requests section)</li>
                <li>You can include <code>NatoLocode</code> in your branch import data to skip manual mapping</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 3 - Implement gRPC API */}
        <section id="step-3" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              3
            </div>
            <h2 style={{ margin: 0 }}>Implement Your gRPC API</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Understanding the gRPC Service</h3>
            <p>
              The middleware calls your gRPC server to get availability, handle bookings, and check health.
              You must implement the <code>SourceProviderService</code> interface defined in the proto file.
            </p>

            <h3>How the Middleware Calls Your API</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Agent searches for availability → Middleware calls your <code>GetAvailability</code> method</li>
              <li>Agent creates booking → Middleware calls your <code>CreateBooking</code> method</li>
              <li>Health checks → Middleware calls your <code>GetHealth</code> method periodically</li>
              <li>Location sync → Middleware calls your <code>GetLocations</code> method</li>
            </ol>

            <h3>Required Proto File</h3>
            <p>
              You need to download the <code>source_provider.proto</code> file to generate your gRPC server code.
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
                  Or use: <code style={{ backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>GET /docs/proto/source_provider.proto</code>
                </span>
              </div>
            </div>
            <p style={{ marginTop: '1rem' }}>
              You must implement these 7 methods:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>GetHealth</code> - Health check (returns status)</li>
              <li><code>GetLocations</code> - Return all supported UN/LOCODEs</li>
              <li><code>GetAvailability</code> - Return vehicle availability for search criteria</li>
              <li><code>CreateBooking</code> - Create a new booking</li>
              <li><code>ModifyBooking</code> - Modify an existing booking</li>
              <li><code>CancelBooking</code> - Cancel an existing booking</li>
              <li><code>CheckBooking</code> - Retrieve booking status</li>
            </ul>

            <h3>Critical: agreement_ref Requirement</h3>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
              <strong>⚠️ REQUIRED:</strong> Every request from the middleware includes an <code>agreement_ref</code> parameter.
              This identifies which agreement (contract) between you and the Agent is being used.
            </div>
            <ul style={{ lineHeight: '1.8', marginTop: '1rem' }}>
              <li><strong>Availability requests:</strong> Include <code>agreement_ref</code> in <code>AvailabilityRequest</code></li>
              <li><strong>Booking requests:</strong> Include <code>agreement_ref</code> in all booking operations</li>
              <li><strong>Use it to:</strong> Determine pricing, availability rules, location coverage for that specific agreement</li>
            </ul>

            <h3>Data Formats</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>UN/LOCODE:</strong> Format <code>[CountryCode][LocationCode]</code> (e.g., <code>GBMAN</code>, <code>USNYC</code>)</li>
              <li><strong>ISO 8601 Dates:</strong> Format <code>YYYY-MM-DDTHH:mm:ssZ</code> (e.g., <code>2024-06-15T10:00:00Z</code>)</li>
              <li><strong>Vehicle Classes:</strong> OTA standard codes (e.g., <code>CDMR</code>, <code>FDAR</code>)</li>
              <li><strong>Currency:</strong> ISO 4217 codes (e.g., <code>GBP</code>, <code>USD</code>)</li>
            </ul>

            <h3>Response Time Requirements</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Target:</strong> Under 3 seconds for most requests</li>
              <li><strong>Timeout:</strong> 120 seconds maximum</li>
              <li><strong>Slow Requests:</strong> Requests over 3 seconds trigger health monitoring</li>
              <li><strong>Strikes:</strong> 3 slow requests = automatic backoff (15 min, 30 min, 1 hour, 2 hours, 4 hours)</li>
            </ul>

            <h3>Implementation Steps</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Download the Proto File:</strong> 
                <ul style={{ marginTop: '0.5rem' }}>
                  <li>Click the download button above, or</li>
                  <li>Use the API endpoint: <code>GET /docs/proto/source_provider.proto</code></li>
                  <li>Save the file as <code>source_provider.proto</code> in your project</li>
                </ul>
              </li>
              <li>
                <strong>Generate Code:</strong> Use your language's gRPC tools to generate client/server code from the proto file
              </li>
              <li>
                <strong>Implement Methods:</strong> Implement all 7 required methods in your gRPC server
              </li>
              <li>
                <strong>Handle agreement_ref:</strong> Ensure every method that receives <code>agreement_ref</code> uses it correctly
              </li>
              <li>
                <strong>Test Locally:</strong> Test your gRPC server before configuring the endpoint in the UI
              </li>
              <li>
                <strong>Configure Endpoint:</strong> Set your gRPC endpoint in the Dashboard (e.g., <code>localhost:51061</code>)
              </li>
              <li>
                <strong>Test Connection:</strong> Use the "Test Connection" button in the Dashboard to verify connectivity
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
              <strong>📖 Next Steps:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, lineHeight: '1.8' }}>
                <li>See the <strong>API Reference</strong> guide for complete endpoint specifications</li>
                <li>See the <strong>SDK Guide</strong> for code examples in your preferred language</li>
                <li>Test your implementation using the gRPC connection test in the Dashboard</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 4 */}
        <section id="step-4" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              4
            </div>
            <h2 style={{ margin: 0 }}>Sync Location Coverage</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Understanding Location Coverage</h3>
            <p>
              <strong>Location Coverage</strong> defines which UN/LOCODE locations your source supports. 
              This is synced from your supplier adapter and mapped to the standard UN/LOCODE format.
            </p>

            <h3>How to Sync Coverage</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Locations Tab:</strong> Navigate to the "Locations" section.
              </li>
              <li>
                <strong>Click "Sync Locations":</strong> This triggers a sync with your supplier adapter.
              </li>
              <li>
                <strong>Wait for Completion:</strong> The sync process maps your supplier locations to UN/LOCODEs.
              </li>
              <li>
                <strong>Verify Coverage:</strong> Check that all your locations are properly mapped.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#faf5ff', border: '1px solid #c084fc', borderRadius: '0.5rem' }}>
              <strong>📍 Note:</strong> Sync should be run whenever you add new locations or update your branch configuration.
            </div>
          </div>
        </section>

        {/* Step 5 */}
        <section id="step-5" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#f59e0b', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              5
            </div>
            <h2 style={{ margin: 0 }}>Request New Locations</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>When to Request Locations</h3>
            <p>
              If you need to add a location that doesn't exist in the UN/LOCODE database, you can request it to be added.
            </p>

            <h3>How to Request a Location</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Location Requests Tab:</strong> Navigate to the "Location Requests" section.
              </li>
              <li>
                <strong>Click "Request New Location":</strong> Fill in the form with:
                <ul>
                  <li>Location name</li>
                  <li>Country code</li>
                  <li>City (optional)</li>
                  <li>Address (optional)</li>
                  <li>IATA code (optional, if airport location)</li>
                  <li>Reason for request</li>
                </ul>
              </li>
              <li>
                <strong>Submit Request:</strong> Your request will be reviewed by an administrator.
              </li>
              <li>
                <strong>Track Status:</strong> Monitor your requests - they can be PENDING, APPROVED, or REJECTED.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
              <strong>⏳ Note:</strong> Location requests require admin approval. You'll be notified when your request is reviewed.
            </div>
          </div>
        </section>

        {/* Step 6 */}
        <section id="step-6" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              6
            </div>
            <h2 style={{ margin: 0 }}>Create & Offer Agreements</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Understanding Agreements</h3>
            <p>
              An <strong>Agreement</strong> is a business contract between you (Source) and an Agent (OTA). 
              You must create and offer an agreement before agents can search for availability or create bookings with you.
            </p>

            <h3>How to Create an Agreement</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Agreements Tab:</strong> Navigate to the "Agreements" section.
              </li>
              <li>
                <strong>Click "Create Agreement":</strong> Fill in:
                <ul>
                  <li>Agent company (select from list)</li>
                  <li>Agreement reference (unique identifier, e.g., <code>AG-2025-001</code>)</li>
                  <li>Valid from date (optional)</li>
                  <li>Valid to date (optional)</li>
                </ul>
              </li>
              <li>
                <strong>Check for Duplicates:</strong> The system will warn if the agreement reference already exists.
              </li>
              <li>
                <strong>Create Draft:</strong> The agreement starts as <code>DRAFT</code> status.
              </li>
              <li>
                <strong>Offer to Agent:</strong> Click "Offer" to send the agreement to the agent. Status changes to <code>OFFERED</code>.
              </li>
              <li>
                <strong>Wait for Acceptance:</strong> Once the agent accepts, status becomes <code>ACTIVE</code>.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
              <strong>⚠️ Important:</strong> Only <code>ACTIVE</code> agreements allow agents to search availability and create bookings.
            </div>
          </div>
        </section>

        {/* Step 7 */}
        <section id="step-7" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#06b6d4', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              7
            </div>
            <h2 style={{ margin: 0 }}>Run Verification</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>What is Verification?</h3>
            <p>
              <strong>Verification</strong> is an automated test that checks if your endpoints are properly configured 
              and responding correctly. It tests:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>HTTP endpoint connectivity</li>
              <li>gRPC endpoint connectivity</li>
              <li>Location listing functionality</li>
              <li>Availability search functionality</li>
              <li>Booking operations (if implemented)</li>
            </ul>

            <h3>How to Run Verification</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Verification Tab:</strong> Navigate to the "Verification" section.
              </li>
              <li>
                <strong>Click "Run Verification":</strong> The system will test all configured endpoints.
              </li>
              <li>
                <strong>Review Results:</strong> Check each test step for pass/fail status and any error messages.
              </li>
              <li>
                <strong>Fix Issues:</strong> If any tests fail, review the error messages and fix your endpoint configuration.
              </li>
              <li>
                <strong>Re-run:</strong> Run verification again after making changes.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#ecfdf5', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
              <strong>✅ Success:</strong> All verification tests must pass before your source can be fully activated and receive requests.
            </div>
          </div>
        </section>

        {/* Step 8 */}
        <section id="step-8" style={{ marginBottom: '2rem', scrollMarginTop: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ 
              width: '3rem', 
              height: '3rem', 
              borderRadius: '50%', 
              backgroundColor: '#6366f1', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1.5rem', 
              fontWeight: 'bold' 
            }}>
              8
            </div>
            <h2 style={{ margin: 0 }}>Monitor Health & Performance</h2>
          </div>
          
          <div style={{ paddingLeft: '4rem' }}>
            <h3>Understanding Health Monitoring</h3>
            <p>
              The system automatically monitors your source's performance and health:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Response Times:</strong> Tracks how fast your endpoints respond</li>
              <li><strong>Error Rates:</strong> Monitors failed requests and errors</li>
              <li><strong>Slow Rate:</strong> Percentage of requests that exceed performance thresholds</li>
              <li><strong>Backoff Levels:</strong> Automatic throttling if performance degrades</li>
            </ul>

            <h3>Viewing Your Health</h3>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Health Tab:</strong> Navigate to the "Health" section.
              </li>
              <li>
                <strong>View Metrics:</strong> See your current health status, slow rate, and sample counts.
              </li>
              <li>
                <strong>Check Exclusion Status:</strong> If your source is excluded due to poor performance, 
                you'll see it here.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
              <strong>⚠️ Warning:</strong> If your source is excluded, agents won't receive availability from you. 
              Contact admin to reset health status if needed.
            </div>
          </div>
        </section>

        {/* Best Practices */}
        <section id="best-practices" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.5rem', scrollMarginTop: '100px' }}>
          <h2 style={{ marginTop: 0 }}>Best Practices</h2>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Endpoint Performance:</strong> Keep your HTTP and gRPC endpoints responsive. 
              Slow responses can lead to automatic exclusion from availability searches.
            </li>
            <li>
              <strong>Location Mapping:</strong> Always map branches to UN/LOCODEs after import. 
              Unmapped branches won't appear in availability searches.
            </li>
            <li>
              <strong>Regular Syncs:</strong> Sync your location coverage regularly, especially after adding new branches.
            </li>
            <li>
              <strong>Agreement Management:</strong> Keep track of agreement validity dates and renew them before expiration.
            </li>
            <li>
              <strong>Error Handling:</strong> Ensure your endpoints return proper error responses. 
              The middleware logs all errors for debugging.
            </li>
            <li>
              <strong>Testing:</strong> Run verification tests regularly to ensure everything is working correctly.
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section id="next-steps" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#ecfdf5', border: '1px solid #86efac', borderRadius: '0.5rem', scrollMarginTop: '100px' }}>
          <h2 style={{ marginTop: 0 }}>Next Steps</h2>
          <ol style={{ lineHeight: '1.8' }}>
            <li>Complete all setup steps above</li>
            <li>Run verification and ensure all tests pass</li>
            <li>Create and offer agreements to agents</li>
            <li>Monitor your health status regularly</li>
            <li>Review the <strong>API Reference</strong> for endpoint details</li>
            <li>Check the <strong>SDK Guide</strong> if you're building integrations</li>
            <li>Contact support if you encounter any issues</li>
          </ol>
        </section>

        {/* Support */}
        <section id="support" style={{ padding: '1.5rem', backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '0.5rem', scrollMarginTop: '100px' }}>
          <h2 style={{ marginTop: 0 }}>Need Help?</h2>
          <p>
            If you have questions or need assistance:
          </p>
          <ul style={{ lineHeight: '1.8' }}>
            <li>Check the <strong>API Reference</strong> for detailed endpoint documentation</li>
            <li>Review the <strong>SDK Guide</strong> for integration examples</li>
            <li>Check your verification results for configuration issues</li>
            <li>Monitor your health status for performance problems</li>
            <li>Contact your system administrator</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default GettingStartedGuide;
