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
            <TableHeader label="Industry" field="industry" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Customer Type" field="customer_type" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Status" />
            <TableHeader label="Actions" align="right" />
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id}>
              <td className="tabular-nums" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                {c.customer_code}
              </td>
              <td>
                <Link to={`/customers/${c.id}`} className="table-link">
                  {c.customer_name}
                </Link>
              </td>
              <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
              <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>{c.phone || '-'}</td>
              <td>{c.city}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{c.industry || '-'}</td>
              <td style={{ color: 'var(--text-secondary)' }}>{c.customer_type || '-'}</td>
              <td>
                <Badge status={c.status} />
              </td>
              <td>
                <div className="table-actions">
                  <Link
                    to={`/customers/${c.id}`}
                    className="btn btn-secondary btn-icon"
                    title="View customer"
                    aria-label={`View ${c.customer_name}`}
                  >
                    <Eye size={14} aria-hidden="true" />
                  </Link>
                  {canManage && (
                    <>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => onEdit(c)}
                        title="Edit customer"
                        aria-label={`Edit ${c.customer_name}`}
                      >
                        <Edit2 size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon"
                        onClick={() => onDelete(c)}
                        title="Delete customer"
                        aria-label={`Delete ${c.customer_name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
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
