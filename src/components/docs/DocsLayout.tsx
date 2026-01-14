import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import SdkGuide from './SdkGuide';
import GettingStartedGuide from './GettingStartedGuide';
import SourceApiReference from './SourceApiReference';
import './docs.css';

type DocCodeSample = {
  lang: string;
  label: string;
  code: string;
};

type DocEndpoint = {
  id: string;
  name: string;
  description?: string;
  method: string;
  path: string;
  headers?: { name: string; required: boolean; description?: string }[];
  query?: { name: string; required: boolean; type?: string; description?: string }[];
  body?: { name: string; required: boolean; type?: string; description?: string }[];
  responses?: { status: number; description?: string; bodyExample?: any }[];
  codeSamples?: DocCodeSample[];
};

type DocCategory = {
  id: string;
  name: string;
  description?: string;
  endpoints: DocEndpoint[];
};

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f97316',
  DELETE: '#ef4444',
  PATCH: '#a855f7',
};

const DocsLayout: React.FC = () => {
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCode, setActiveCode] = useState<string>('curl');
  const [showSdkGuide, setShowSdkGuide] = useState<boolean>(false);
  const [showGettingStarted, setShowGettingStarted] = useState<boolean>(false);
  const [showApiReference, setShowApiReference] = useState<boolean>(false);
  const [companyId, setCompanyId] = useState<string>('YOUR_COMPANY_ID');
  const [companyType, setCompanyType] = useState<string>('SOURCE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load user info for code sample replacement
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

    // source gets source-filtered docs
    setIsLoading(true);
    setError(null);
    api.get('/docs/source').then((res) => {
      setCategories(res.data);
      const firstCat = res.data[0];
      if (firstCat && firstCat.endpoints && firstCat.endpoints[0]) {
        setSelectedEndpoint(firstCat.endpoints[0]);
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error('Failed to load docs:', err);
      setError(err.response?.data?.message || 'Failed to load documentation');
      setIsLoading(false);
    });
  }, []);

  // Replace placeholders in code samples with actual company ID
  const processCodeSample = (code: string): string => {
    if (!code) return code;
    return code
      .replace(/YOUR_COMPANY_ID/g, companyId)
      .replace(/YOUR_SOURCE_ID/g, companyId)
      .replace(/YOUR_COMPANY_ID/g, companyId)
      // Handle template literal cases: ${BASE_URL}/coverage/source/YOUR_COMPANY_ID
      .replace(/\$\{BASE_URL\}\/coverage\/source\/YOUR_COMPANY_ID/g, `\${BASE_URL}/coverage/source/${companyId}`)
      .replace(/\/coverage\/source\/YOUR_COMPANY_ID/g, `/coverage/source/${companyId}`)
      .replace(/\/coverage\/source\/:sourceId/g, `/coverage/source/${companyId}`)
      .replace(/<token>/g, '<your-token>');
  };

  // Filter endpoints based on search query
  const filteredCategories = categories.map(cat => ({
    ...cat,
    endpoints: cat.endpoints.filter(ep => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        ep.name.toLowerCase().includes(query) ||
        ep.path.toLowerCase().includes(query) ||
        ep.method.toLowerCase().includes(query) ||
        ep.description?.toLowerCase().includes(query) ||
        cat.name.toLowerCase().includes(query)
      );
    })
  })).filter(cat => cat.endpoints.length > 0);

  if (isLoading) {
    return (
      <div className="docs-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📚</div>
          <div style={{ color: '#6b7280' }}>Loading documentation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="docs-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ color: '#ef4444', fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Error Loading Documentation</div>
          <div style={{ color: '#6b7280' }}>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="docs-shell">
      <aside className="docs-sidebar">
        {/* Search Bar */}
        <div style={{ marginBottom: '1rem', position: 'sticky', top: 0, zIndex: 10, background: '#fff', paddingBottom: '0.5rem' }}>
          <input
            type="text"
            placeholder="Search endpoints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              background: '#fff',
            }}
          />
        </div>

        <div className="docs-cat">
          <button
            className={`docs-endpoint-btn ${showGettingStarted ? 'active' : ''}`}
            onClick={() => {
              setShowGettingStarted(true);
              setShowSdkGuide(false);
              setShowApiReference(false);
              setSelectedEndpoint(null);
              setSearchQuery('');
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem', marginBottom: '0.5rem' }}
          >
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>🚀</span>
            <span style={{ fontWeight: 600 }}>Getting Started</span>
          </button>
          <button
            className={`docs-endpoint-btn ${showApiReference ? 'active' : ''}`}
            onClick={() => {
              setShowApiReference(true);
              setShowSdkGuide(false);
              setShowGettingStarted(false);
              setSelectedEndpoint(null);
              setSearchQuery('');
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem', marginBottom: '0.5rem' }}
          >
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📖</span>
            <span style={{ fontWeight: 600 }}>API Reference</span>
          </button>
          <button
            className={`docs-endpoint-btn ${showSdkGuide ? 'active' : ''}`}
            onClick={() => {
              setShowSdkGuide(true);
              setShowGettingStarted(false);
              setShowApiReference(false);
              setSelectedEndpoint(null);
              setSearchQuery('');
            }}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem' }}
          >
            <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>📚</span>
            <span style={{ fontWeight: 600 }}>SDK Guide</span>
          </button>
        </div>
        {filteredCategories.length === 0 && searchQuery ? (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#6b7280' }}>
            No endpoints found matching "{searchQuery}"
          </div>
        ) : (
          filteredCategories.map((cat) => (
          <div key={cat.id} className="docs-cat">
            <div className="docs-cat-title">{cat.name}</div>
            {cat.endpoints.map((ep) => (
              <button
                key={ep.id}
                className={`docs-endpoint-btn ${selectedEndpoint?.id === ep.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedEndpoint(ep);
                  setActiveCode(ep.codeSamples?.[0]?.lang ?? 'curl');
                  setShowSdkGuide(false);
                  setShowGettingStarted(false);
                  setShowApiReference(false);
                }}
              >
                <span className="method" style={{ background: METHOD_COLORS[ep.method] || '#6b7280' }}>
                  {ep.method}
                </span>
                <span className="path">{ep.path}</span>
              </button>
            ))}
          </div>
        ))
        )}
      </aside>
      <main className="docs-main">
        {showGettingStarted ? (
          <GettingStartedGuide />
        ) : showApiReference ? (
          <SourceApiReference />
        ) : showSdkGuide ? (
          <SdkGuide role="source" />
        ) : selectedEndpoint && (
          <div style={{ display: 'flex', gap: '2rem' }}>
            {/* Main Content Area */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1>{selectedEndpoint.name}</h1>
              {selectedEndpoint.description && (
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{selectedEndpoint.description}</p>
              )}

              {/* 1. URL Section - First */}
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>URL</h2>
                <div className="endpoint-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <span className="method-tag" style={{ background: METHOD_COLORS[selectedEndpoint.method] || '#6b7280', color: '#fff', fontSize: '0.875rem', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>
                    {selectedEndpoint.method}
                  </span>
                  <code className="path-code" style={{ background: '#1f2937', color: '#fff', padding: '0.5rem 0.875rem', borderRadius: '0.35rem', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {selectedEndpoint.path}
                  </code>
                </div>
              </section>

              {/* 2. Request Items Section */}
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Request</h2>
                
                {selectedEndpoint.headers && selectedEndpoint.headers.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Headers</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Header</th>
                          <th>Required</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.headers.map((h) => (
                          <tr key={h.name}>
                            <td><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.8125rem' }}>{h.name}</code></td>
                            <td>{h.required ? <span style={{ color: '#ef4444' }}>yes</span> : <span style={{ color: '#6b7280' }}>no</span>}</td>
                            <td>{h.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedEndpoint.query && selectedEndpoint.query.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query Parameters</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Param</th>
                          <th>Required</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.query.map((q) => (
                          <tr key={q.name}>
                            <td><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.8125rem' }}>{q.name}</code></td>
                            <td>{q.required ? <span style={{ color: '#ef4444' }}>yes</span> : <span style={{ color: '#6b7280' }}>no</span>}</td>
                            <td><span style={{ color: '#3b82f6' }}>{q.type ?? '-'}</span></td>
                            <td>{q.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedEndpoint.body && selectedEndpoint.body.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Required</th>
                          <th>Type</th>
                          <th>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEndpoint.body.map((b) => (
                          <tr key={b.name}>
                            <td><code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.8125rem' }}>{b.name}</code></td>
                            <td>{b.required ? <span style={{ color: '#ef4444' }}>yes</span> : <span style={{ color: '#6b7280' }}>no</span>}</td>
                            <td><span style={{ color: '#3b82f6' }}>{b.type ?? '-'}</span></td>
                            <td>{b.description ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(!selectedEndpoint.headers || selectedEndpoint.headers.length === 0) && 
                 (!selectedEndpoint.query || selectedEndpoint.query.length === 0) && 
                 (!selectedEndpoint.body || selectedEndpoint.body.length === 0) && (
                  <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No request parameters required.</p>
                )}
              </section>

              {/* 3. Response Section */}
              {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 && (
                <section style={{ marginBottom: '2rem' }}>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Response</h2>
                  {selectedEndpoint.responses.map((resp, idx) => (
                    <div key={idx} style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ 
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          background: resp.status >= 200 && resp.status < 300 ? '#d1fae5' : resp.status >= 400 ? '#fee2e2' : '#fef3c7',
                          color: resp.status >= 200 && resp.status < 300 ? '#065f46' : resp.status >= 400 ? '#991b1b' : '#92400e'
                        }}>
                          {resp.status}
                        </span>
                        <span style={{ fontWeight: 500, color: '#374151' }}>{resp.description || 'Response'}</span>
                      </div>
                      {resp.bodyExample && (
                        <pre className="code-block" style={{ margin: 0 }}>
                          {JSON.stringify(resp.bodyExample, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {/* SDK Guide Link at Bottom */}
              <section style={{ marginTop: '3rem', padding: '1.5rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0c4a6e', marginBottom: '0.5rem' }}>📚 SDK Guide</h3>
                    <p style={{ fontSize: '0.875rem', color: '#075985', margin: 0 }}>
                      Learn how to integrate using our official SDKs with code examples and best practices.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowSdkGuide(true);
                      setSelectedEndpoint(null);
                    }}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#0284c7',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                  >
                    View SDK Guide →
                  </button>
                </div>
              </section>
            </div>

            {/* Right Sidebar - Format/Schema Information */}
            <aside style={{ width: '320px', flexShrink: 0 }}>
              <div style={{ position: 'sticky', top: '1.5rem' }}>
                <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Format</h3>
                  
                  {/* Request Format */}
                  {(selectedEndpoint.body && selectedEndpoint.body.length > 0) && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>Request Format</h4>
                      <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.75rem', color: '#374151', fontFamily: 'monospace', lineHeight: '1.6' }}>
                          <div style={{ color: '#3b82f6' }}>{'{'}</div>
                          {selectedEndpoint.body.slice(0, 3).map((b, idx) => (
                            <div key={idx} style={{ paddingLeft: '0.75rem' }}>
                              <span style={{ color: '#059669' }}>"{b.name}"</span>
                              <span style={{ color: '#6b7280' }}>: </span>
                              <span style={{ color: '#3b82f6' }}>{b.type || 'string'}</span>
                              {b.required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
                              {idx < Math.min(selectedEndpoint.body.length, 3) - 1 && <span style={{ color: '#6b7280' }}>,</span>}
                            </div>
                          ))}
                          {selectedEndpoint.body.length > 3 && (
                            <div style={{ paddingLeft: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>...</div>
                          )}
                          <div style={{ color: '#3b82f6' }}>{'}'}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response Format - Always show if endpoint has responses */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>Response Format</h4>
                    {selectedEndpoint.responses && selectedEndpoint.responses.length > 0 ? (
                      selectedEndpoint.responses[0].bodyExample ? (
                        <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb', maxHeight: '200px', overflow: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: '0.7rem', color: '#374151', fontFamily: 'monospace', lineHeight: '1.5', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {(() => {
                              try {
                                const jsonStr = JSON.stringify(selectedEndpoint.responses[0].bodyExample, null, 2);
                                const lines = jsonStr.split('\n');
                                if (lines.length > 15) {
                                  return lines.slice(0, 15).join('\n') + '\n  ...';
                                }
                                return jsonStr;
                              } catch (e) {
                                return String(selectedEndpoint.responses[0].bodyExample);
                              }
                            })()}
                          </pre>
                        </div>
                      ) : (
                        <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            <span style={{ fontWeight: 600 }}>Status:</span> {selectedEndpoint.responses[0].status} {selectedEndpoint.responses[0].description || ''}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                            Response format details not available
                          </div>
                        </div>
                      )
                    ) : (
                      <div style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                          No response information available
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Authentication */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>Authentication</h4>
                    <div style={{ fontSize: '0.75rem', color: '#374151' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <code style={{ background: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>Authorization</code>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>Bearer token</span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                        Include your JWT token in the Authorization header
                      </div>
                    </div>
                  </div>

                  {/* Base URL */}
                  <div>
                    <h4 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.75rem' }}>Base URL</h4>
                    <code style={{ background: '#f3f4f6', padding: '0.375rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', display: 'block', wordBreak: 'break-all' }}>
                      {typeof window !== 'undefined' ? window.location.origin : 'https://api.example.com'}
                    </code>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
        {!showGettingStarted && !showApiReference && !showSdkGuide && !selectedEndpoint && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
            <p>Select an endpoint from the sidebar to view documentation</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocsLayout;

