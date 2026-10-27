import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { TableHeader } from '../common/TableHeader';

export const CustomersTable = ({
  customers,
  sortField,
  sortAsc,
  onSort,
  canManage,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <TableHeader label="Code" field="customer_code" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Company Name" field="customer_name" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Contact Email" />
            <TableHeader label="Phone" />
            <TableHeader label="City" field="city" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Status" />
            <TableHeader label="Actions" />
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="tabular-nums" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {c.customer_code}
              </td>
              <td style={{ fontWeight: 500 }}>
                <Link to={`/customers/${c.id}`} style={{ color: 'var(--primary)' }}>
                  {c.customer_name}
                </Link>
              </td>
              <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
              <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{c.phone || '-'}</td>
              <td>{c.city}</td>
              <td>
                <Badge status={c.status} />
              </td>
              <td>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Link
                    to={`/customers/${c.id}`}
                    className="btn btn-secondary btn-sm"
                    title="View customer"
                    style={{ padding: '4px 8px' }}
                  >
                    <Eye size={13} />
                  </Link>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onEdit(c)}
                        title="Edit customer"
                        style={{ padding: '4px 8px' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(c)}
                        title="Delete customer"
                        style={{ padding: '4px 8px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersTable;
