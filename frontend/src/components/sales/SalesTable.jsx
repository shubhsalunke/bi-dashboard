import React from 'react';
import { Eye } from 'lucide-react';
import { Badge } from '../common/Badge';
import { TableHeader } from '../common/TableHeader';
import { formatCurrency, formatDate } from '../../utils/format';

export const SalesTable = ({
  sales,
  sortField,
  sortAsc,
  onSort,
  onView,
}) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <TableHeader label="Sale ID" field="id" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Customer" field="customer_name" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Date" field="sale_date" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Total Amount" field="total_amount" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Status" />
            <TableHeader label="Actions" />
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="tabular-nums" style={{ fontWeight: 500, color: 'var(--primary)' }}>#{s.id}</td>
              <td>
                <div style={{ fontWeight: 500 }}>{s.customer_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.city}</div>
              </td>
              <td className="tabular-nums">{formatDate(s.sale_date)}</td>
              <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(s.total_amount)}</td>
              <td>
                <Badge status={s.status} />
              </td>
              <td>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onView(s.id)}
                  title="View sale items"
                  style={{ padding: '4px 8px' }}
                >
                  <Eye size={13} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;
