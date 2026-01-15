import React, { useState, useEffect } from 'react';
import './docs.css';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../lib/apiConfig';
import TypeScriptGuide from './guides/TypeScriptGuide';
import JavaScriptGuide from './guides/JavaScriptGuide';
import GoGuide from './guides/GoGuide';
import PhpGuide from './guides/PhpGuide';
import PythonGuide from './guides/PythonGuide';
import JavaGuide from './guides/JavaGuide';
import PerlGuide from './guides/PerlGuide';
import { SdkDownloadButton } from './SdkDownloadButton';

type SdkType = 'javascript' | 'typescript' | 'go' | 'php' | 'python' | 'java' | 'perl';

type SectionType = 'quick-start' | 'installation' | 'error-handling' | 'best-practices' | 'api-reference' | 'grpc-implementation';

const SdkGuide: React.FC<{ role?: 'agent' | 'source' | 'admin' }> = ({ role = 'source' }) => {
  const [companyId, setCompanyId] = useState<string>('YOUR_COMPANY_ID');
  const [companyType, setCompanyType] = useState<string>('SOURCE');
  const [activeSdk, setActiveSdk] = useState<SdkType>('typescript');
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

  const sections: { id: SectionType; label: string }[] = [
    { id: 'quick-start', label: 'Quick Start' },
    { id: 'installation', label: 'Installation' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'best-practices', label: 'Best Practices' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'grpc-implementation', label: 'gRPC Implementation' },
  ];

  const sdks: { id: SdkType; name: string; icon: string; downloadType: 'nodejs' | 'python' | 'php' | 'java' | 'go' | 'perl' }[] = [
    { id: 'typescript', name: 'TypeScript', icon: '📘', downloadType: 'nodejs' },
    { id: 'javascript', name: 'JavaScript', icon: '📦', downloadType: 'nodejs' },
    { id: 'go', name: 'Go', icon: '🐹', downloadType: 'go' },
    { id: 'php', name: 'PHP', icon: '🐘', downloadType: 'php' },
    { id: 'python', name: 'Python', icon: '🐍', downloadType: 'python' },
    { id: 'java', name: 'Java', icon: '☕', downloadType: 'java' },
    { id: 'perl', name: 'Perl', icon: '🐪', downloadType: 'perl' },
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
              {/* SDK Selector */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Select SDK
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sdks.map((sdk) => (
                    <div
                      key={sdk.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <button
                        onClick={() => {
                          setActiveSdk(sdk.id);
                          setActiveSection('quick-start');
                        }}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          textAlign: 'left',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          backgroundColor: activeSdk === sdk.id ? '#f1f5f9' : 'white',
                          color: activeSdk === sdk.id ? '#1f2937' : '#64748b',
                          fontWeight: activeSdk === sdk.id ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseEnter={(e) => {
                          if (activeSdk !== sdk.id) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeSdk !== sdk.id) {
                            e.currentTarget.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        <span>{sdk.icon}</span>
                        <span>{sdk.name}</span>
                      </button>
                      <SdkDownloadButton
                        sdkType={sdk.downloadType}
                        variant="icon-only"
                        className="sdk-download-btn"
                      />
                    </div>
                  ))}
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
              {sdks.find(s => s.id === activeSdk)?.name} SDK
            </h1>
            <p style={{ color: '#64748b', fontSize: '1rem' }}>
              Production-ready SDK for integrating with Gloria Connect API
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <SdkDownloadButton
              sdkType={sdks.find(s => s.id === activeSdk)?.downloadType || 'nodejs'}
              label={`Download ${sdks.find(s => s.id === activeSdk)?.name} SDK`}
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
          {activeSdk === 'typescript' && (
            <TypeScriptGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
              downloadingProto={downloadingProto}
              onDownloadProto={handleDownloadProto}
            />
          )}
          {activeSdk === 'javascript' && (
            <JavaScriptGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
          {activeSdk === 'go' && (
            <GoGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
          {activeSdk === 'php' && (
            <PhpGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
          {activeSdk === 'python' && (
            <PythonGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
          {activeSdk === 'java' && (
            <JavaGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
          {activeSdk === 'perl' && (
            <PerlGuide
              activeSection={activeSection}
              role={role}
              companyId={companyId}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SdkGuide;
