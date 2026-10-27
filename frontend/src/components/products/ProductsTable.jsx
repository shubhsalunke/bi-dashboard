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
  onViewDetails,
}) => {
  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            <TableHeader label="ID" field="id" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="SKU" field="sku" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Product Name" field="product_name" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Brand" field="brand" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Category" field="category" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Unit Price" field="unit_price" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Stock" field="stock_quantity" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Units Sold" field="units_sold" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Revenue" field="total_revenue" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Status" />
            {canManage && <TableHeader label="Actions" />}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const stock = p.stock_quantity ?? 0;
            const reorderLevel = p.reorder_level ?? 10;
            const isOutOfStock = stock === 0;
            const isLowStock = !isOutOfStock && stock <= reorderLevel;

            return (
              <tr key={p.id}>
                <td className="tabular-nums" style={{ color: 'var(--text-muted)' }}>#{p.id}</td>
                <td className="tabular-nums" style={{ fontSize: '0.8125rem' }}>{p.sku || '—'}</td>
                <td style={{ fontWeight: 500 }}>
                  <button
                    type="button"
                    onClick={() => onViewDetails && onViewDetails(p)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: 'var(--primary, #0d9488)',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      font: 'inherit',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    title="View product details"
                  >
                    {p.product_name}
                  </button>
                </td>
                <td>{p.brand || '—'}</td>
                <td>{p.category}</td>
                <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(p.unit_price)}</td>
                <td className="tabular-nums">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span>{stock}</span>
                    {isOutOfStock && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: 'var(--danger, #dc2626)',
                        }}
                      >
                        Out of stock
                      </span>
                    )}
                    {isLowStock && (
                      <span
                        style={{
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          color: 'var(--warning, #d97706)',
                        }}
                      >
                        Low stock
                      </span>
                    )}
                  </div>
                </td>
                <td className="tabular-nums">{p.units_sold ?? 0}</td>
                <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(p.total_revenue ?? 0)}</td>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTable;
