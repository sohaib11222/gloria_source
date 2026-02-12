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
            to Agents (OTAs) through the Gloria Connect middleware. You receive availability requests, return offers, and handle bookings.
          </p>
          
          <h3 style={{ marginTop: '1.5rem' }}>System Architecture</h3>
          <p>
            Gloria Connect is a <strong>middleware platform</strong> that connects Agents (Online Travel Agencies) with Sources (Car Rental Suppliers). 
            The system acts as a bridge, standardizing communication and handling complex operations like:
          </p>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Protocol Translation:</strong> Converts between HTTP REST, gRPC, and OTA XML formats</li>
            <li><strong>Agreement Management:</strong> Manages business contracts between agents and sources</li>
            <li><strong>Location Standardization:</strong> Maps locations to UN/LOCODE format for consistency</li>
            <li><strong>Health Monitoring:</strong> Tracks performance and automatically manages source availability</li>
            <li><strong>Parallel Processing:</strong> Queries multiple sources simultaneously for faster results</li>
            <li><strong>Error Handling:</strong> Provides robust error handling and retry mechanisms</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>How the System Works</h3>
          <p>
            When an Agent searches for vehicle availability, here's what happens:
          </p>
          <ol style={{ lineHeight: '1.8' }}>
            <li><strong>Agent Submits Request:</strong> Agent frontend sends availability search to middleware</li>
            <li><strong>Middleware Validates:</strong> Checks agreement status, location coverage, and request format</li>
            <li><strong>Middleware Queries Sources:</strong> Calls your gRPC server (and other sources) in parallel</li>
            <li><strong>You Return Offers:</strong> Your gRPC server returns vehicle availability and pricing</li>
            <li><strong>Middleware Aggregates:</strong> Combines results from all sources</li>
            <li><strong>Agent Receives Results:</strong> Agent frontend polls for and displays aggregated offers</li>
            <li><strong>Agent Books:</strong> When agent books, middleware calls your CreateBooking endpoint</li>
          </ol>

          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
            <strong>💡 Key Concept:</strong> The middleware handles all the complexity of routing, protocol conversion, 
            and error handling. You just need to implement a simple gRPC service that responds to availability and booking requests.
          </div>

          <h3 style={{ marginTop: '1.5rem' }}>Your Main Responsibilities</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Configure Endpoints:</strong> Set your HTTP and gRPC endpoint addresses</li>
            <li><strong>Manage Branches:</strong> Import and map your rental locations to UN/LOCODEs</li>
            <li><strong>Implement gRPC API:</strong> Build your gRPC server with 7 required methods</li>
            <li><strong>Sync Location Coverage:</strong> Ensure your locations are properly mapped</li>
            <li><strong>Create Agreements:</strong> Create and offer business contracts to agents</li>
            <li><strong>Handle Requests:</strong> Respond to availability searches and booking requests</li>
            <li><strong>Maintain Performance:</strong> Keep response times under 3 seconds to avoid exclusion</li>
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
              Your supplier endpoint or upload file can use any of these formats. The system validates structure on import/upload:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>JSON</strong> — <code>CompanyCode</code> + <code>Branches</code> array, or OTA <code>OTA_VehLocSearchRS</code> / <code>gloria</code></li>
              <li><strong>OTA XML</strong> — <code>OTA_VehLocSearchRS</code> with <code>VehMatchedLocs</code> / <code>LocationDetail</code></li>
              <li><strong>PHP var_dump</strong> — Same OTA structure output by PHP <code>var_dump()</code> (recommended for PHP endpoints)</li>
              <li><strong>CSV</strong> — Header row + data rows; columns: Branchcode, Name, CountryCode, City, etc. (see sample below)</li>
              <li><strong>Excel</strong> — .xlsx/.xls with same column layout as CSV (first row = headers)</li>
            </ul>
            <p>
              Configure <strong>Response / file format</strong> and <strong>Default country code</strong> in Source → Branches → Configure Branch Import Endpoint. For CSV/Excel, use the default country when a row has no country.
            </p>

            <h4 style={{ marginTop: '1.5rem' }}>Format 1: JSON Format (Standard)</h4>
            <p>
              Standard JSON format with <code>CompanyCode</code> and <code>Branches</code> array:
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

            <h4 style={{ marginTop: '1.5rem' }}>Format 2: XML Format (OTA Standard)</h4>
            <p>
              XML format following OTA (Open Travel Alliance) standards. Note that child elements should be structured properly:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`<?xml version="1.0" encoding="UTF-8"?>
<OTA_VehLocSearchRS 
  xmlns="http://www.opentravel.org/OTA/2003/05"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opentravel.org/OTA/2003/05 OTA_VehLocSearchRS.xsd"
  TimeStamp="2025-04-28T10:30:45"
  Target="Production"
  Version="1.00">
  <Success/>
  <RentalBrand>RightCars</RentalBrand>
  <VehMatchedLocs>
    <VehMatchedLoc>
      <LocationDetail 
        BranchType="BR001"
        AtAirport="true"
        LocationType="Airport"
        Code="BR001"
        Brand="RightCars"
        Name="Manchester Airport"
        Latitude="53.3656"
        Longitude="-2.2729">
        <Address>
          <AddressLine>Terminal 1, Manchester Airport</AddressLine>
          <CityName>Manchester</CityName>
          <PostalCode>M90 1QX</PostalCode>
          <Country>
            <CountryCode>GB</CountryCode>
          </Country>
        </Address>
        <Telephone PhoneNumber="+441612345678"/>
        <Opening>
          <Monday Open="08:00" Closed="20:00"/>
          <Tuesday Open="08:00" Closed="20:00"/>
          <Wednesday Open="08:00" Closed="20:00"/>
          <Thursday Open="08:00" Closed="20:00"/>
          <Friday Open="08:00" Closed="20:00"/>
          <Saturday Open="09:00" Closed="18:00"/>
          <Sunday Open="09:00" Closed="18:00"/>
        </Opening>
        <PickupInstructions Pickup="Return to same location"/>
      </LocationDetail>
    </VehMatchedLoc>
  </VehMatchedLocs>
</OTA_VehLocSearchRS>`}
              </pre>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Note:</strong> In XML format, <code>Country</code> should have <code>CountryCode</code> as a child element, 
              not as an attribute. The structure should be: <code>&lt;Country&gt;&lt;CountryCode&gt;GB&lt;/CountryCode&gt;&lt;/Country&gt;</code>
            </p>

            <h4 style={{ marginTop: '1.5rem' }}>Format 3: PHP var_dump with "gloria" Structure (Recommended)</h4>
            <p>
              For PHP-based suppliers, you can return data in PHP <code>var_dump</code> format using the <strong>"gloria"</strong> structure. 
              This format is recommended as it provides better compatibility and is easier to parse:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
{`array(1) {
  ["gloria"]=>
  array(4) {
    ["attr"]=>
    array(6) {
      ["xmlns"]=>
      string(37) "http://www.opentravel.org/OTA/2003/05"
      ["xmlns:xsi"]=>
      string(41) "http://www.w3.org/2001/XMLSchema-instance"
      ["xsi:schemaLocation"]=>
      string(60) "http://www.opentravel.org/OTA/2003/05 OTA_VehLocSearchRS.xsd"
      ["TimeStamp"]=>
      string(19) "2025-04-28T10:30:45"
      ["Target"]=>
      string(10) "Production"
      ["Version"]=>
      string(4) "1.00"
    }
    ["Success"]=>
    array(0) {
    }
    ["RentalBrand"]=>
    array(1) {
      ["value"]=>
      string(9) "RightCars"
    }
    ["VehMatchedLocs"]=>
    array(2) {
      [0]=>
      array(1) {
        ["VehMatchedLoc"]=>
        array(1) {
          ["LocationDetail"]=>
          array(6) {
            ["attr"]=>
            array(8) {
              ["BranchType"]=>
              string(6) "BR001"
              ["AtAirport"]=>
              string(4) "true"
              ["LocationType"]=>
              string(15) "Outside Airport"
              ["Code"]=>
              string(6) "BR001"
              ["Brand"]=>
              string(9) "RightCars"
              ["Name"]=>
              string(13) "Manchester Airport"
              ["Latitude"]=>
              string(9) "53.3656"
              ["Longitude"]=>
              string(9) "-2.2729"
            }
            ["Address"]=>
            array(4) {
              ["AddressLine"]=>
              array(1) {
                ["value"]=>
                string(30) "Terminal 1, Manchester Airport"
              }
              ["CityName"]=>
              array(1) {
                ["value"]=>
                string(10) "Manchester"
              }
              ["PostalCode"]=>
              array(1) {
                ["value"]=>
                string(7) "M90 1QX"
              }
              ["CountryName"]=>
              array(2) {
                ["value"]=>
                string(14) "United Kingdom"
                ["attr"]=>
                array(1) {
                  ["Code"]=>
                  string(2) "GB"
                }
              }
            }
            ["Telephone"]=>
            array(1) {
              ["attr"]=>
              array(1) {
                ["PhoneNumber"]=>
                string(13) "+441612345678"
              }
            }
            ["Opening"]=>
            array(7) {
              ["monday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 08:00 - 20:00 "
                }
              }
              ["tuesday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 08:00 - 20:00 "
                }
              }
              ["wednesday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 08:00 - 20:00 "
                }
              }
              ["thursday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 08:00 - 20:00 "
                }
              }
              ["friday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 08:00 - 20:00 "
                }
              }
              ["saturday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 09:00 - 18:00 "
                }
              }
              ["sunday"]=>
              array(1) {
                ["attr"]=>
                array(1) {
                  ["Open"]=>
                  string(16) ": 09:00 - 18:00 "
                }
              }
            }
            ["PickupInstructions"]=>
            array(1) {
              ["attr"]=>
              array(1) {
                ["Pickup"]=>
                string(30) "Return to same location"
              }
            }
          }
        }
      }
    }
  }
}`}
              </pre>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
              <strong>💡 Key Points:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, lineHeight: '1.8' }}>
                <li>Use <strong>"gloria"</strong> as the root key instead of "OTA_VehLocSearchRS" (recommended by client)</li>
                <li>The <code>["attr"]</code> array contains namespace information, timestamp, target, and version</li>
                <li><code>["Success"]</code> is an empty array</li>
                <li><code>["RentalBrand"]</code> contains <code>["value"]</code> with your brand name</li>
                <li><code>["VehMatchedLocs"]</code> is an array of location entries</li>
                <li>Each location has <code>["LocationDetail"]</code> with <code>["attr"]</code> containing branch details</li>
                <li>Opening hours can use combined format like <code>": 08:00 - 20:00 "</code> (start and end time in one field)</li>
              </ul>
            </div>

            <h4 style={{ marginTop: '1.5rem' }}>Format 4: CSV (Standard columns)</h4>
            <p>
              For CSV files or endpoints returning CSV, use a header row (first line) then one branch per row. Column names are case-insensitive. Set <strong>Default country code</strong> in Configure Branch Endpoint if rows lack a country.
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`Branchcode,Name,CountryCode,Country,City,AddressLine,PostalCode,Latitude,Longitude,AtAirport,LocationType,Phone,Email
BR001,Airport Branch,GB,United Kingdom,Manchester,123 Main St,M1 1AA,53.3656,-2.2729,true,AIRPORT,+441234567890,branch@example.com
BR002,City Branch,GB,United Kingdom,London,456 High St,SW1A 1AA,51.5074,-0.1278,false,CITY,+442071234567,city@example.com`}
              </pre>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
              <strong>Accepted column aliases:</strong> <code>Code</code> / <code>Branchcode</code>, <code>CityName</code> / <code>City</code>, <code>AddressLine</code> / <code>Address</code>, <code>Phone</code> / <code>Telephone</code>, <code>Email</code> / <code>EmailAddress</code>, <code>Lat</code> / <code>Latitude</code>, <code>Lon</code> / <code>Longitude</code>.
            </p>

            <h4 style={{ marginTop: '1.5rem' }}>Format 5: Excel (.xlsx / .xls)</h4>
            <p>
              Same structure as CSV: first row = headers, one branch per row. Use the same column names (Branchcode, Name, CountryCode, City, AddressLine, Latitude, Longitude, AtAirport, Phone, Email, etc.). Upload via <strong>Upload File</strong>; the system parses the first sheet.
            </p>

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
            <p>
              The middleware uses an <strong>adapter pattern</strong> to communicate with sources. When you configure your 
              gRPC endpoint, the middleware automatically selects the appropriate adapter:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>gRPC Adapter (Real gRPC):</strong> Used when <code>grpcEndpoint</code> is in <code>host:port</code> format (e.g., <code>localhost:51061</code>)</li>
              <li><strong>HTTP Adapter:</strong> Used when <code>httpEndpoint</code> is configured (e.g., <code>http://localhost:9090</code>)</li>
              <li><strong>Mock Adapter:</strong> Fallback when no adapter is configured (for testing only)</li>
            </ul>
            
            <p style={{ marginTop: '1rem' }}>
              <strong>Request Flow:</strong>
            </p>
            <ol style={{ lineHeight: '1.8' }}>
              <li><strong>Agent searches for availability</strong> → Middleware calls your <code>GetAvailability</code> method</li>
              <li><strong>Agent creates booking</strong> → Middleware calls your <code>CreateBooking</code> method</li>
              <li><strong>Health checks</strong> → Middleware calls your <code>GetHealth</code> method periodically</li>
              <li><strong>Location sync</strong> → Middleware calls your <code>GetLocations</code> method</li>
              <li><strong>Booking operations</strong> → Middleware calls <code>ModifyBooking</code>, <code>CancelBooking</code>, or <code>CheckBooking</code></li>
            </ol>

            <h3 style={{ marginTop: '1.5rem' }}>Complete Availability Flow</h3>
            <p>
              Here's the detailed flow when an agent searches for availability:
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>
{`1. Agent Frontend
   └─> POST /availability/submit
       { pickup_unlocode: "FRPAR", dropoff_unlocode: "FRPAR", ... }

2. Middleware API Route
   └─> Validates request
   └─> Resolves agent_id and agreement_refs
   └─> Calls gRPC Submit()

3. gRPC Submit Handler
   └─> Creates AvailabilityJob
   └─> Finds eligible agreements (ACTIVE status)
   └─> Checks location coverage per agreement
   └─> Filters excluded sources (health check)
   └─> Fan-out to source adapters (parallel)

4. Source Adapter (Your gRPC Server)
   └─> Calls GetAvailability() with:
       - agreement_ref (REQUIRED)
       - pickup_unlocode, dropoff_unlocode
       - pickup_iso, dropoff_iso
       - driver_age, residency_country
       - vehicle_classes (optional)
   └─> Returns VehicleOffer[] array

5. Middleware Stores Results
   └─> Stores offers in AvailabilityResult table
   └─> Marks job as COMPLETE
   └─> Returns request_id to agent

6. Agent Frontend Polls
   └─> GET /availability/poll?requestId=...&sinceSeq=0
   └─> Receives incremental offers
   └─> Displays results to user`}
              </pre>
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>OTA Availability (HTTP Endpoint)</h3>
            <p>
              If you use an <strong>HTTP endpoint</strong> for availability (instead of gRPC), the middleware supports two modes:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>JSON request:</strong> By default, the middleware POSTs a JSON body to <code>your-http-endpoint/availability</code> with criteria (PickupLocation, DropOffLocation, PickupDateTime, etc.). Your endpoint returns either a flat array of offers or an <strong>OTA VehAvailRS-style</strong> JSON structure.</li>
              <li><strong>OTA XML request:</strong> If your source is configured with <code>useOtaAvailabilityXml</code> (e.g. for endpoints like <code>pricetest2.php</code>), the middleware sends an <strong>OTA_VehAvailRateRQ</strong> XML body (PickUpDateTime, ReturnDateTime, PickUpLocation, ReturnLocation, DriverType Age, Customer CitizenCountryName). Your endpoint should accept this XML and return availability.</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              <strong>Rich OTA response (VehAvailRS):</strong> If your HTTP endpoint returns a full <strong>OTA VehAvailRS</strong> structure (e.g. <code>VehAvailRSCore</code> with <code>VehVendorAvails</code> → <code>VehAvail</code> array), the middleware automatically parses it and passes through rich data to agents:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>VehTerms (Included / NotIncluded: insurance, CDW, etc.)</li>
              <li>VehicleCharges and TotalCharge (prices, tax, currency)</li>
              <li>PricedEquips (child seats, GPS, etc.)</li>
              <li>PictureURL, DoorCount, Baggage, VehicleCategory (ACRISS)</li>
              <li>PickUp/Return location details (name, address, city, phone, coordinates)</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              Response format: return <strong>JSON</strong> that matches the OTA structure (e.g. root with <code>VehAvailRSCore</code>, <code>VehRentalCore</code>, <code>VehVendorAvails.VehVendorAvail.VehAvails.VehAvail</code> array). Each <code>VehAvail</code> can include <code>VehAvailCore</code>, <code>Vehicle</code> (VehMakeModel with Name/PictureURL, VehType with DoorCount/Baggage), <code>VehTerms</code>, <code>RentalRate</code>, <code>VehicleCharges</code>, <code>TotalCharge</code>, <code>PricedEquips</code>.
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0f9ff', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
              <strong>Configuration:</strong> To have the middleware send <strong>OTA_VehAvailRateRQ</strong> XML to your HTTP availability URL, your source must be configured with <code>useOtaAvailabilityXml: true</code> and optionally <code>availabilityRequestorId</code> (default <code>1000097</code>). This is typically set in the backend/admin for your company. Ask your administrator if your endpoint expects OTA XML (e.g. pricetest2.php-style APIs).
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Complete Booking Flow</h3>
            <p>
              Here's the detailed flow when an agent creates a booking:
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>
{`1. Agent Frontend
   └─> POST /bookings
       Headers: { Idempotency-Key: "booking-123..." }
       Body: { agreement_ref, supplier_offer_ref, ... }

2. Middleware API Route
   └─> Validates request
   └─> Checks Idempotency-Key header (REQUIRED)
   └─> Resolves agreement → source_id
   └─> Calls gRPC Create()

3. gRPC Create Handler
   └─> Validates agreement is ACTIVE
   └─> Checks idempotency (prevents duplicates)
   └─> Gets source adapter
   └─> Calls adapter.bookingCreate()

4. Source Adapter (Your gRPC Server)
   └─> Calls CreateBooking() with:
       - agreement_ref (REQUIRED)
       - supplier_offer_ref (REQUIRED)
       - idempotency_key (REQUIRED)
       - agent_booking_ref (optional)
   └─> Returns BookingResponse:
       - supplier_booking_ref
       - status (REQUESTED/CONFIRMED/etc)

5. Middleware Stores Booking
   └─> Creates Booking record in database
   └─> Records audit log
   └─> Returns booking to agent

6. Agent Frontend
   └─> Receives booking confirmation
   └─> Displays booking details`}
              </pre>
            </div>

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
              <li><code>GetAvailability</code> - Return vehicle availability for search criteria. <code>VehicleOffer</code> supports optional rich OTA fields: <code>picture_url</code>, <code>door_count</code>, <code>baggage</code>, <code>vehicle_category</code>, <code>veh_id</code>, and <code>ota_vehicle_json</code> (JSON blob for VehTerms, VehicleCharges, PricedEquips) so agents receive full pricing and terms.</li>
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
            <p style={{ marginTop: '1rem' }}>
              <strong>What is an Agreement?</strong> An agreement is a business contract between you (Source) and an Agent (OTA). 
              It defines the terms of your partnership, including:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Pricing rules and commission rates</li>
              <li>Location coverage (which locations are included)</li>
              <li>Vehicle availability rules</li>
              <li>Booking terms and conditions</li>
              <li>Validity dates (start and end dates)</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              <strong>Why is agreement_ref Required?</strong>
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Different Pricing:</strong> You may have different rates for different agents</li>
              <li><strong>Location Coverage:</strong> Some agreements may only cover specific locations</li>
              <li><strong>Business Rules:</strong> Each agreement may have different terms and conditions</li>
              <li><strong>Audit Trail:</strong> Tracks which agreement was used for each transaction</li>
            </ul>
            <p style={{ marginTop: '1rem' }}>
              <strong>How to Use agreement_ref:</strong>
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Availability requests:</strong> Include <code>agreement_ref</code> in <code>AvailabilityRequest</code> - use it to determine pricing and availability rules</li>
              <li><strong>Booking requests:</strong> Include <code>agreement_ref</code> in all booking operations - use it to validate the booking is allowed under that agreement</li>
              <li><strong>Implementation:</strong> Store agreement details in your system and look them up by <code>agreement_ref</code> when processing requests</li>
            </ul>

            <h3>Data Formats</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>UN/LOCODE:</strong> Format <code>[CountryCode][LocationCode]</code> (e.g., <code>GBMAN</code>, <code>USNYC</code>)</li>
              <li><strong>ISO 8601 Dates:</strong> Format <code>YYYY-MM-DDTHH:mm:ssZ</code> (e.g., <code>2024-06-15T10:00:00Z</code>)</li>
              <li><strong>Vehicle Classes:</strong> OTA standard codes (e.g., <code>CDMR</code>, <code>FDAR</code>)</li>
              <li><strong>Currency:</strong> ISO 4217 codes (e.g., <code>GBP</code>, <code>USD</code>)</li>
            </ul>

            <h3>Response Time Requirements & Health Monitoring</h3>
            <p>
              The middleware automatically monitors your source's performance and health. Understanding this system 
              is critical for maintaining good service levels.
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Target Response Time:</strong> Under 3 seconds for most requests</li>
              <li><strong>Maximum Timeout:</strong> 120 seconds - requests exceeding this will timeout</li>
              <li><strong>Slow Request Threshold:</strong> Requests over 3 seconds are marked as "slow"</li>
              <li><strong>Health Monitoring:</strong> The system tracks:
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <li>Response latency (average, p50, p95, p99)</li>
                  <li>Success rate (percentage of successful requests)</li>
                  <li>Slow rate (percentage of requests over 3 seconds)</li>
                  <li>Error rate (percentage of failed requests)</li>
                </ul>
              </li>
              <li><strong>Automatic Backoff System:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  <li>3 slow requests = 15 minute backoff</li>
                  <li>More slow requests = 30 min, 1 hour, 2 hours, 4 hours</li>
                  <li>During backoff, your source is temporarily excluded from availability searches</li>
                  <li>Backoff automatically clears after the timeout period</li>
                </ul>
              </li>
              <li><strong>Exclusion:</strong> If your source is excluded, agents won't receive availability from you until health improves</li>
            </ul>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
              <strong>⚠️ Critical:</strong> Slow responses will result in your source being temporarily excluded from availability requests. 
              Optimize your API performance to keep response times under 3 seconds. Monitor your health status regularly in the Health tab.
            </div>

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
              You can sync locations from your supplier adapter via gRPC, or import them directly from an HTTP endpoint.
            </p>

            <h3>Method 1: Import Locations from HTTP Endpoint</h3>
            <p>
              You can configure a location import endpoint that returns location data in JSON or XML format. 
              This is similar to branch import but for UN/LOCODE locations.
            </p>

            <h4 style={{ marginTop: '1.5rem' }}>Preparing Your Location Endpoint</h4>
            <p>
              Your supplier HTTP endpoint must return location data in a supported format. The endpoint will be called with:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Method:</strong> GET</li>
              <li><strong>Header:</strong> <code>Request-Type: LocationRq</code></li>
              <li><strong>Response Format:</strong> JSON, XML, or OTA_VehLocSearchRS format (same structure as branch imports)</li>
            </ul>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem' }}>
              <strong>✅ Compatibility:</strong> If you're already using the OTA_VehLocSearchRS format for branch imports, 
              you can use the exact same endpoint and format for location imports. The system automatically detects and extracts location data from the OTA structure.
            </div>

            <h4 style={{ marginTop: '1.5rem' }}>Location Data Format</h4>
            <p>
              Your endpoint can return locations in <strong>JSON</strong>, <strong>XML</strong>, or <strong>OTA_VehLocSearchRS</strong> format 
              (same structure as branch imports). The system supports multiple formats for maximum compatibility.
            </p>

            <h5 style={{ marginTop: '1rem' }}>Format 1: JSON Format (Simple - Recommended for New Implementations)</h5>
            <p>
              JSON format with <code>Locations</code> array, <code>items</code> array, or direct array:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`{
  "Locations": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    },
    {
      "unlocode": "GBLON",
      "country": "GB",
      "place": "London",
      "iataCode": "LHR",
      "latitude": 51.5074,
      "longitude": -0.1278
    }
  ]
}

// OR alternative JSON format:
{
  "items": [
    {
      "unlocode": "GBMAN",
      "country": "GB",
      "place": "Manchester",
      "iataCode": "MAN",
      "latitude": 53.3656,
      "longitude": -2.2729
    }
  ]
}

// OR simple array:
[
  {
    "unlocode": "GBMAN",
    "country": "GB",
    "place": "Manchester",
    "iataCode": "MAN",
    "latitude": 53.3656,
    "longitude": -2.2729
  }
]`}
              </pre>
            </div>

            <h5 style={{ marginTop: '1.5rem' }}>Format 2: XML Format (Also Supported)</h5>
            <p>
              XML format with <code>Locations</code> root element:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0 }}>
{`<?xml version="1.0" encoding="UTF-8"?>
<Locations>
  <Location>
    <unlocode>GBMAN</unlocode>
    <country>GB</country>
    <place>Manchester</place>
    <iataCode>MAN</iataCode>
    <latitude>53.3656</latitude>
    <longitude>-2.2729</longitude>
  </Location>
  <Location>
    <unlocode>GBLON</unlocode>
    <country>GB</country>
    <place>London</place>
    <iataCode>LHR</iataCode>
    <latitude>51.5074</latitude>
    <longitude>-0.1278</longitude>
  </Location>
</Locations>`}
              </pre>
            </div>

            <h5 style={{ marginTop: '1.5rem' }}>Format 3: OTA_VehLocSearchRS Format (Same as Branch Import - Recommended for Existing Systems)</h5>
            <p>
              If you're already using the OTA_VehLocSearchRS format for branch imports, you can use the same format for location imports. 
              This format is automatically detected and locations are extracted from the <code>VehMatchedLocs</code> structure.
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.875rem', margin: 0, lineHeight: '1.4' }}>
{`{
  "OTA_VehLocSearchRS": {
    "VehMatchedLocs": [
      {
        "VehMatchedLoc": {
          "LocationDetail": {
            "attr": {
              "Code": "DXBA02",
              "Name": "Dubai Airport",
              "Latitude": "25.228005",
              "Longitude": "55.364241"
            },
            "Address": {
              "CountryName": {
                "attr": {
                  "Code": "AE"
                }
              }
            },
            "NatoLocode": "AEDXB"  // Optional: explicit UN/LOCODE
          }
        }
      }
    ]
  }
}`}
              </pre>
            </div>

            <h5 style={{ marginTop: '1.5rem' }}>Format 4: PHP var_dump with OTA_VehLocSearchRS (Also Supported)</h5>
            <p>
              For PHP-based suppliers, you can return location data in PHP <code>var_dump</code> format using the <strong>OTA_VehLocSearchRS</strong> structure, 
              exactly the same as branch imports:
            </p>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#1e293b', borderRadius: '0.5rem', overflow: 'auto' }}>
              <pre style={{ color: '#e2e8f0', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
{`array(1) {
  ["OTA_VehLocSearchRS"]=> array(4) {
    ["VehMatchedLocs"]=> array(2) {
      [0]=> array(1) {
        ["VehMatchedLoc"]=> array(1) {
          ["LocationDetail"]=> array(6) {
            ["attr"]=> array(8) {
              ["Code"]=> string(6) "DXBA02"
              ["Name"]=> string(13) "Dubai Airport"
              ["Latitude"]=> string(9) "25.228005"
              ["Longitude"]=> string(9) "55.364241"
            }
            ["Address"]=> array(4) {
              ["CountryName"]=> array(2) {
                ["value"]=> string(20) "UNITED ARAB EMIRATES"
                ["attr"]=> array(1) {
                  ["Code"]=> string(2) "AE"
                }
              }
            }
            ["NatoLocode"]=> string(5) "AEDXB"  // Optional: explicit UN/LOCODE
          }
        }
      }
    }
  }
}`}
              </pre>
            </div>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
              <strong>💡 Key Points for OTA Format:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, lineHeight: '1.8' }}>
                <li>Use the same <strong>OTA_VehLocSearchRS</strong> structure as branch imports</li>
                <li>Locations are extracted from <code>VehMatchedLocs[].VehMatchedLoc.LocationDetail</code></li>
                <li><code>NatoLocode</code> field is optional - if not provided, UN/LOCODE is derived from country code + location identifier</li>
                <li>Country code is extracted from <code>Address.CountryName.attr.Code</code></li>
                <li>Location name is extracted from <code>LocationDetail.attr.Name</code></li>
                <li>Coordinates are extracted from <code>LocationDetail.attr.Latitude</code> and <code>LocationDetail.attr.Longitude</code></li>
                <li>If <code>NatoLocode</code> is not provided, the system will derive it as: <code>[CountryCode][Last3CharsOfCode]</code></li>
              </ul>
            </div>

            <h4 style={{ marginTop: '1.5rem' }}>Required Fields</h4>
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem' }}>
              <p style={{ marginTop: 0, fontWeight: 600 }}>⚠️ Required Field:</p>
              <ul style={{ lineHeight: '1.8', marginBottom: 0 }}>
                <li><code>unlocode</code> - UN/LOCODE identifier (e.g., "GBMAN", "USNYC"). <strong>This is REQUIRED.</strong></li>
                <li style={{ marginTop: '0.5rem' }}><strong>For OTA Format:</strong> If <code>NatoLocode</code> is not provided, the system will automatically derive the UN/LOCODE from the country code and location identifier. However, it's recommended to provide <code>NatoLocode</code> explicitly when available.</li>
              </ul>
            </div>

            <h4 style={{ marginTop: '1.5rem' }}>Optional Fields</h4>
            <ul style={{ lineHeight: '1.8' }}>
              <li><code>country</code> - 2-letter country code (e.g., "GB", "US"). For OTA format, extracted from <code>Address.CountryName.attr.Code</code></li>
              <li><code>place</code> - Location name (e.g., "Manchester", "New York"). For OTA format, extracted from <code>LocationDetail.attr.Name</code></li>
              <li><code>iataCode</code> - IATA airport code (e.g., "MAN", "LHR")</li>
              <li><code>latitude</code> - Decimal degrees (e.g., 53.3656). For OTA format, extracted from <code>LocationDetail.attr.Latitude</code></li>
              <li><code>longitude</code> - Decimal degrees (e.g., -2.2729). For OTA format, extracted from <code>LocationDetail.attr.Longitude</code></li>
              <li><code>NatoLocode</code> - Explicit UN/LOCODE (for OTA format only). If not provided, system derives it automatically</li>
            </ul>

            <h4 style={{ marginTop: '1.5rem' }}>How to Import Locations</h4>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Configure Location Endpoint:</strong>
                <ul>
                  <li>Go to the "Locations" tab in the Source UI</li>
                  <li>Click "Configure Endpoint" button</li>
                  <li>Enter your location endpoint URL (e.g., <code>https://example.com/locations.php</code>)</li>
                  <li>Click "Test Endpoint" to verify the format is correct</li>
                  <li>Click "Save" to store the configuration</li>
                </ul>
              </li>
              <li>
                <strong>Import Locations:</strong>
                <ul>
                  <li>Click "Import Locations" button</li>
                  <li>The system will call your endpoint with <code>Request-Type: LocationRq</code> header</li>
                  <li>Locations will be imported and linked to your source</li>
                  <li>If any locations fail validation, you'll see detailed error messages</li>
                </ul>
              </li>
              <li>
                <strong>Verify Import:</strong> Check that all locations were imported correctly. 
                If validation fails, review the error messages to fix the format.
              </li>
            </ol>

            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '0.5rem' }}>
              <strong>💡 Important:</strong>
              <ul style={{ marginTop: '0.5rem', marginBottom: 0, lineHeight: '1.8' }}>
                <li>Your endpoint can return locations in multiple formats:
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    <li><code>{"{ Locations: [...] }"}</code> - JSON object with "Locations" key</li>
                    <li><code>{"{ items: [...] }"}</code> - JSON object with "items" key</li>
                    <li><code>[location1, location2, ...]</code> - Direct JSON array</li>
                    <li><code>{"<Locations><Location>...</Location></Locations>"}</code> - XML format</li>
                    <li><code>{"{ OTA_VehLocSearchRS: { VehMatchedLocs: [...] } }"}</code> - OTA format (same as branch import)</li>
                    <li><code>PHP var_dump with OTA_VehLocSearchRS</code> - PHP var_dump format</li>
                  </ul>
                </li>
                <li>Each location must have a <code>unlocode</code> field (required). For OTA format, if <code>NatoLocode</code> is not provided, the system will derive it automatically.</li>
                <li>UN/LOCODEs must be valid 4-5 character codes (e.g., "GBMAN", "USNYC", "AEDXB").</li>
                <li><strong>OTA Format Support:</strong> If you're already using OTA_VehLocSearchRS for branch imports, you can use the exact same format for location imports. The system automatically extracts location data from the <code>VehMatchedLocs</code> structure.</li>
                <li>If a location doesn't exist in the UN/LOCODE database, you can request it to be added (see Location Requests section).</li>
              </ul>
            </div>

            <h3 style={{ marginTop: '2rem' }}>Method 2: Sync Coverage from gRPC</h3>
            <p>
              You can also sync locations from your gRPC adapter's <code>GetLocations</code> method.
            </p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>
                <strong>Go to Locations Tab:</strong> Navigate to the "Locations" section.
              </li>
              <li>
                <strong>Click "Sync Locations":</strong> This triggers a sync with your supplier adapter's gRPC <code>GetLocations</code> method.
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
            
            <h4 style={{ marginTop: '1rem' }}>Agreement Lifecycle</h4>
            <p>
              Agreements go through several statuses:
            </p>
            <ol style={{ lineHeight: '1.8' }}>
              <li><strong>DRAFT:</strong> Agreement is created but not yet offered to the agent</li>
              <li><strong>OFFERED:</strong> Agreement has been sent to the agent for review</li>
              <li><strong>ACCEPTED:</strong> Agent has accepted the agreement (but not yet active)</li>
              <li><strong>ACTIVE:</strong> Agreement is live - agents can search availability and create bookings</li>
              <li><strong>SUSPENDED:</strong> Agreement is temporarily suspended</li>
              <li><strong>EXPIRED:</strong> Agreement has passed its validity end date</li>
            </ol>
            
            <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
              <strong>💡 Important:</strong> Only <code>ACTIVE</code> agreements allow agents to search availability and create bookings. 
              Make sure your agreements are in ACTIVE status before expecting traffic.
            </div>
            
            <h4 style={{ marginTop: '1.5rem' }}>How Agreements Work in the System</h4>
            <p>
              When an agent searches for availability:
            </p>
            <ol style={{ lineHeight: '1.8' }}>
              <li>Agent specifies <code>agreement_refs</code> in the search request</li>
              <li>Middleware validates agreements are <code>ACTIVE</code> status</li>
              <li>Middleware checks location coverage for each agreement</li>
              <li>Middleware calls your gRPC server with the <code>agreement_ref</code></li>
              <li>You use the <code>agreement_ref</code> to determine pricing and availability rules</li>
            </ol>
            
            <h4 style={{ marginTop: '1.5rem' }}>Location Coverage Per Agreement</h4>
            <p>
              Each agreement can have specific location coverage rules:
            </p>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Default Coverage:</strong> All your synced locations are available</li>
              <li><strong>Specific Locations:</strong> You can restrict agreements to specific UN/LOCODEs</li>
              <li><strong>Excluded Locations:</strong> You can exclude certain locations from an agreement</li>
              <li><strong>Validation:</strong> Middleware checks location coverage before calling your API</li>
            </ul>

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
          <h2 style={{ marginTop: 0 }}>Best Practices & Performance Optimization</h2>
          
          <h3 style={{ marginTop: '1rem' }}>Performance</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Response Time:</strong> Keep your HTTP and gRPC endpoints responsive (under 3 seconds). 
              Slow responses trigger health monitoring and can lead to automatic exclusion from availability searches.
            </li>
            <li>
              <strong>Caching:</strong> Cache frequently accessed data (locations, vehicle classes, pricing rules) to reduce database queries.
            </li>
            <li>
              <strong>Connection Pooling:</strong> Use connection pooling for database connections to improve performance.
            </li>
            <li>
              <strong>Async Processing:</strong> For complex availability searches, consider async processing and return results incrementally.
            </li>
            <li>
              <strong>Timeout Handling:</strong> Set appropriate timeouts for external API calls to prevent hanging requests.
            </li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Location Management</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Location Mapping:</strong> Always map branches to UN/LOCODEs after import. 
              Unmapped branches won't appear in availability searches.
            </li>
            <li>
              <strong>Regular Syncs:</strong> Sync your location coverage regularly, especially after adding new branches or updating location data.
            </li>
            <li>
              <strong>Location Validation:</strong> Verify UN/LOCODEs exist in the database before mapping branches.
            </li>
            <li>
              <strong>Location Requests:</strong> Request new locations early if you need locations that don't exist in the UN/LOCODE database.
            </li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Agreement Management</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Validity Dates:</strong> Keep track of agreement validity dates and renew them before expiration.
            </li>
            <li>
              <strong>Status Monitoring:</strong> Regularly check agreement status to ensure they remain ACTIVE.
            </li>
            <li>
              <strong>Location Coverage:</strong> Configure location coverage per agreement to control which locations are available to each agent.
            </li>
            <li>
              <strong>Agreement References:</strong> Use clear, unique agreement references (e.g., <code>AG-2025-001</code>) for easy tracking.
            </li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>API Implementation</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Error Handling:</strong> Ensure your endpoints return proper gRPC error codes and messages. 
              The middleware logs all errors for debugging.
            </li>
            <li>
              <strong>Idempotency:</strong> Always check <code>idempotency_key</code> in CreateBooking to prevent duplicate bookings.
            </li>
            <li>
              <strong>agreement_ref Usage:</strong> Always use <code>agreement_ref</code> to determine pricing, availability, and business rules.
            </li>
            <li>
              <strong>supplier_offer_ref:</strong> Always return a unique <code>supplier_offer_ref</code> in availability responses. 
              If missing, the system will generate one, but it's better to provide your own.
            </li>
            <li>
              <strong>Data Validation:</strong> Validate all input parameters (UN/LOCODEs, dates, vehicle classes) before processing.
            </li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Testing & Monitoring</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Verification:</strong> Run verification tests regularly to ensure all endpoints are working correctly.
            </li>
            <li>
              <strong>Health Monitoring:</strong> Check your health status regularly in the Health tab to catch performance issues early.
            </li>
            <li>
              <strong>Connection Testing:</strong> Use the gRPC connection test in the Dashboard to verify connectivity before going live.
            </li>
            <li>
              <strong>Logging:</strong> Implement comprehensive logging in your gRPC server for debugging and monitoring.
            </li>
            <li>
              <strong>Error Tracking:</strong> Monitor error rates and investigate any spikes in failures.
            </li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Security</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li>
              <strong>Network Security:</strong> Ensure your gRPC server is only accessible from the middleware server (firewall rules).
            </li>
            <li>
              <strong>Authentication:</strong> Consider implementing authentication/authorization in your gRPC server if needed.
            </li>
            <li>
              <strong>Data Validation:</strong> Validate and sanitize all input data to prevent injection attacks.
            </li>
            <li>
              <strong>Rate Limiting:</strong> Implement rate limiting to prevent abuse of your API.
            </li>
          </ul>
        </section>

        {/* Next Steps */}
        <section id="next-steps" style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#ecfdf5', border: '1px solid #86efac', borderRadius: '0.5rem', scrollMarginTop: '100px' }}>
          <h2 style={{ marginTop: 0 }}>Next Steps & Going Live</h2>
          
          <h3 style={{ marginTop: '1rem' }}>Pre-Launch Checklist</h3>
          <ol style={{ lineHeight: '1.8' }}>
            <li><strong>Complete Setup:</strong> Finish all setup steps above (account, endpoints, branches, locations)</li>
            <li><strong>Implement gRPC API:</strong> Build and test your gRPC server with all 7 required methods</li>
            <li><strong>Test Connection:</strong> Use the gRPC connection test in the Dashboard to verify connectivity</li>
            <li><strong>Run Verification:</strong> Run verification tests and ensure all tests pass</li>
            <li><strong>Map Locations:</strong> Ensure all branches are mapped to UN/LOCODEs</li>
            <li><strong>Sync Locations:</strong> Sync your location coverage to update the middleware</li>
            <li><strong>Create Agreements:</strong> Create and offer agreements to agents</li>
            <li><strong>Wait for Acceptance:</strong> Ensure agents accept agreements (status becomes ACTIVE)</li>
            <li><strong>Performance Test:</strong> Test your API performance to ensure response times are under 3 seconds</li>
            <li><strong>Monitor Health:</strong> Check your health status regularly to catch issues early</li>
          </ol>

          <h3 style={{ marginTop: '1.5rem' }}>Documentation & Resources</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>API Reference:</strong> Review the complete API Reference guide for detailed endpoint specifications</li>
            <li><strong>SDK Guide:</strong> Check the SDK Guide for code examples in your preferred language (Go, Java, JavaScript, Python, PHP, Perl, TypeScript)</li>
            <li><strong>Proto File:</strong> Download <code>source_provider.proto</code> from the API Reference or use <code>GET /docs/proto/source_provider.proto</code></li>
            <li><strong>Health Monitoring:</strong> Understand the health monitoring system to maintain good performance</li>
            <li><strong>Error Handling:</strong> Review error handling best practices in the API Reference</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Ongoing Maintenance</h3>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Monitor Health:</strong> Check your health status regularly in the Health tab</li>
            <li><strong>Update Locations:</strong> Sync locations whenever you add new branches or update location data</li>
            <li><strong>Agreement Management:</strong> Monitor agreement status and renew before expiration</li>
            <li><strong>Performance Optimization:</strong> Continuously optimize your API to maintain sub-3-second response times</li>
            <li><strong>Error Monitoring:</strong> Monitor error rates and investigate any issues promptly</li>
            <li><strong>Regular Testing:</strong> Run verification tests periodically to ensure everything is working</li>
          </ul>

          <h3 style={{ marginTop: '1.5rem' }}>Troubleshooting</h3>
          <p>
            If you encounter issues:
          </p>
          <ul style={{ lineHeight: '1.8' }}>
            <li><strong>Check Health Status:</strong> Verify your source is not excluded due to poor performance</li>
            <li><strong>Review Verification Results:</strong> Check which tests are failing and fix the issues</li>
            <li><strong>Check Logs:</strong> Review backend logs for detailed error messages</li>
            <li><strong>Test Connection:</strong> Use the gRPC connection test to verify connectivity</li>
            <li><strong>Validate Endpoints:</strong> Ensure your gRPC endpoint is correct and accessible</li>
            <li><strong>Check Agreement Status:</strong> Verify agreements are ACTIVE and not expired</li>
            <li><strong>Location Coverage:</strong> Ensure locations are properly mapped and synced</li>
            <li><strong>Contact Support:</strong> If issues persist, contact your system administrator or support team</li>
          </ul>
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
