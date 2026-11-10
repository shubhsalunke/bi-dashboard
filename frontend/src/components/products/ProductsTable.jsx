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
            <TableHeader label="Product Code" field="sku" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Product Name" field="product_name" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Brand" field="brand" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Category" field="category" sortField={sortField} sortAsc={sortAsc} onSort={onSort} />
            <TableHeader label="Unit Price" field="unit_price" sortField={sortField} sortAsc={sortAsc} onSort={onSort} align="right" />
            <TableHeader label="Stock" field="stock_quantity" sortField={sortField} sortAsc={sortAsc} onSort={onSort} align="right" />
            <TableHeader label="Units Sold" field="units_sold" sortField={sortField} sortAsc={sortAsc} onSort={onSort} align="right" />
            <TableHeader label="Revenue" field="total_revenue" sortField={sortField} sortAsc={sortAsc} onSort={onSort} align="right" />
            <TableHeader label="Status" />
            {canManage && <TableHeader label="Actions" align="right" />}
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
                <td>
                  <button
                    type="button"
                    onClick={() => onViewDetails && onViewDetails(p)}
                    className="table-link"
                    title="View product details"
                  >
                    {p.product_name}
                  </button>
                </td>
                <td>{p.brand || '—'}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                <td className="num cell-primary">{formatCurrency(p.unit_price)}</td>
                <td className="num">
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    {isOutOfStock && <span className="stock-tag stock-tag-danger">Out of stock</span>}
                    {isLowStock && <span className="stock-tag stock-tag-warning">Low stock</span>}
                    <span>{stock}</span>
                  </div>
                </td>
                <td className="num">{p.units_sold ?? 0}</td>
                <td className="num cell-primary">{formatCurrency(p.total_revenue ?? 0)}</td>
                <td>
                  <Badge status={p.is_active ? 'active' : 'inactive'} />
                </td>
                {canManage && (
                  <td>
                    <div className="table-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        onClick={() => onEdit(p)}
                        title="Edit product"
                        aria-label={`Edit ${p.product_name}`}
                      >
                        <Edit2 size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-icon"
                        onClick={() => onToggleStatus(p)}
                        title="Toggle status"
                        aria-label={`Toggle status for ${p.product_name}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
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
