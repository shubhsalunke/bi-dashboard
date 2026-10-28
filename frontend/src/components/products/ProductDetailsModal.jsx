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
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading product details...
        </div>
      ) : error ? (
        <div style={{ color: 'var(--danger)', padding: '16px 0' }}>{error}</div>
      ) : details ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-main)', margin: 0 }}>
                {details.product_name}
              </h3>
              <Badge status={details.is_active ? 'active' : 'inactive'} />
            </div>
            {details.description && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                {details.description}
              </p>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              padding: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Product Code
              </span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{details.sku || '—'}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Brand
              </span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{details.brand || '—'}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Category
              </span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{details.category}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Supplier
              </span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{details.supplier || '—'}</div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Unit Price
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {formatCurrency(details.unit_price)} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ {details.unit || 'unit'}</span>
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Cost Price
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {details.cost_price !== null && details.cost_price !== undefined
                  ? formatCurrency(details.cost_price)
                  : '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                GST %
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {details.gst_percent ?? 18}%
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Price with GST
              </span>
              <div className="tabular-nums" style={{ fontWeight: 700, color: 'var(--teal-primary, #0d9488)', marginTop: '2px' }}>
                {formatCurrency(details.price_with_gst ?? details.unit_price * (1 + (details.gst_percent ?? 18) / 100))}
              </div>
            </div>

            {details.cost_price !== null && details.cost_price !== undefined && (
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Margin
                </span>
                <div className="tabular-nums" style={{ fontWeight: 600, color: 'var(--teal-primary, #0d9488)', marginTop: '2px' }}>
                  {details.margin !== null ? `${details.margin}%` : '—'}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Stock
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className="tabular-nums" style={{ fontWeight: 600 }}>
                  {stock}
                </span>
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
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Reorder Level
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {details.reorder_level ?? 10}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Warranty
              </span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {details.warranty_months !== null && details.warranty_months !== undefined
                  ? `${details.warranty_months} months`
                  : '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Units Sold
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {details.units_sold}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Revenue
              </span>
              <div className="tabular-nums" style={{ fontWeight: 600, marginTop: '2px' }}>
                {formatCurrency(details.total_revenue)}
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-main)' }}>
              Recent Sales (Last 5)
            </h4>
            {!details.recent_sales || details.recent_sales.length === 0 ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No completed sales recorded for this product yet.
              </div>
            ) : (
              <div className="table-responsive" style={{ border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: '0.75rem' }}>Date</th>
                      <th style={{ fontSize: '0.75rem' }}>Customer</th>
                      <th style={{ fontSize: '0.75rem' }}>Quantity</th>
                      <th style={{ fontSize: '0.75rem' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.recent_sales.map((sale, idx) => (
                      <tr key={sale.sale_id || idx}>
                        <td className="tabular-nums" style={{ fontSize: '0.8125rem' }}>
                          {formatDate(sale.sale_date)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {sale.customer_name}
                        </td>
                        <td className="tabular-nums" style={{ fontSize: '0.8125rem' }}>
                          {sale.quantity}
                        </td>
                        <td className="tabular-nums" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                          {formatCurrency(sale.amount)}
                        </td>
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
