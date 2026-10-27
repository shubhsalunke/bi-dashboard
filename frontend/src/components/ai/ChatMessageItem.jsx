import React from 'react';
import { Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

export const ChatMessageItem = ({
  msg,
  copiedId,
  onCopy,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: msg.role === 'user' ? '75%' : '88%',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '6px',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
          color: msg.role === 'user' ? '#ffffff' : msg.isError ? 'var(--danger)' : 'var(--text-main)',
          border: msg.role === 'user' ? 'none' : '1px solid var(--border-subtle)',
        }}
      >
        {msg.role === 'assistant' && !msg.isError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>Assistant</span>
            <button
              type="button"
              onClick={() => onCopy(msg.text, msg.id)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
              }}
            >
              {copiedId === msg.id ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>

        {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
              <div
                key={key}
                style={{
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  gap: '4px',
                }}
              >
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}:
                </span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {typeof val === 'number' &&
                  (key.toLowerCase().includes('revenue') ||
                    key.toLowerCase().includes('spend') ||
                    key.toLowerCase().includes('amount') ||
                    key.toLowerCase().includes('price'))
                    ? formatCurrency(val, { decimals: 2 })
                    : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {msg.report?.rows && msg.report.rows.length > 0 && msg.report?.columns && (
          <div
            style={{
              marginTop: '12px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {msg.report.reportTitle && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-dark)',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                }}
              >
                {msg.report.reportTitle}
              </div>
            )}
            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {msg.report.columns.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.report.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {msg.report.columns.map((col) => {
                        const cellVal = row[col.key];
                        const isMoney =
                          (col.key === 'total_spent' ||
                            col.key === 'unit_price' ||
                            col.key === 'total_revenue' ||
                            col.key === 'total_amount' ||
                            col.key === 'line_total' ||
                            col.key.toLowerCase().includes('spent') ||
                            col.key.toLowerCase().includes('price') ||
                            (col.key.toLowerCase().includes('amount') && !col.key.toLowerCase().includes('count'))) &&
                          typeof cellVal === 'number';
                        const displayVal = isMoney ? formatCurrency(cellVal) : cellVal;
                        const isNumeric = typeof cellVal === 'number' || (!isNaN(Number(cellVal)) && cellVal !== '');
                        return (
                          <td key={col.key} className={isNumeric ? 'tabular-nums' : ''}>
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <span
        style={{
          fontSize: '0.6875rem',
          color: 'var(--text-dim)',
          alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
        }}
      >
        {msg.timestamp}
      </span>
    </div>
  );
};

export default ChatMessageItem;
