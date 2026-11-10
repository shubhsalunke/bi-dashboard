import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { formatCurrency, formatDate } from '../../utils/format';

export const SaleDetailModal = ({ sale, loading, onClose }) => {
  if (!sale) return null;

  return (
    <Modal
      isOpen={Boolean(sale)}
      onClose={onClose}
      title={`Sale Details #${sale.id}`}
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <div className="stack-md">
          <div className="detail-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <div>
              <div className="detail-label">Customer</div>
              <div className="detail-value">{sale.customer_name}</div>
            </div>
            <div>
              <div className="detail-label">Date</div>
              <div className="detail-value tabular-nums">{formatDate(sale.sale_date)}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div style={{ marginTop: '4px' }}>
                <Badge status={sale.status || 'completed'} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="section-heading" style={{ marginBottom: 'var(--space-2)' }}>Line Items</h4>
            <div className="table-responsive table-bordered">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="num">Qty</th>
                    <th className="num">Unit Price</th>
                    <th className="num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="cell-primary">{item.product_name}</td>
                      <td className="num">{item.quantity}</td>
                      <td className="num">{formatCurrency(item.unit_price)}</td>
                      <td className="num cell-primary">{formatCurrency(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                    <td className="num" style={{ fontWeight: 600, color: 'var(--accent-text)' }}>
                      {formatCurrency(sale.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SaleDetailModal;
