import React, { useState, useEffect } from 'react';
import './docs.css';
import { Copy, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../lib/apiConfig';

type SdkType = 'javascript' | 'typescript' | 'go' | 'php' | 'python' | 'java' | 'perl';

// Helper component for code blocks with copy button
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <div style={{ position: 'relative', marginTop: '1rem' }}>
      <div style={{ 
        backgroundColor: '#1f2937', 
        color: '#f9fafb', 
        padding: '1.5rem', 
        borderRadius: '0.25rem',
        position: 'relative'
      }}>
        <button
          onClick={handleCopy}
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            background: copied ? '#10b981' : '#374151',
            border: 'none',
            borderRadius: '0.25rem',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'white',
            fontSize: '0.75rem',
            transition: 'background 0.2s',
          }}
          title="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span style={{ marginLeft: '0.25rem' }}>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        <pre style={{ 
          margin: 0, 
          fontSize: '0.875rem', 
          lineHeight: '1.5', 
          fontFamily: 'Monaco, Menlo, monospace', 
          whiteSpace: 'pre-wrap',
          paddingRight: '4rem'
        }}>
          {code}
        </pre>
      </div>
    </div>
  );
};

const SdkGuide: React.FC<{ role?: 'agent' | 'source' | 'admin' }> = ({ role = 'source' }) => {
  const [companyId, setCompanyId] = useState<string>('YOUR_COMPANY_ID');
  const [companyType, setCompanyType] = useState<string>('SOURCE');
  const [activeSdk, setActiveSdk] = useState<SdkType>('typescript');
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

  return (
    <div className="docs-main">
      <h1>SDK Guide</h1>
      <p>Get started with Gloria Connect SDKs for integrating with our API.</p>

      {role && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontWeight: 500, color: '#1f2937' }}>{prefaceText[role]}</p>
        </div>
      )}

      {companyId !== 'YOUR_COMPANY_ID' && (
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
            <strong>Your Company ID:</strong> <code style={{ backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', border: '1px solid #d1d5db' }}>{companyId}</code> | 
            <strong> Type:</strong> <code style={{ backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', border: '1px solid #d1d5db' }}>{companyType}</code>
          </p>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
            💡 Use your Company ID in API requests where <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>sourceId</code>, <code style={{ backgroundColor: '#f3f4f6', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', fontFamily: 'monospace' }}>companyId</code>, or path parameters require it.
          </p>
        </div>
      )}

      <section>
        <h2>Available SDKs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {/* JavaScript Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>JavaScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready SDK for Node.js 18+ and modern browsers.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Full API coverage</li>
                <li>Long-polling support</li>
                <li>Automatic retries</li>
                <li>TypeScript-friendly</li>
              </ul>
            </div>
          </div>

          {/* PHP Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>PHP</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready PHP SDK for server-side integration.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Generator-based streaming</li>
                <li>Full API coverage</li>
                <li>Automatic retries</li>
                <li>PSR-4 autoloading</li>
              </ul>
            </div>
          </div>

          {/* TypeScript Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📘</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>TypeScript</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready TypeScript SDK with full type definitions.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Complete type definitions</li>
                <li>Full API coverage</li>
                <li>Long-polling support</li>
                <li>Tree-shakable builds</li>
              </ul>
            </div>
          </div>

          {/* Go Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐹</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Go</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Go SDK for high-performance integrations.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Channel-based streaming</li>
                <li>Full context support</li>
                <li>Standard library</li>
                <li>Type-safe API</li>
              </ul>
            </div>
          </div>

          {/* Python Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐍</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Python</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Python SDK for data science and automation.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Async iterator support</li>
                <li>Full API coverage</li>
                <li>Type hints</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
          
          {/* Java Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>☕</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Java</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Java SDK with CompletableFuture support.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Async operations</li>
                <li>Full API coverage</li>
                <li>Maven/Gradle support</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
          
          {/* Perl Card */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1.5rem', backgroundColor: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🐪</span>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1f2937' }}>Perl</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.25rem', fontWeight: 500 }}>Available</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#374151', marginBottom: '1rem' }}>
              Production-ready Perl SDK for legacy systems.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.5rem 0', fontWeight: 600 }}>Features:</p>
              <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', color: '#6b7280' }}>
                <li>Generator-based streaming</li>
                <li>Full API coverage</li>
                <li>CPAN support</li>
                <li>Error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SDK Tabs Navigation */}
      <section style={{ marginBottom: '2rem' }}>
        <div className="sdk-tabs" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '3px solid #e5e7eb', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          <button
            className={`sdk-tab ${activeSdk === 'typescript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('typescript')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'typescript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'typescript' ? '#f9fafb' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'typescript' ? 600 : 500,
              color: activeSdk === 'typescript' ? '#1f2937' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'typescript' ? '2px solid #475569' : '2px solid transparent',
              marginBottom: activeSdk === 'typescript' ? '-0.5rem' : '-0.5rem',
              transition: 'color 0.15s, border-color 0.15s',
              borderRadius: '0.25rem 0.25rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            TypeScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'javascript' ? 'active' : ''}`}
            onClick={() => setActiveSdk('javascript')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'javascript') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'javascript' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'javascript' ? 700 : 600,
              color: activeSdk === 'javascript' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'javascript' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'javascript' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            JavaScript
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'go' ? 'active' : ''}`}
            onClick={() => setActiveSdk('go')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'go') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'go' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'go' ? 700 : 600,
              color: activeSdk === 'go' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'go' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'go' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Go
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'php' ? 'active' : ''}`}
            onClick={() => setActiveSdk('php')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'php') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'php' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'php' ? 700 : 600,
              color: activeSdk === 'php' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'php' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'php' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            PHP
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'python' ? 'active' : ''}`}
            onClick={() => setActiveSdk('python')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'python') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'python' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'python' ? 700 : 600,
              color: activeSdk === 'python' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'python' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'python' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Python
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'java' ? 'active' : ''}`}
            onClick={() => setActiveSdk('java')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'java') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'java' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'java' ? 700 : 600,
              color: activeSdk === 'java' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'java' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'java' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Java
          </button>
          <button
            className={`sdk-tab ${activeSdk === 'perl' ? 'active' : ''}`}
            onClick={() => setActiveSdk('perl')}
            onMouseEnter={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSdk !== 'perl') {
                e.currentTarget.style.background = 'transparent';
              }
            }}
            style={{
              background: activeSdk === 'perl' ? '#eff6ff' : 'transparent',
              border: 'none',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: activeSdk === 'perl' ? 700 : 600,
              color: activeSdk === 'perl' ? '#3b82f6' : '#6b7280',
              cursor: 'pointer',
              borderBottom: activeSdk === 'perl' ? '3px solid #3b82f6' : '3px solid transparent',
              marginBottom: activeSdk === 'perl' ? '-0.5rem' : '-0.5rem',
              transition: 'all 0.2s',
              borderRadius: '0.5rem 0.5rem 0 0',
              whiteSpace: 'nowrap'
            }}
          >
            Perl
          </button>
        </div>
      </section>

      {/* TypeScript SDK Section */}
      {activeSdk === 'typescript' && (
        <section>
          <h2>TypeScript Quick Start</h2>
          {role === 'source' && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                <strong>For Sources:</strong> After login, configure your endpoints, sync locations, and offer agreements to agents. Use your Company ID ({companyId !== 'YOUR_COMPANY_ID' ? <code style={{ backgroundColor: '#fff', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', border: '1px solid #d1d5db' }}>{companyId}</code> : 'YOUR_COMPANY_ID'}) in API calls.
              </p>
            </div>
          )}
        {role === 'source' && (
          <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#eff6ff', border: '1px solid #3b82f6', borderRadius: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
                  📥 Need the gRPC Proto File?
                </p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#1e3a8a' }}>
                  Download the source_provider.proto file to implement your gRPC server
                </p>
              </div>
              <button
                onClick={handleDownloadProto}
                disabled={downloadingProto}
                style={{
                  background: downloadingProto ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.25rem',
                  padding: '0.5rem 1rem',
                  cursor: downloadingProto ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
              >
                <Download size={16} />
                {downloadingProto ? 'Downloading...' : 'Download Proto'}
              </button>
            </div>
          </div>
        )}
        <CodeBlock code={role === 'source' ? `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
let token = '';

// 1. Login
const loginRes = await axios.post(\`\${API_BASE}/auth/login\`, {
  email: 'source@example.com',
  password: 'password123'
});
token = loginRes.data.access;
const companyId = loginRes.data.user.company.id;

// 2. Configure endpoints
await axios.put(
  \`\${API_BASE}/endpoints/config\`,
  {
    httpEndpoint: 'http://localhost:9090',
    grpcEndpoint: 'localhost:51061',
    adapterType: 'grpc'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 3. Test endpoints
const testRes = await axios.post(
  \`\${API_BASE}/endpoints/test\`,
  { testHttp: true, testGrpc: true },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Test results:', testRes.data);

// 4. Import branches from supplier endpoint
await axios.post(
  \`\${API_BASE}/sources/import-branches\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 5. List your branches
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches?limit=25&offset=0\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Branches:', branchesRes.data.items);

// 6. Create a new branch
const newBranchRes = await axios.post(
  \`\${API_BASE}/sources/branches\`,
  {
    branchCode: 'BR001',
    name: 'Manchester Airport',
    natoLocode: 'GBMAN',
    latitude: 53.3656,
    longitude: -2.2729,
    city: 'Manchester',
    country: 'United Kingdom',
    countryCode: 'GB'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 7. Search for UN/LOCODE locations
const locationsRes = await axios.get(
  \`\${API_BASE}/sources/locations/search?query=Manchester&limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 8. Add location to coverage
await axios.post(
  \`\${API_BASE}/sources/locations\`,
  { unlocode: 'GBMAN' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 9. Sync location coverage from gRPC
await axios.post(
  \`\${API_BASE}/coverage/source/\${companyId}/sync\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 10. Create and offer agreement
const agreementRes = await axios.post(
  \`\${API_BASE}/agreements\`,
  {
    agent_id: 'agent_company_id',
    source_id: companyId,
    agreement_ref: 'AG-2025-001',
    valid_from: '2025-01-01T00:00:00Z',
    valid_to: '2025-12-31T23:59:59Z'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
const agreementId = agreementRes.data.id;

// Offer the agreement
await axios.post(
  \`\${API_BASE}/agreements/\${agreementId}/offer\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 11. List agreements
const agreementsRes = await axios.get(
  \`\${API_BASE}/agreements?sourceId=\${companyId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 12. Check health status
const healthRes = await axios.get(
  \`\${API_BASE}/health/my-source\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);

// 13. Get unmapped branches
const unmappedRes = await axios.get(
  \`\${API_BASE}/sources/branches/unmapped?limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 14. Update branch
await axios.patch(
  \`\${API_BASE}/sources/branches/\${branchId}\`,
  { natoLocode: 'GBMAN', city: 'Manchester' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 15. Remove location from coverage
await axios.delete(
  \`\${API_BASE}/sources/locations/GBMAN\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 16. Get endpoint notifications
const notificationsRes = await axios.get(
  \`\${API_BASE}/endpoints/notifications?limit=50&unreadOnly=true\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 17. Mark notification as read
await axios.post(
  \`\${API_BASE}/endpoints/notifications/\${notificationId}/read\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 18. Get endpoint status
const statusRes = await axios.get(
  \`\${API_BASE}/endpoints/status\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 19. Check for duplicate agreement
const duplicateCheck = await axios.post(
  \`\${API_BASE}/agreements/check-duplicate\`,
  {
    sourceId: companyId,
    agentId: 'agent_company_id',
    agreementRef: 'AG-2025-001'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);` : `// Agent SDK examples...`} />
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
          <p>
            <strong>Full Documentation:</strong>{' '}
            <a href="../../sdk/typescript/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              README
            </a>{' '}
            |{' '}
            <a href="../../sdk/typescript/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
              API Reference
            </a>
          </p>
        </div>

        {role === 'source' && (
          <section style={{ marginTop: '3rem' }}>
            <h2>gRPC Server Implementation</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              As a source, you must implement a gRPC server that implements the <code>SourceProviderService</code> interface. 
              The middleware will call your gRPC server to get availability, create bookings, and manage locations.
            </p>

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', fontWeight: 500 }}>
                ⚠️ <strong>Important:</strong> Your gRPC server must be accessible at the endpoint you configure in the middleware. 
                Make sure your server is running and reachable before testing.
              </p>
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Required gRPC Methods</h3>
            
            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>1. GetHealth</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Health check endpoint. Return <code>{`{ ok: true, note: "Service is healthy" }`}</code> if your service is ready.
              </p>
              <CodeBlock code={`// Node.js example
GetHealth: (call, callback) => {
  callback(null, {
    ok: true,
    note: 'Service is healthy'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>2. GetLocations</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Return all locations (UN/LOCODEs) that your source supports. Used for location sync.
              </p>
              <CodeBlock code={`// Node.js example
GetLocations: (call, callback) => {
  const locations = [
    { unlocode: 'GBMAN', name: 'Manchester Airport' },
    { unlocode: 'GBGLA', name: 'Glasgow Airport' },
    { unlocode: 'GBLHR', name: 'London Heathrow' }
  ];
  callback(null, { locations });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>3. GetAvailability</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Return vehicle availability offers for the given criteria. This is called when an agent searches for availability.
              </p>
              <CodeBlock code={`// Node.js example
GetAvailability: (call, callback) => {
  const { 
    agreement_ref, 
    pickup_unlocode, 
    dropoff_unlocode, 
    pickup_iso, 
    dropoff_iso,
    driver_age,
    residency_country,
    vehicle_classes 
  } = call.request;

  // Query your inventory system
  const vehicles = [
    {
      supplier_offer_ref: \`OFFER-\${Date.now()}-1\`,
      vehicle_class: 'ECMN',
      make_model: 'Toyota Yaris',
      currency: 'USD',
      total_price: 45.99,
      availability_status: 'AVAILABLE'
    },
    {
      supplier_offer_ref: \`OFFER-\${Date.now()}-2\`,
      vehicle_class: 'CDMR',
      make_model: 'VW Golf',
      currency: 'USD',
      total_price: 67.50,
      availability_status: 'AVAILABLE'
    }
  ];

  callback(null, { vehicles });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>4. CreateBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Create a booking. Use the idempotency_key to prevent duplicate bookings. Return your booking reference and status.
              </p>
              <CodeBlock code={`// Node.js example
CreateBooking: (call, callback) => {
  const { 
    agreement_ref, 
    supplier_offer_ref, 
    agent_booking_ref, 
    idempotency_key 
  } = call.request;

  // Check idempotency - if booking with this key exists, return existing booking
  // Otherwise, create new booking in your system
  
  const supplierBookingRef = \`BKG-\${Date.now()}\`;
  
  callback(null, {
    supplier_booking_ref: supplierBookingRef,
    status: 'CONFIRMED' // or 'REQUESTED', 'FAILED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>5. ModifyBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Modify an existing booking. Return updated booking status.
              </p>
              <CodeBlock code={`// Node.js example
ModifyBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Update booking in your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CONFIRMED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>6. CancelBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Cancel an existing booking. Return cancelled booking status.
              </p>
              <CodeBlock code={`// Node.js example
CancelBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Cancel booking in your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CANCELLED'
  });
}`} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>7. CheckBooking</h4>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>
                Check the status of an existing booking.
              </p>
              <CodeBlock code={`// Node.js example
CheckBooking: (call, callback) => {
  const { agreement_ref, supplier_booking_ref } = call.request;
  
  // Query booking status from your system
  
  callback(null, {
    supplier_booking_ref: supplier_booking_ref,
    status: 'CONFIRMED' // or 'CANCELLED', 'FAILED', etc.
  });
}`} />
            </div>

            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginTop: '2rem', marginBottom: '1rem' }}>Complete Node.js gRPC Server Example</h3>
            <CodeBlock code={`const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto file
const packageDefinition = protoLoader.loadSync('source_provider.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const sourceProviderProto = grpc.loadPackageDefinition(packageDefinition).source_provider;

// Implement service
const server = new grpc.Server();

server.addService(sourceProviderProto.SourceProviderService.service, {
  GetHealth: (call, callback) => {
    callback(null, { ok: true, note: 'Service is healthy' });
  },
  
  GetLocations: (call, callback) => {
    callback(null, {
      locations: [
        { unlocode: 'GBMAN', name: 'Manchester Airport' },
        { unlocode: 'GBGLA', name: 'Glasgow Airport' }
      ]
    });
  },
  
  GetAvailability: (call, callback) => {
    const vehicles = [
      {
        supplier_offer_ref: \`OFFER-\${Date.now()}-1\`,
        vehicle_class: 'ECMN',
        make_model: 'Toyota Yaris',
        currency: 'USD',
        total_price: 45.99,
        availability_status: 'AVAILABLE'
      }
    ];
    callback(null, { vehicles });
  },
  
  CreateBooking: (call, callback) => {
    const supplierBookingRef = \`BKG-\${Date.now()}\`;
    callback(null, {
      supplier_booking_ref: supplierBookingRef,
      status: 'CONFIRMED'
    });
  },
  
  ModifyBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CONFIRMED'
    });
  },
  
  CancelBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CANCELLED'
    });
  },
  
  CheckBooking: (call, callback) => {
    callback(null, {
      supplier_booking_ref: call.request.supplier_booking_ref,
      status: 'CONFIRMED'
    });
  }
});

// Start server
const port = '0.0.0.0:51061';
server.bindAsync(port, grpc.ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Failed to start server:', error);
    return;
  }
  server.start();
  console.log(\`gRPC server listening on \${port}\`);
});`} />

            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #10b981', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#065f46', fontWeight: 500 }}>
                💡 <strong>Tip:</strong> Download the proto file using the button above, then use it to generate client/server code for your language. 
                Most gRPC libraries can generate code from proto files automatically.
              </p>
            </div>
          </section>
        )}

        <section>
          <h2>Complete Source API Reference</h2>
          <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Authentication</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/register</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Register a new source company</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/verify-email</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Verify email with OTP code</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/auth/login</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Login and get JWT token</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Endpoint Configuration</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/config</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get endpoint configuration</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#f97316', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>PUT</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/config</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Update endpoint configuration</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/test</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Test endpoint connectivity</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/status</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get endpoint status and health</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/notifications</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get source notifications</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/endpoints/notifications/:id/read</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Mark notification as read</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Branches Management</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List branches (with filters: status, locationType, search, limit, offset)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Create a new branch</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/:id</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get branch details</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#a855f7', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>PATCH</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/:id</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Update branch</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/branches/unmapped</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List branches without natoLocode</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/import-branches</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Import branches from supplier HTTP endpoint</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/upload-branches</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Upload branches from JSON file</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Location Coverage</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations/search</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Search UN/LOCODE database (query, limit, cursor)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Add location to coverage (unlocode)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#ef4444', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>DELETE</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/sources/locations/:unlocode</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Remove location from coverage</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/coverage/source/:sourceId/sync</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Sync location coverage from gRPC adapter</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Agreements</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Create draft agreement (agent_id, source_id, agreement_ref, valid_from, valid_to)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/all</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>List all agents with their agreements (status filter)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/:id</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get agreement details</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/:id/offer</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Offer agreement to agent</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#1e293b', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>POST</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/agreements/check-duplicate</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Check if agreement already exists (GET or POST)</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem' }}>Health & Verification</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', borderRadius: '0.25rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Method</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Endpoint</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8125rem', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}><code style={{ background: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.125rem', fontWeight: 600 }}>GET</code></td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>/health/my-source</td>
                  <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>Get health status (slowRate, backoffLevel, excludedUntil)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            All API errors follow a consistent format. Always handle errors properly:
          </p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Error response format
{
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* Optional additional details */ }
}

// Common error codes:
// - AUTH_ERROR: Invalid credentials
// - FORBIDDEN: Insufficient permissions  
// - NOT_FOUND: Resource not found
// - VALIDATION_ERROR: Invalid request data
// - CONNECTION_ERROR: Cannot connect to supplier endpoint
// - BRANCH_CODE_EXISTS: Branch already exists
// - UNLOCODE_NOT_FOUND: UN/LOCODE not in database
// - COMPANY_CODE_MISMATCH: Company code mismatch
// - NOT_APPROVED: Source not approved yet
// - EMAIL_NOT_VERIFIED: Email not verified

// Example error handling
try {
  const response = await axios.post('/sources/branches', branchData, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  console.log('Success:', response.data);
} catch (error) {
  if (error.response) {
    const { error: errorCode, message, details } = error.response.data;
    switch (errorCode) {
      case 'BRANCH_CODE_EXISTS':
        console.error('Branch already exists:', message);
        break;
      case 'VALIDATION_ERROR':
        console.error('Validation errors:', details);
        break;
      case 'CONNECTION_ERROR':
        console.error('Cannot connect to supplier:', message);
        break;
      default:
        console.error('API Error:', errorCode, message);
    }
  } else {
    console.error('Network Error:', error.message);
  }
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Best Practices</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ fontSize: '0.875rem', color: '#1f2937', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li><strong>Authentication:</strong> Store JWT tokens securely and refresh before expiration</li>
              <li><strong>Error Handling:</strong> Always implement proper error handling for network and API errors</li>
              <li><strong>Rate Limiting:</strong> Implement retry logic with exponential backoff for transient failures</li>
              <li><strong>Validation:</strong> Validate branch data before submission to avoid validation errors</li>
              <li><strong>Idempotency:</strong> Use unique branch codes and agreement references to avoid duplicates</li>
              <li><strong>Monitoring:</strong> Check health status regularly to ensure optimal performance</li>
              <li><strong>Branch Mapping:</strong> Always map branches to UN/LOCODEs for availability searches</li>
              <li><strong>Endpoint Testing:</strong> Test endpoints after configuration changes</li>
              <li><strong>Company Code:</strong> Ensure your supplier endpoint returns the correct CompanyCode</li>
              <li><strong>Branch Format:</strong> Follow the exact branch data format requirements for imports</li>
            </ul>
          </div>
        </section>
        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install axios
# or
yarn add axios`}</pre>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            <strong>Note:</strong> You can use any HTTP client library (axios, fetch, etc.) to interact with the Gloria Connect API. The examples above use axios, but you can adapt them to your preferred library.
          </p>
        </section>
      </section>
      )}

      {/* JavaScript SDK Section */}
      {activeSdk === 'javascript' && (
        <>
          {role === 'source' && (
            <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#1f2937' }}>
                <strong>For Sources:</strong> Configure endpoints, sync locations, and manage agreements. Your Company ID is: <code style={{ backgroundColor: '#fff', padding: '0.125rem 0.25rem', borderRadius: '0.125rem', border: '1px solid #d1d5db' }}>{companyId !== 'YOUR_COMPANY_ID' ? companyId : 'YOUR_COMPANY_ID'}</code>
              </p>
            </div>
          )}
          <section>
            <h2>JavaScript Quick Start</h2>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{role === 'source' ? `import axios from 'axios';

const API_BASE = 'http://localhost:8080';
let token = '';

// 1. Login
const loginRes = await axios.post(\`\${API_BASE}/auth/login\`, {
  email: 'source@example.com',
  password: 'password123'
});
token = loginRes.data.access;
const companyId = loginRes.data.user.company.id;

// 2. Configure endpoints
await axios.put(
  \`\${API_BASE}/endpoints/config\`,
  {
    httpEndpoint: 'http://localhost:9090',
    grpcEndpoint: 'localhost:51061',
    adapterType: 'grpc'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 3. Import branches
await axios.post(
  \`\${API_BASE}/sources/import-branches\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 4. List branches
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 5. Add location to coverage
await axios.post(
  \`\${API_BASE}/sources/locations\`,
  { unlocode: 'GBMAN' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 6. Test endpoints
const testRes = await axios.post(
  \`\${API_BASE}/endpoints/test\`,
  { testHttp: true, testGrpc: true },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 5. Get endpoint status
const statusRes = await axios.get(
  \`\${API_BASE}/endpoints/status\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 6. Get endpoint config
const configRes = await axios.get(
  \`\${API_BASE}/endpoints/config\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 7. List branches with filters
const branchesRes = await axios.get(
  \`\${API_BASE}/sources/branches?limit=25&offset=0&status=Active&search=Airport\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Branches:', branchesRes.data.items);

// 8. Get branch details
const branchRes = await axios.get(
  \`\${API_BASE}/sources/branches/\${branchId}\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 9. Create a new branch
const newBranchRes = await axios.post(
  \`\${API_BASE}/sources/branches\`,
  {
    branchCode: 'BR001',
    name: 'Manchester Airport',
    natoLocode: 'GBMAN',
    latitude: 53.3656,
    longitude: -2.2729,
    city: 'Manchester',
    country: 'United Kingdom',
    countryCode: 'GB'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 10. Update branch
await axios.patch(
  \`\${API_BASE}/sources/branches/\${branchId}\`,
  { natoLocode: 'GBMAN', city: 'Manchester', country: 'United Kingdom' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 11. Get unmapped branches (branches without UN/LOCODE)
const unmappedRes = await axios.get(
  \`\${API_BASE}/sources/branches/unmapped?limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 12. Upload branches from JSON file
const uploadRes = await axios.post(
  \`\${API_BASE}/sources/upload-branches\`,
  { branches: [/* array of branch objects */] },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 13. Search UN/LOCODE locations
const locationsRes = await axios.get(
  \`\${API_BASE}/sources/locations/search?query=Manchester&limit=25\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Locations:', locationsRes.data.items);

// 12. Add location to coverage
await axios.post(
  \`\${API_BASE}/sources/locations\`,
  { unlocode: 'GBMAN' },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 13. Remove location from coverage
await axios.delete(
  \`\${API_BASE}/sources/locations/GBMAN\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 14. Sync location coverage from gRPC adapter
await axios.post(
  \`\${API_BASE}/coverage/source/\${companyId}/sync\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 17. Create draft agreement
const agreementRes = await axios.post(
  \`\${API_BASE}/agreements\`,
  {
    agent_id: 'agent_company_id',
    source_id: companyId,
    agreement_ref: 'AG-2025-001',
    valid_from: '2025-01-01T00:00:00Z',
    valid_to: '2025-12-31T23:59:59Z'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);
const agreementId = agreementRes.data.id;

// 18. Offer agreement to agent
await axios.post(
  \`\${API_BASE}/agreements/\${agreementId}/offer\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 19. List all agents with their agreements
const agentsRes = await axios.get(
  \`\${API_BASE}/agreements/all?status=ACTIVE\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 20. Check for duplicate agreement
const duplicateCheck = await axios.post(
  \`\${API_BASE}/agreements/check-duplicate\`,
  {
    sourceId: companyId,
    agentId: 'agent_company_id',
    agreementRef: 'AG-2025-001'
  },
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 21. Get health status (slowRate, backoffLevel, excludedUntil)
const healthRes = await axios.get(
  \`\${API_BASE}/health/my-source\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);
console.log('Health:', healthRes.data);

// 22. Run comprehensive source verification
await axios.post(
  \`\${API_BASE}/verification/source/run\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 23. Get endpoint status and health
const statusRes = await axios.get(
  \`\${API_BASE}/endpoints/status\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 24. Get source notifications
const notificationsRes = await axios.get(
  \`\${API_BASE}/endpoints/notifications?limit=50&unreadOnly=true\`,
  { headers: { Authorization: \`Bearer \${token}\` } }
);

// 25. Mark notification as read
await axios.post(
  \`\${API_BASE}/endpoints/notifications/\${notificationId}/read\`,
  {},
  { headers: { Authorization: \`Bearer \${token}\` } }
);` : `// Agent SDK examples...`}</pre>
            </div>
          </section>
          <section>
            <h2>Installation</h2>
            <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`npm install axios
# or
yarn add axios`}</pre>
            </div>
          </section>

          <section>
            <h2>Documentation Links</h2>
            <div style={{ marginTop: '1rem' }}>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a href="../../sdk/javascript/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    📖 Full README
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a href="../../sdk/javascript/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    📚 API Reference
                  </a>
                </li>
                <li style={{ marginBottom: '0.75rem' }}>
                  <a href="../../sdk/javascript/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                    💡 Examples
                  </a>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2>Error Handling</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>Always implement proper error handling for robust integrations:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
              <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`try {
  const response = await axios.get(\`\${API_BASE}/sources/branches\`, {
    headers: { Authorization: \`Bearer \${token}\` }
  });
  console.log('Branches:', response.data.items);
} catch (error) {
  if (error.response) {
    // API returned error response
    console.error('API Error:', error.response.data.error);
    console.error('Message:', error.response.data.message);
  } else {
    // Network or other error
    console.error('Network Error:', error.message);
  }
}`}</pre>
            </div>
          </section>
        </>
      )}

      {/* Go SDK Section */}
      {activeSdk === 'go' && (
        <section>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Go SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Go SDK for high-performance integrations using standard HTTP client.
        </p>

        <section>
          <h2>Go Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`package main

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
    
    // 4. Get endpoint status
    req, _ = http.NewRequest("GET", API_BASE+"/endpoints/status", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 5. Import branches from supplier endpoint
    req, _ = http.NewRequest("POST", API_BASE+"/sources/import-branches", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 6. List branches with filters
    req, _ = http.NewRequest("GET", API_BASE+"/sources/branches?limit=25&offset=0&status=Active", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    resp, _ = client.Do(req)
    var branchesResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&branchesResp)
    fmt.Println("Branches:", branchesResp["items"])
    
    // 7. Get branch details
    req, _ = http.NewRequest("GET", API_BASE+"/sources/branches/"+branchId, nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 8. Create a new branch
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
    
    // 9. Update branch
    patchData, _ := json.Marshal(map[string]interface{}{"natoLocode": "GBMAN", "city": "Manchester"})
    req, _ = http.NewRequest("PATCH", API_BASE+"/sources/branches/"+branchId, bytes.NewBuffer(patchData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 10. Get unmapped branches
    req, _ = http.NewRequest("GET", API_BASE+"/sources/branches/unmapped?limit=25", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 11. Search UN/LOCODE locations
    req, _ = http.NewRequest("GET", API_BASE+"/sources/locations/search?query=Manchester&limit=25", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 12. Add location to coverage
    locData, _ := json.Marshal(map[string]string{"unlocode": "GBMAN"})
    req, _ = http.NewRequest("POST", API_BASE+"/sources/locations", bytes.NewBuffer(locData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 13. Remove location from coverage
    req, _ = http.NewRequest("DELETE", API_BASE+"/sources/locations/GBMAN", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 14. Sync location coverage
    req, _ = http.NewRequest("POST", API_BASE+"/coverage/source/"+companyId+"/sync", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 15. Create agreement
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
    
    // 16. Offer agreement
    req, _ = http.NewRequest("POST", API_BASE+"/agreements/"+agreementId+"/offer", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 17. List all agents with agreements
    req, _ = http.NewRequest("GET", API_BASE+"/agreements/all?status=ACTIVE", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 18. Check for duplicate agreement
    duplicateData, _ := json.Marshal(map[string]string{
        "sourceId":      companyId,
        "agentId":       "agent_company_id",
        "agreementRef":  "AG-2025-001",
    })
    req, _ = http.NewRequest("POST", API_BASE+"/agreements/check-duplicate", bytes.NewBuffer(duplicateData))
    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")
    client.Do(req)
    
    // 19. Get health status
    req, _ = http.NewRequest("GET", API_BASE+"/health/my-source", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    resp, _ = client.Do(req)
    var healthResp map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&healthResp)
    fmt.Println("Health:", healthResp)
    
    // 20. Run verification
    req, _ = http.NewRequest("POST", API_BASE+"/verification/source/run", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 21. Get notifications
    req, _ = http.NewRequest("GET", API_BASE+"/endpoints/notifications?limit=50&unreadOnly=true", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
    
    // 22. Mark notification as read
    req, _ = http.NewRequest("POST", API_BASE+"/endpoints/notifications/"+notificationId+"/read", nil)
    req.Header.Set("Authorization", "Bearer "+token)
    client.Do(req)
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`go get carhire/middleware-go`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📚 API Reference
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/golang/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  💡 Examples
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`go get github.com/gorilla/http
# or use standard net/http package`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <p>Handle HTTP errors and API responses:</p>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`resp, err := client.Do(req)
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
json.NewDecoder(resp.Body).Decode(&data)`}</pre>
          </div>
        </section>
        </section>
      )}

      {/* PHP SDK Section */}
      {activeSdk === 'php' && (
        <section>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>PHP SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready PHP SDK for server-side integration using cURL or Guzzle HTTP client.
        </p>

        <section>
          <h2>PHP Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`<?php

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

// 4. Get endpoint status
$status = apiRequest('GET', '/endpoints/status');

// 5. Import branches from supplier endpoint
apiRequest('POST', '/sources/import-branches');

// 6. List branches with filters
$branches = apiRequest('GET', '/sources/branches?limit=25&offset=0&status=Active');
echo "Found " . count($branches['items']) . " branches\\n";

// 7. Get branch details
$branch = apiRequest('GET', '/sources/branches/' . $branchId);

// 8. Create a new branch
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

// 9. Update branch
apiRequest('PATCH', '/sources/branches/' . $branchId, [
    'natoLocode' => 'GBMAN',
    'city' => 'Manchester'
]);

// 10. Get unmapped branches
$unmapped = apiRequest('GET', '/sources/branches/unmapped?limit=25');

// 11. Search UN/LOCODE locations
$locations = apiRequest('GET', '/sources/locations/search?query=Manchester&limit=25');
echo "Found " . count($locations['items']) . " locations\\n";

// 12. Add location to coverage
apiRequest('POST', '/sources/locations', ['unlocode' => 'GBMAN']);

// 13. Remove location from coverage
apiRequest('DELETE', '/sources/locations/GBMAN');

// 14. Sync location coverage
apiRequest('POST', '/coverage/source/' . $companyId . '/sync');

// 15. Create agreement
$agreement = apiRequest('POST', '/agreements', [
    'agent_id' => 'agent_company_id',
    'source_id' => $companyId,
    'agreement_ref' => 'AG-2025-001',
    'valid_from' => '2025-01-01T00:00:00Z',
    'valid_to' => '2025-12-31T23:59:59Z'
]);

// 16. Offer agreement
apiRequest('POST', '/agreements/' . $agreement['id'] . '/offer');

// 17. List all agents with agreements
$agents = apiRequest('GET', '/agreements/all?status=ACTIVE');

// 18. Check for duplicate agreement
apiRequest('POST', '/agreements/check-duplicate', [
    'sourceId' => $companyId,
    'agentId' => 'agent_company_id',
    'agreementRef' => 'AG-2025-001'
]);

// 19. Get health status
$health = apiRequest('GET', '/health/my-source');
echo "Health: " . json_encode($health) . "\\n";

// 20. Run verification
apiRequest('POST', '/verification/source/run');

// 21. Get notifications
$notifications = apiRequest('GET', '/endpoints/notifications?limit=50&unreadOnly=true');

// 22. Mark notification as read
apiRequest('POST', '/endpoints/notifications/' . $notificationId . '/read');`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`composer require carhire/middleware-php`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/REFERENCE.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📚 API Reference
                </a>
              </li>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/php/examples/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  💡 Examples
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2>Availability Long-polling</h2>
          <p>The SDK supports generator-based streaming for real-time availability updates:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Generator-based streaming (Recommended)
foreach ($client->availability->stream($requestId) as $offers) {
    echo "Received " . count($offers) . " offer(s)\\n";
}

// Blocking until complete
$final = $client->availability->untilComplete($requestId);
echo "Final status: {$final['status']}\\n";`}</pre>
          </div>
        </section>

        <section>
          <h2>Booking Pass-through</h2>
          <p>Create, modify, cancel, and check bookings with automatic idempotency:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`// Create booking
$booking = $client->bookings->create([
    'agreement_ref' => 'AG-2025-001',
    'agent_booking_ref' => 'BOOK-123',
]);

// Check booking status
$status = $client->bookings->check(
    'supplier-booking-ref',
    'AG-2025-001'
);`}</pre>
          </div>
        </section>

        <section>
          <h2>Error Handling</h2>
          <p>All errors are thrown as <code>CarHireException</code> with structured information:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use CarHire\\CarHireException;

try {
    $agreements = $client->agreements->list();
} catch (CarHireException $e) {
    echo "Status: {$e->status}\\n";
    echo "Code: {$e->sdkCode}\\n";
    echo "Message: {$e->getMessage()}\\n";
}`}</pre>
          </div>
        </section>

        <section>
          <h2>Retries Configuration</h2>
          <p>Enable automatic retries with exponential backoff for transient failures:</p>
            <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use CarHire\\Client;
use CarHire\\Retry;

$client = new Client([
    'baseUrl' => 'https://api.carhire.example.com',
    'retry' => new Retry(
        enabled: true,
        maxRetries: 3,
        baseMs: 300,
        factor: 2.0
    ),
]);`}</pre>
          </div>
        </section>
        </section>
      )}

      {/* Python SDK Section */}
      {activeSdk === 'python' && (
        <section>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Python SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Python SDK using the requests library for HTTP operations.
        </p>

        <section>
          <h2>Python Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import requests
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

# 4. Get endpoint status
status = api_request('GET', '/endpoints/status')

# 5. Import branches from supplier endpoint
api_request('POST', '/sources/import-branches')

# 6. List branches with filters
branches = api_request('GET', '/sources/branches?limit=25&offset=0&status=Active')
print(f"Found {len(branches['items'])} branches")

# 7. Get branch details
branch = api_request('GET', f'/sources/branches/{branch_id}')

# 8. Create a new branch
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

# 9. Update branch
api_request('PATCH', f'/sources/branches/{branch_id}', {
    'natoLocode': 'GBMAN',
    'city': 'Manchester'
})

# 10. Get unmapped branches
unmapped = api_request('GET', '/sources/branches/unmapped?limit=25')

# 11. Search UN/LOCODE locations
locations = api_request('GET', '/sources/locations/search?query=Manchester&limit=25')
print(f"Found {len(locations['items'])} locations")

# 12. Add location to coverage
api_request('POST', '/sources/locations', {'unlocode': 'GBMAN'})

# 13. Remove location from coverage
api_request('DELETE', '/sources/locations/GBMAN')

# 14. Sync location coverage
api_request('POST', f'/coverage/source/{company_id}/sync')

# 15. Create agreement
agreement = api_request('POST', '/agreements', {
    'agent_id': 'agent_company_id',
    'source_id': company_id,
    'agreement_ref': 'AG-2025-001',
    'valid_from': '2025-01-01T00:00:00Z',
    'valid_to': '2025-12-31T23:59:59Z'
})

# 16. Offer agreement
api_request('POST', f"/agreements/{agreement['id']}/offer")

# 17. List all agents with agreements
agents = api_request('GET', '/agreements/all?status=ACTIVE')

# 18. Check for duplicate agreement
api_request('POST', '/agreements/check-duplicate', {
    'sourceId': company_id,
    'agentId': 'agent_company_id',
    'agreementRef': 'AG-2025-001'
})

# 19. Get health status
health = api_request('GET', '/health/my-source')
print(f"Health: {health}")

# 20. Run verification
api_request('POST', '/verification/source/run')

# 21. Get notifications
notifications = api_request('GET', '/endpoints/notifications?limit=50&unreadOnly=true')

# 22. Mark notification as read
api_request('POST', f'/endpoints/notifications/{notification_id}/read')`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`pip install requests`}</pre>
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            The examples above use the <code>requests</code> library, which is the standard HTTP client for Python.
          </p>
        </section>
        </section>
      )}

      {/* Java SDK Section */}
      {activeSdk === 'java' && (
        <section>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Java SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Java SDK using Java 11+ built-in HTTP client with Jackson for JSON.
        </p>

        <section>
          <h2>Java Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`import java.net.http.*;
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

// 3. Test endpoints
Map<String, Boolean> testData = Map.of("testHttp", true, "testGrpc", true);
HttpRequest testReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/endpoints/test"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(testData)))
    .build();
client.send(testReq, HttpResponse.BodyHandlers.ofString());

// 4. Get endpoint status
HttpRequest statusReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/endpoints/status"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(statusReq, HttpResponse.BodyHandlers.ofString());

// 5. Import branches
HttpRequest importReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/import-branches"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(importReq, HttpResponse.BodyHandlers.ofString());

// 6. List branches with filters
HttpRequest branchesReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches?limit=25&offset=0&status=Active"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
HttpResponse<String> branchesResp = client.send(branchesReq, HttpResponse.BodyHandlers.ofString());
Map<String, Object> branches = mapper.readValue(branchesResp.body(), Map.class);
System.out.println("Branches: " + branches.get("items"));

// 7. Get branch details
HttpRequest branchReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches/" + branchId))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(branchReq, HttpResponse.BodyHandlers.ofString());

// 8. Create branch
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

// 9. Update branch
Map<String, String> patchData = Map.of("natoLocode", "GBMAN", "city", "Manchester");
HttpRequest updateReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches/" + branchId))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .method("PATCH", HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(patchData)))
    .build();
client.send(updateReq, HttpResponse.BodyHandlers.ofString());

// 10. Get unmapped branches
HttpRequest unmappedReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/branches/unmapped?limit=25"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(unmappedReq, HttpResponse.BodyHandlers.ofString());

// 11. Search locations
HttpRequest locationsReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/locations/search?query=Manchester&limit=25"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(locationsReq, HttpResponse.BodyHandlers.ofString());

// 12. Add location to coverage
Map<String, String> locData = Map.of("unlocode", "GBMAN");
HttpRequest addLocReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/locations"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(locData)))
    .build();
client.send(addLocReq, HttpResponse.BodyHandlers.ofString());

// 13. Remove location
HttpRequest removeLocReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/sources/locations/GBMAN"))
    .header("Authorization", "Bearer " + token)
    .DELETE()
    .build();
client.send(removeLocReq, HttpResponse.BodyHandlers.ofString());

// 14. Sync location coverage
HttpRequest syncReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/coverage/source/" + companyId + "/sync"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(syncReq, HttpResponse.BodyHandlers.ofString());

// 15. Create agreement
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

// 16. Offer agreement
HttpRequest offerReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/agreements/" + agreementId + "/offer"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(offerReq, HttpResponse.BodyHandlers.ofString());

// 17. List agreements
HttpRequest listAgreementsReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/agreements/all?status=ACTIVE"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(listAgreementsReq, HttpResponse.BodyHandlers.ofString());

// 18. Check duplicate
Map<String, String> duplicateData = Map.of(
    "sourceId", companyId,
    "agentId", "agent_company_id",
    "agreementRef", "AG-2025-001"
);
HttpRequest duplicateReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/agreements/check-duplicate"))
    .header("Authorization", "Bearer " + token)
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(duplicateData)))
    .build();
client.send(duplicateReq, HttpResponse.BodyHandlers.ofString());

// 19. Get health
HttpRequest healthReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/health/my-source"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
HttpResponse<String> healthResp = client.send(healthReq, HttpResponse.BodyHandlers.ofString());
System.out.println("Health: " + healthResp.body());

// 20. Run verification
HttpRequest verifyReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/verification/source/run"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(verifyReq, HttpResponse.BodyHandlers.ofString());

// 21. Get notifications
HttpRequest notificationsReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/endpoints/notifications?limit=50&unreadOnly=true"))
    .header("Authorization", "Bearer " + token)
    .GET()
    .build();
client.send(notificationsReq, HttpResponse.BodyHandlers.ofString());

// 22. Mark notification as read
HttpRequest readReq = HttpRequest.newBuilder()
    .uri(URI.create(API_BASE + "/endpoints/notifications/" + notificationId + "/read"))
    .header("Authorization", "Bearer " + token)
    .POST(HttpRequest.BodyPublishers.noBody())
    .build();
client.send(readReq, HttpResponse.BodyHandlers.ofString());`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`// Use Java 11+ built-in HTTP client
// Add Jackson for JSON:
// Maven:
<dependency>
    <groupId>com.fasterxml.jackson.core</groupId>
    <artifactId>jackson-databind</artifactId>
    <version>2.15.0</version>
</dependency>`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/java/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}

      {/* Perl SDK Section */}
      {activeSdk === 'perl' && (
        <section>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '1rem', color: '#1f2937' }}>Perl SDK</h1>
        <p style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '2rem' }}>
          Production-ready Perl SDK using LWP::UserAgent for HTTP operations.
        </p>

        <section>
          <h2>Perl Quick Start</h2>
          <div style={{ backgroundColor: '#1f2937', color: '#f9fafb', padding: '1.5rem', borderRadius: '0.25rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', lineHeight: '1.5', fontFamily: 'Monaco, Menlo, monospace', whiteSpace: 'pre-wrap' }}>{`use LWP::UserAgent;
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

# 4. Get endpoint status
my $status = api_request('GET', '/endpoints/status');

# 5. Import branches from supplier endpoint
api_request('POST', '/sources/import-branches');

# 6. List branches with filters
my $branches = api_request('GET', '/sources/branches?limit=25&offset=0&status=Active');
print "Found " . scalar(@{$branches->{items}}) . " branches\\n";

# 7. Get branch details
my $branch = api_request('GET', "/sources/branches/$branch_id");

# 8. Create a new branch
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

# 9. Update branch
api_request('PATCH', "/sources/branches/$branch_id", {
    natoLocode => 'GBMAN',
    city => 'Manchester'
});

# 10. Get unmapped branches
my $unmapped = api_request('GET', '/sources/branches/unmapped?limit=25');

# 11. Search UN/LOCODE locations
my $locations = api_request('GET', '/sources/locations/search?query=Manchester&limit=25');
print "Found " . scalar(@{$locations->{items}}) . " locations\\n";

# 12. Add location to coverage
api_request('POST', '/sources/locations', { unlocode => 'GBMAN' });

# 13. Remove location from coverage
api_request('DELETE', '/sources/locations/GBMAN');

# 14. Sync location coverage
api_request('POST', "/coverage/source/$company_id/sync");

# 15. Create agreement
my $agreement = api_request('POST', '/agreements', {
    agent_id => 'agent_company_id',
    source_id => $company_id,
    agreement_ref => 'AG-2025-001',
    valid_from => '2025-01-01T00:00:00Z',
    valid_to => '2025-12-31T23:59:59Z'
});

# 16. Offer agreement
api_request('POST', "/agreements/$agreement->{id}/offer");

# 17. List all agents with agreements
my $agents = api_request('GET', '/agreements/all?status=ACTIVE');

# 18. Check for duplicate agreement
api_request('POST', '/agreements/check-duplicate', {
    sourceId => $company_id,
    agentId => 'agent_company_id',
    agreementRef => 'AG-2025-001'
});

# 19. Get health status
my $health = api_request('GET', '/health/my-source');
print "Health: " . $json->encode($health) . "\\n";

# 20. Run verification
api_request('POST', '/verification/source/run');

# 21. Get notifications
my $notifications = api_request('GET', '/endpoints/notifications?limit=50&unreadOnly=true');

# 22. Mark notification as read
api_request('POST', "/endpoints/notifications/$notification_id/read");`}</pre>
          </div>
        </section>

        <section>
          <h2>Installation</h2>
          <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '0.25rem', padding: '1rem', marginTop: '1rem' }}>
            <pre style={{ margin: 0, fontSize: '0.875rem', fontFamily: 'Monaco, Menlo, monospace' }}>{`cpanm LWP::UserAgent JSON`}</pre>
          </div>
        </section>

        <section>
          <h2>Documentation Links</h2>
          <div style={{ marginTop: '1rem' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '0.75rem' }}>
                <a href="../../sdk/perl/README.md" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
                  📖 Full README
                </a>
              </li>
            </ul>
          </div>
        </section>
        </section>
      )}
    </div>
  );
};

export default SdkGuide;

