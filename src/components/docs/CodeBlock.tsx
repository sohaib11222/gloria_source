import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
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
            background: copied ? '#1e293b' : '#475569',
            border: '1px solid #64748b',
            borderRadius: '0.25rem',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 500,
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.background = '#64748b';
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.background = '#475569';
            }
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

export default CodeBlock;

