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
            <TableHeader label="Total Amount" field="total_amount" sortField={sortField} sortAsc={sortAsc} onSort={onSort} align="right" />
            <TableHeader label="Status" />
            <TableHeader label="Actions" align="right" />
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="tabular-nums" style={{ fontWeight: 500, color: 'var(--accent-text)' }}>
                #{s.id}
              </td>
              <td>
                <div className="cell-primary">{s.customer_name}</div>
                <div className="cell-secondary">{s.city}</div>
              </td>
              <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(s.sale_date)}
              </td>
              <td className="num cell-primary">{formatCurrency(s.total_amount)}</td>
              <td>
                <Badge status={s.status} />
              </td>
              <td>
                <div className="table-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-icon"
                    onClick={() => onView(s.id)}
                    title="View sale items"
                    aria-label={`View sale #${s.id} details`}
                  >
                    <Eye size={14} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesTable;
