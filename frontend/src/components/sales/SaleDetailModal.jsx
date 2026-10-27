import React from 'react';
import { Modal } from '../common/Modal';
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
        <p>Loading sale details...</p>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Customer</div>
              <div style={{ fontWeight: 500 }}>{sale.customer_name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Date</div>
              <div>{formatDate(sale.sale_date)}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>Line Items</div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.product_name}</td>
                    <td className="tabular-nums">{item.quantity}</td>
                    <td className="tabular-nums">{formatCurrency(item.unit_price)}</td>
                    <td className="tabular-nums" style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
                  <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {formatCurrency(sale.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SaleDetailModal;
