import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Badge } from '../common/Badge';
import { TableHeader } from '../common/TableHeader';
import { formatCurrency } from '../../utils/format';

export const ProductsTable = ({
  products,
  sortField,
  sortAsc,
  onSort,
  canManage,
  onEdit,
  onToggleStatus,
}) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <TableHeader label="ID" field="id" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Product Name" field="product_name" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Category" field="category" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Unit Price" field="unit_price" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Status" />
            {canManage && <TableHeader label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
              <td style={{ fontWeight: 500 }}>{p.product_name}</td>
              <td>{p.category}</td>
              <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price)}</td>
              <td>
                <Badge status={p.is_active ? 'active' : 'inactive'} />
              </td>
              {canManage && (
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEdit(p)}
                      title="Edit product"
                      style={{ padding: '4px 8px' }}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onToggleStatus(p)}
                      title="Toggle status"
                      style={{ padding: '4px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
