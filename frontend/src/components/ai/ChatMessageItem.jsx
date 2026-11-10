import React from 'react';
import { Copy, Check } from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatCurrency } from '../../utils/format';

const isNumericValue = (val) => {
  if (typeof val === 'number') return true;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return false;
    if (/^[-+]?₹[\d,]+(\.\d+)?$/.test(trimmed)) return true;
    if (!isNaN(Number(trimmed))) return true;
  }
  return false;
};

const isMoneyMetricKey = (key) => {
  const lower = String(key || '').toLowerCase();
  if (lower.includes('count') || lower.includes('percent') || lower.includes('pct') || lower.includes('orders')) {
    return false;
  }
  return (
    lower.includes('revenue') ||
    lower.includes('spend') ||
    lower.includes('spent') ||
    lower.includes('amount') ||
    lower.includes('price') ||
    lower.includes('ordervalue') ||
    lower.includes('order_value') ||
    lower.includes('stock_value') ||
    lower.includes('avg_order') ||
    lower.includes('difference') ||
    lower.includes('drop')
  );
};

const renderMessageText = (text) => {
  if (!text || !text.includes('```')) {
    return <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>;
  }

  const segments = text.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, idx) => {
        if (seg.startsWith('```') && seg.endsWith('```')) {
          const code = seg.replace(/^```[^\n]*\n?/, '').replace(/\n?```$/, '');
          return (
            <pre key={idx} className="chat-code-block">
              <code>{code}</code>
            </pre>
          );
        }
        return <React.Fragment key={idx}>{seg}</React.Fragment>;
      })}
    </div>
  );
};

export const ChatMessageItem = ({
  msg,
  copiedId,
  onCopy,
}) => {
  const isUser = msg.role === 'user';

  const bubbleClass = isUser
    ? 'chat-bubble chat-bubble-user'
    : msg.isError
    ? 'chat-bubble chat-bubble-error'
    : 'chat-bubble chat-bubble-assistant';

  const columnNumericMap = {};
  if (msg.report?.columns && msg.report?.rows?.length > 0) {
    msg.report.columns.forEach((col) => {
      columnNumericMap[col.key] = msg.report.rows.some((row) => isNumericValue(row[col.key]));
    });
  }

  const sqlText = msg.sql || msg.report?.sql || null;
  const assumptionsText = msg.assumptions || msg.report?.assumptions || null;

  return (
    <div className={`chat-msg-row ${isUser ? 'chat-msg-row-user' : 'chat-msg-row-assistant'}`}>
      <div className={bubbleClass}>
        {!isUser && !msg.isError && (
          <div className="chat-assistant-header">
            <span>Assistant</span>
            <button
              type="button"
              onClick={() => onCopy(msg.text, msg.id)}
              className="chat-copy-btn"
              aria-label="Copy response"
            >
              {copiedId === msg.id ? (
                <Check size={12} style={{ color: 'var(--success)' }} aria-hidden="true" />
              ) : (
                <Copy size={12} aria-hidden="true" />
              )}
              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {renderMessageText(msg.text)}

        {msg.report?.summaryMetrics && Object.keys(msg.report.summaryMetrics).length > 0 && (
          <div className="chat-metrics-row">
            {Object.entries(msg.report.summaryMetrics).map(([key, val]) => (
              <div key={key} className="chat-metric-item">
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {key.replace(/([A-Z])/g, ' $1')}:
                </span>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {typeof val === 'number' && isMoneyMetricKey(key)
                    ? formatCurrency(val, { decimals: 2 })
                    : String(val)}
                </span>
              </div>
            ))}
          </div>
        )}

        {msg.report?.rows && msg.report.rows.length > 0 && msg.report?.columns && (
          <div className="chat-table-card">
            {msg.report.reportTitle && (
              <div className="chat-table-title">{msg.report.reportTitle}</div>
            )}
            <div className="table-responsive" style={{ maxHeight: '280px', overflowY: 'auto' }}>
              <table className="data-table" style={{ fontSize: '0.8125rem' }}>
                <thead>
                  <tr>
                    {msg.report.columns.map((col) => (
                      <th key={col.key} className={columnNumericMap[col.key] ? 'num' : ''}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msg.report.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {msg.report.columns.map((col) => {
                        const cellVal = row[col.key];
                        const isNumericInput =
                          typeof cellVal === 'number' ||
                          (typeof cellVal === 'string' && /^-?\d+(\.\d+)?$/.test(cellVal.trim()));
                        const isMoney = isMoneyMetricKey(col.key) && isNumericInput;
                        const displayVal = isMoney ? formatCurrency(cellVal) : cellVal;
                        const isNum = columnNumericMap[col.key];
                        return (
                          <td key={col.key} className={isNum ? 'num' : ''}>
                            {col.key === 'status' && typeof cellVal === 'string' ? (
                              <Badge status={cellVal} />
                            ) : (
                              displayVal
                            )}
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

        {!isUser && !msg.isError && (sqlText || assumptionsText) && (
          <details className="chat-calc-details">
            <summary className="chat-calc-summary">How this was calculated</summary>
            <div className="chat-calc-body">
              {assumptionsText && (
                <div className="chat-calc-assumptions">
                  <strong>Assumptions:</strong> {assumptionsText}
                </div>
              )}
              {sqlText && (
                <pre className="chat-code-block">
                  <code>{sqlText}</code>
                </pre>
              )}
            </div>
          </details>
        )}
      </div>

      <span className={`chat-timestamp tabular-nums ${isUser ? 'chat-timestamp-user' : ''}`}>
        {msg.timestamp}
      </span>
    </div>
  );
};

export default ChatMessageItem;
