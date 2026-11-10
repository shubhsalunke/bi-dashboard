import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { productsApi } from '../../api/products.api';
import { formatCurrency, formatDate } from '../../utils/format';

export const ProductDetailsModal = ({ productId, isOpen, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!productId || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    productsApi
      .getProductDetails(productId)
      .then((data) => {
        if (isMounted) {
          setDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load product details');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [productId, isOpen]);

  const stock = details?.stock_quantity ?? 0;
  const reorderLevel = details?.reorder_level ?? 10;
  const isOutOfStock = stock === 0;
  const isLowStock = !isOutOfStock && stock <= reorderLevel;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading product details...
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : details ? (
        <div className="stack-md">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                {details.product_name}
              </h3>
              <Badge status={details.is_active ? 'active' : 'inactive'} />
            </div>
            {details.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                {details.description}
              </p>
            )}
          </div>

          <div className="detail-grid">
            <div>
              <span className="detail-label">Product Code</span>
              <div className="detail-value tabular-nums">{details.sku || '—'}</div>
            </div>

            <div>
              <span className="detail-label">Brand</span>
              <div className="detail-value">{details.brand || '—'}</div>
            </div>

            <div>
              <span className="detail-label">Category</span>
              <div className="detail-value">{details.category}</div>
            </div>

            <div>
              <span className="detail-label">Supplier</span>
              <div className="detail-value">{details.supplier || '—'}</div>
            </div>

            <div>
              <span className="detail-label">Unit Price</span>
              <div className="detail-value tabular-nums">
                {formatCurrency(details.unit_price)}{' '}
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>
                  / {details.unit || 'unit'}
                </span>
              </div>
            </div>

            <div>
              <span className="detail-label">Cost Price</span>
              <div className="detail-value tabular-nums">
                {details.cost_price !== null && details.cost_price !== undefined
                  ? formatCurrency(details.cost_price)
                  : '—'}
              </div>
            </div>

            <div>
              <span className="detail-label">GST %</span>
              <div className="detail-value tabular-nums">{details.gst_percent ?? 18}%</div>
            </div>

            <div>
              <span className="detail-label">Price with GST</span>
              <div className="detail-value tabular-nums" style={{ color: 'var(--accent-text)' }}>
                {formatCurrency(details.price_with_gst ?? details.unit_price * (1 + (details.gst_percent ?? 18) / 100))}
              </div>
            </div>

            {details.cost_price !== null && details.cost_price !== undefined && (
              <div>
                <span className="detail-label">Margin</span>
                <div className="detail-value tabular-nums" style={{ color: 'var(--accent-text)' }}>
                  {details.margin !== null ? `${details.margin}%` : '—'}
                </div>
              </div>
            )}

            <div>
              <span className="detail-label">Stock</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: '2px' }}>
                <span className="detail-value tabular-nums" style={{ marginTop: 0 }}>{stock}</span>
                {isOutOfStock && <span className="stock-tag stock-tag-danger">Out of stock</span>}
                {isLowStock && <span className="stock-tag stock-tag-warning">Low stock</span>}
              </div>
            </div>

            <div>
              <span className="detail-label">Reorder Level</span>
              <div className="detail-value tabular-nums">{details.reorder_level ?? 10}</div>
            </div>

            <div>
              <span className="detail-label">Warranty</span>
              <div className="detail-value">
                {details.warranty_months !== null && details.warranty_months !== undefined
                  ? `${details.warranty_months} months`
                  : '—'}
              </div>
            </div>

            <div>
              <span className="detail-label">Units Sold</span>
              <div className="detail-value tabular-nums">{details.units_sold}</div>
            </div>

            <div>
              <span className="detail-label">Total Revenue</span>
              <div className="detail-value tabular-nums">{formatCurrency(details.total_revenue)}</div>
            </div>
          </div>

          <div>
            <h4 className="section-heading" style={{ marginBottom: 'var(--space-2)' }}>
              Recent Sales (Last 5)
            </h4>
            {!details.recent_sales || details.recent_sales.length === 0 ? (
              <div className="cell-secondary" style={{ fontSize: '0.8125rem' }}>
                No completed sales recorded for this product yet.
              </div>
            ) : (
              <div className="table-responsive table-bordered">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th className="num">Quantity</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.recent_sales.map((sale, idx) => (
                      <tr key={sale.sale_id || idx}>
                        <td className="tabular-nums">{formatDate(sale.sale_date)}</td>
                        <td className="cell-primary">{sale.customer_name}</td>
                        <td className="num">{sale.quantity}</td>
                        <td className="num cell-primary">{formatCurrency(sale.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ProductDetailsModal;
