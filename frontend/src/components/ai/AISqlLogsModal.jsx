import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import LoadingSkeleton from '../common/LoadingSkeleton';
import EmptyState from '../common/EmptyState';
import Pagination from '../common/Pagination';
import Badge from '../common/Badge';
import { aiApi } from '../../api/ai.api';

export const AISqlLogsModal = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  const loadLogs = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const res = await aiApi.getSqlLogs({ page, limit: 15 });
      setLogs(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      setError(err?.message || 'Failed to load AI SQL audit logs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadLogs(1);
    }
  }, [isOpen, loadLogs]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={860}
      title="AI Assistant SQL Audit Log (Administrator)"
      headerExtra={
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => loadLogs(pagination.page)}
          disabled={loading}
        >
          <RefreshCw size={13} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      }
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <LoadingSkeleton rows={5} columns={5} />
      ) : error ? (
        <EmptyState icon={AlertCircle} title="Unable to load SQL logs" description={error} />
      ) : logs.length === 0 ? (
        <EmptyState title="No AI queries logged yet" message="Executed AI queries and generated SQL appear here." />
      ) : (
        <div className="stack-md">
          <div className="table-responsive">
            <table className="data-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>User</th>
                  <th>Question</th>
                  <th>Generated SQL</th>
                  <th className="num">Rows</th>
                  <th className="num">Duration</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="tabular-nums" style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>{log.user_email || `User #${log.user_id}`}</td>
                    <td style={{ maxWidth: 220 }}>{log.details?.question || '-'}</td>
                    <td style={{ maxWidth: 260 }}>
                      {log.details?.sql ? (
                        <code style={{ fontSize: '0.75rem', wordBreak: 'break-word' }}>
                          {log.details.sql}
                        </code>
                      ) : (
                        <Badge status="neutral">{log.details?.intent || log.action}</Badge>
                      )}
                    </td>
                    <td className="num tabular-nums">{log.details?.rowCount ?? '-'}</td>
                    <td className="num tabular-nums">
                      {log.details?.durationMs !== undefined ? `${log.details.durationMs}ms` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              pageSize={pagination.limit}
              onPageChange={(p) => loadLogs(p)}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default AISqlLogsModal;

