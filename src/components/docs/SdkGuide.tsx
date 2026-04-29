import React, { useState, useEffect } from 'react';
import './docs.css';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../lib/apiConfig';
import PhpGuide from './guides/PhpGuide';
import { SdkDownloadButton } from './SdkDownloadButton';

type SdkType = 'php';

type SectionType =
  | 'quick-start'
  | 'architecture-flow'
  | 'installation'
  | 'integration-standard'
  | 'error-handling'
  | 'best-practices'
  | 'api-reference'
  | 'grpc-implementation';

const SdkGuide: React.FC<{ role?: 'agent' | 'source' | 'admin' }> = ({ role = 'source' }) => {
  const [companyId, setCompanyId] = useState<string>('YOUR_COMPANY_ID');
  const [companyType, setCompanyType] = useState<string>('SOURCE');
  const [activeSection, setActiveSection] = useState<SectionType>('quick-start');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloadingProto, setDownloadingProto] = useState(false);

  useEffect(() => {
    // Load user info for SDK examples
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.company?.id) {
          setCompanyId(user.company.id);
        }
        if (user.company?.type) {
          setCompanyType(user.company.type);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const handleDownloadProto = async () => {
    setDownloadingProto(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/docs/proto/source_provider.proto`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Failed to download proto file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'source_provider.proto';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Proto file downloaded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download proto file');
    } finally {
      setDownloadingProto(false);
    }
  };

  const prefaceText = {
    agent: 'Start here: login → approve agreement → availability → booking',
    source: 'Start here: login → offer agreement → locations → verification',
    admin: 'Start here: login → manage companies → agreements → health monitoring',
  };

  const pageSubtitle =
    role === 'source'
      ? 'Source PHP: Gloria REST (cURL) in the sections below, plus architecture for the supplier OTA + Laravel + optional gRPC bridge (Source PHP bundle ZIP — not CarHireClient).'
      : role === 'agent'
        ? 'Agent PHP: CarHireClient (broker) SDK; ZIP is php-agent. Suppliers use the Source portal bundle instead.'
        : 'Production-ready SDK documentation for Gloria Connect.';

  const sections: { id: SectionType; label: string }[] = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'architecture-flow', label: 'Architecture & flow' },
    { id: 'installation', label: 'Installation' },
    { id: 'integration-standard', label: 'Integration Standard' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'grpc-implementation', label: 'gRPC Implementation' },
  ];

  const sdks: { id: SdkType; name: string; icon: string; downloadType: 'php' }[] = [
    { id: 'php', name: 'PHP', icon: '🐘', downloadType: 'php' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)', backgroundColor: '#f9fafb' }}>
      {/* Sidebar */}
      <aside 
        style={{ 
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          transition: 'width 0.2s ease-in-out',
          overflow: 'hidden',
          position: 'sticky',
          top: 0,
          height: 'calc(100vh - 80px)',
          overflowY: 'auto',
          flexShrink: 0,
          boxShadow: sidebarOpen ? '2px 0 4px rgba(0,0,0,0.05)' : 'none'
        }}
        className="sdk-sidebar"
      >
        <div style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>SDK Guide</h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: 'none',
                border: '1px solid #e5e7eb',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                padding: '0.375rem 0.5rem',
                color: '#64748b',
                fontSize: '0.75rem',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
              aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? '◀' : '▶'}
            </button>
          </div>
          
          {sidebarOpen && (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  PHP SDK (source)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      backgroundColor: '#f1f5f9',
                      color: '#1f2937',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span>🐘</span>
                    <span>PHP</span>
                  </div>
                  <SdkDownloadButton
                    sdkType="php"
                    downloadSlug="php-source"
                    zipFilename="gloria-php-source-supplier.zip"
                    variant="icon-only"
                    className="sdk-download-btn"
                  />
                </div>
              </div>

              {/* Section Navigation */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Sections
                </label>
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        const element = document.getElementById(section.id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }}
                      style={{
                        padding: '0.625rem 0.75rem',
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: activeSection === section.id ? '#f1f5f9' : 'transparent',
                        color: activeSection === section.id ? '#1f2937' : '#64748b',
                        fontWeight: activeSection === section.id ? 600 : 400,
                        cursor: 'pointer',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSection !== section.id) {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSection !== section.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', minWidth: 0 }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1f2937' }}>
              {sdks[0].name} SDK
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.55 }}>
              {pageSubtitle}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <SdkDownloadButton
              sdkType="php"
              downloadSlug="php-source"
              zipFilename="gloria-php-source-supplier.zip"
              label="Download Source PHP bundle"
              variant="default"
            />
            <button
              onClick={handleDownloadProto}
              disabled={downloadingProto}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: downloadingProto ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: downloadingProto ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background-color 0.2s',
              }}
              onMouseOver={(e) => {
                if (!downloadingProto) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
              onMouseOut={(e) => {
                if (!downloadingProto) {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }
              }}
              title="Download source_provider.proto file"
            >
              <span>📥</span>
              <span>{downloadingProto ? 'Downloading...' : 'Download Proto'}</span>
            </button>
          </div>
        </div>

        {role && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontWeight: 600, color: '#334155', fontSize: '0.875rem' }}>{prefaceText[role]}</p>
          </div>
        )}

        {role === 'source' && (
          <div
            style={{
              marginBottom: '2rem',
              padding: '1.25rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: '0.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 0.75rem 0', fontSize: '1.05rem', fontWeight: 700, color: '#92400e' }}>
              Supplier integration — what to configure first
            </h2>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350f', fontSize: '0.875rem', lineHeight: 1.65 }}>
              <li>
                <strong>API base URL</strong> — In PHP/cURL samples, replace <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>$API_BASE</code> /{' '}
                <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>localhost:8080</code> with the same Gloria API origin this portal uses (your deployed backend / <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>VITE_*</code> env in your own app).
              </li>
              <li>
                <strong>JWT</strong> — Call <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>/auth/login</code>, then send <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>Authorization: Bearer …</code> on every other request.
              </li>
              <li>
                <strong>Company id</strong> — Use your source company id for <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>source_id</code>, coverage paths, and agreement payloads (shown in the box below when you are logged in here).
              </li>
              <li>
                <strong>Endpoints in Gloria</strong> — <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>PUT /endpoints/config</code> sets your supplier <strong>HTTP</strong> and <strong>gRPC</strong> addresses (<code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>host:port</code>), <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>adapterType</code>, and optional import URLs. Under <strong>Location &amp; Branches</strong> you can choose <strong>HTTP POST XML</strong> (GLORIA location list) or <strong>gRPC GetLocations</strong> for the same import button.
              </li>
              <li>
                <strong>Whitelist</strong> — Register supplier hostnames/IPs Gloria may call; otherwise requests fail with a whitelist error.
              </li>
              <li>
                <strong>gRPC contract</strong> — Use <strong>Download Proto</strong> for <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>source_provider.proto</code> when implementing <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>SourceProviderService</code>.
              </li>
              <li>
                <strong>Source PHP bundle ZIP</strong> — Supplier OTA + Laravel + optional gRPC bridge; same Gloria contracts as the REST flows in this guide.
              </li>
              <li>
                <strong>PHP (two different products)</strong> — Tabs below show <strong>direct REST/cURL</strong> to Gloria. The <strong>supplier OTA + Laravel + optional gRPC bridge</strong> is the separate <strong>Source PHP bundle</strong> download (<code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>php-source</code>), not <code style={{ backgroundColor: '#fef3c7', padding: '0.1rem 0.3rem', borderRadius: '0.2rem' }}>CarHireClient</code>.
              </li>
            </ol>
          </div>
        )}

        {role === 'source' && (
          <div
            style={{
              marginBottom: '2rem',
              padding: '1.25rem',
              backgroundColor: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: '0.5rem',
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', color: '#065f46' }}>Source (supplier) PHP integration</h2>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#047857', lineHeight: 1.5 }}>
              Download the supplier-side bundle: OTA XML adapter, Laravel HTTP layer, optional Node gRPC bridge, and{' '}
              <code style={{ backgroundColor: '#d1fae5', padding: '0.125rem 0.35rem', borderRadius: '0.25rem' }}>gloria_client_supplier.proto</code>.
              Booking agents use the <strong>Agent portal</strong> PHP SDK (<code>CarHireClient</code>), not this ZIP.
            </p>
            <SdkDownloadButton
              sdkType="php"
              downloadSlug="php-source"
              zipFilename="gloria-php-source-supplier.zip"
              label="Download Source PHP bundle"
              variant="default"
            />
          </div>
        )}

        {companyId !== 'YOUR_COMPANY_ID' && (
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
              <strong>Your Company ID:</strong> <code style={{ backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', border: '1px solid #d1d5db' }}>{companyId}</code> | 
              <strong> Type:</strong> <code style={{ backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', border: '1px solid #d1d5db' }}>{companyType}</code>
            </p>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              💡 Use your Company ID in API requests where <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>sourceId</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>companyId</code>, or path parameters require it.
            </p>
          </div>
        )}


        {/* Content Container */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '2rem', marginTop: '2rem' }}>
          {activeSection === 'integration-standard' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Car Rental Integration Standard</h2>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                Source integrations must keep Gloria output normalized across ListBranches, PriceRequest, BookingRequest, and Cancel/ReservationStatus.
              </p>
              <pre className="code-block">{`<?php
// Source REST — same normalized keys as OTA / gRPC adapters in the PHP bundle

// Branches (after PUT /endpoints/config + import)
apiRequest('POST', '/sources/import-branches');
$branches = apiRequest('GET', '/sources/branches?limit=25');

// Agreements → offer to agent
$agreement = apiRequest('POST', '/agreements', [
  'agent_id' => 'agent_company_id',
  'source_id' => $companyId,
  'agreement_ref' => 'AG-2026-490',
]);
apiRequest('POST', '/agreements/' . $agreement['id'] . '/offer');

// Keys you will also see in OTA / proto payloads:
// agreement_ref, supplier_offer_ref, supplier_booking_ref, pickup_iso, dropoff_iso`}</pre>
            </div>
          )}
          {activeSection !== 'integration-standard' && (
            <PhpGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
              downloadingProto={downloadingProto}
              onDownloadProto={handleDownloadProto}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SdkGuide;
