import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  FileDown,
  Link2,
  Check,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { TableSkeleton } from '../common/LoadingSkeleton';
import { salesApi } from '../../api/sales.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/format';

const COMPANY_NAME = 'Smart BI Solutions';

function formatPdfCurrency(val) {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const SaleDetailModal = ({
  sale,
  loading,
  isOpen = Boolean(sale),
  onClose,
  hasPrevious = false,
  hasNext = false,
  onPrevious = null,
  onNext = null,
  canManage = false,
  onStatusUpdated = null,
}) => {
  const saleKey = sale ? `${sale.id}:${sale.status || 'completed'}` : '';
  const [statusDraft, setStatusDraft] = useState({ saleKey: '', status: '', confirmCancel: false });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { showToast } = useToast();

  const selectedStatus =
    statusDraft.saleKey === saleKey ? statusDraft.status : (sale?.status || 'completed');
  const pendingCancelConfirm =
    statusDraft.saleKey === saleKey && statusDraft.confirmCancel;

  const itemsWithSubtotal = useMemo(() => {
    return (sale?.items || []).map((item) => {
      const qty = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const subtotal =
        item.subtotal !== undefined && item.subtotal !== null
          ? Number(item.subtotal)
          : item.line_total !== undefined && item.line_total !== null
            ? Number(item.line_total)
            : Number((qty * unitPrice).toFixed(2));
      return {
        ...item,
        computedSubtotal: subtotal,
      };
    });
  }, [sale?.items]);

  const summary = useMemo(() => {
    const itemsSubtotal = itemsWithSubtotal.reduce((sum, it) => sum + it.computedSubtotal, 0);
    const subtotal =
      sale?.subtotal !== undefined && sale?.subtotal !== null
        ? Number(sale.subtotal)
        : Number(itemsSubtotal.toFixed(2));
    const grandTotal = Number(sale?.total_amount) || 0;
    const discountAmount =
      sale?.discount_amount !== undefined && sale?.discount_amount !== null
        ? Number(sale.discount_amount)
        : grandTotal < subtotal
          ? Number((subtotal - grandTotal).toFixed(2))
          : 0;
    const taxAmount =
      sale?.tax_amount !== undefined && sale?.tax_amount !== null
        ? Number(sale.tax_amount)
        : grandTotal > subtotal
          ? Number((grandTotal - subtotal).toFixed(2))
          : 0;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal,
    };
  }, [itemsWithSubtotal, sale?.subtotal, sale?.discount_amount, sale?.tax_amount, sale?.total_amount]);

  if (!isOpen && !sale) return null;

  const commitStatusUpdate = async (newStatus) => {
    if (!sale) return;
    setUpdatingStatus(true);
    try {
      const updated = await salesApi.updateSaleStatus(sale.id, newStatus);
      setStatusDraft({ saleKey: '', status: '', confirmCancel: false });
      showToast(`Sale #${sale.id} marked as ${newStatus}`, 'success');
      if (onStatusUpdated) {
        onStatusUpdated(updated);
      }
    } catch (err) {
      setStatusDraft({ saleKey: '', status: '', confirmCancel: false });
      showToast(err.message || 'Failed to update sale status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusChange = (e) => {
    const nextStatus = e.target.value;
    if (!sale || nextStatus === (sale.status || 'completed')) {
      setStatusDraft({ saleKey: '', status: '', confirmCancel: false });
      return;
    }

    if (nextStatus === 'cancelled') {
      setStatusDraft({ saleKey, status: nextStatus, confirmCancel: true });
      return;
    }
    setStatusDraft({ saleKey, status: nextStatus, confirmCancel: false });
    commitStatusUpdate(nextStatus);
  };

  const handleCopySaleLink = async () => {
    if (!sale) return;
    const url = `${window.location.origin}/sales?saleId=${sale.id}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setCopiedLink(true);
      showToast(`Copied link for Sale #${sale.id}`, 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      showToast('Unable to copy sale link', 'error');
    }
  };

  const handlePrintInvoice = () => {
    if (!sale) return;
    const prevTitle = document.title;
    document.title = `invoice_sale_${sale.id}`;
    window.print();
    document.title = prevTitle;
  };

  const handleDownloadPdf = () => {
    if (!sale) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = 48;

    doc.setFontSize(18);
    doc.text(COMPANY_NAME, 44, y);
    doc.setFontSize(11);
    doc.text(`Invoice #${sale.id}`, 450, y);

    y += 22;
    doc.setFontSize(10);
    doc.text(`Date: ${formatDate(sale.sale_date)}`, 44, y);
    doc.text(`Status: ${String(sale.status || 'completed').toUpperCase()}`, 450, y);

    y += 22;
    doc.line(44, y, 550, y);
    y += 20;

    doc.setFontSize(11);
    doc.text('Bill To:', 44, y);
    y += 16;
    doc.setFontSize(10);
    doc.text(`${sale.customer_name || ''}${sale.customer_code ? ` (${sale.customer_code})` : ''}`, 44, y);
    y += 15;
    const locationParts = [sale.customer_city, sale.customer_state].filter(Boolean).join(', ');
    if (locationParts) {
      doc.text(locationParts, 44, y);
      y += 15;
    }
    if (sale.customer_gst_number) {
      doc.text(`GSTIN: ${sale.customer_gst_number}`, 44, y);
      y += 15;
    }

    y += 12;
    doc.line(44, y, 550, y);
    y += 16;

    doc.setFontSize(10);
    doc.text('Product', 44, y);
    doc.text('Qty', 310, y, { align: 'right' });
    doc.text('Unit Price', 420, y, { align: 'right' });
    doc.text('Subtotal', 546, y, { align: 'right' });
    y += 8;
    doc.line(44, y, 550, y);
    y += 16;

    itemsWithSubtotal.forEach((item) => {
      if (y > 740) {
        doc.addPage();
        y = 48;
      }
      doc.text(String(item.product_name || ''), 44, y);
      doc.text(String(item.quantity), 310, y, { align: 'right' });
      doc.text(formatPdfCurrency(item.unit_price), 420, y, { align: 'right' });
      doc.text(formatPdfCurrency(item.computedSubtotal), 546, y, { align: 'right' });
      const meta = [item.category, item.brand].filter(Boolean).join(' · ');
      if (meta) {
        y += 12;
        doc.setFontSize(8.5);
        doc.text(meta, 44, y);
        doc.setFontSize(10);
      }
      y += 18;
    });

    y += 6;
    doc.line(320, y, 550, y);
    y += 18;
    doc.text('Subtotal:', 390, y);
    doc.text(formatPdfCurrency(summary.subtotal), 546, y, { align: 'right' });

    if (summary.discountAmount > 0) {
      y += 16;
      doc.text('Discount:', 390, y);
      doc.text(`-${formatPdfCurrency(summary.discountAmount)}`, 546, y, { align: 'right' });
    }

    if (summary.taxAmount > 0) {
      y += 16;
      doc.text('Tax / GST:', 390, y);
      doc.text(formatPdfCurrency(summary.taxAmount), 546, y, { align: 'right' });
    }

    y += 18;
    doc.setFontSize(12);
    doc.text('Grand Total:', 390, y);
    doc.text(formatPdfCurrency(summary.grandTotal), 546, y, { align: 'right' });

    doc.save(`invoice_sale_${sale.id}.pdf`);
    showToast(`Downloaded invoice_sale_${sale.id}.pdf`, 'success');
  };

  const printableInvoice =
    sale && typeof document !== 'undefined'
      ? createPortal(
          <div className="sale-invoice-print" aria-hidden="true">
            <div className="sale-invoice-header">
              <div>
                <h1>{COMPANY_NAME}</h1>
                <p>Tax Invoice / Order Receipt</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2>Sale #{sale.id}</h2>
                <p>Date: {formatDate(sale.sale_date)}</p>
                <p>Status: {String(sale.status || 'completed').toUpperCase()}</p>
              </div>
            </div>

            <div className="sale-invoice-customer">
              <strong>Billed To:</strong>
              <div>
                {sale.customer_name} {sale.customer_code ? `(${sale.customer_code})` : ''}
              </div>
              <div>{[sale.customer_city, sale.customer_state].filter(Boolean).join(', ')}</div>
              {sale.customer_email && <div>{sale.customer_email}</div>}
              {sale.customer_gst_number && <div>GSTIN: {sale.customer_gst_number}</div>}
            </div>

            <table className="sale-invoice-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="num">Qty</th>
                  <th className="num">Unit Price</th>
                  <th className="num">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itemsWithSubtotal.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>
                      <div>{item.product_name}</div>
                      {(item.category || item.brand) && (
                        <small>{[item.category, item.brand].filter(Boolean).join(' · ')}</small>
                      )}
                    </td>
                    <td className="num">{item.quantity}</td>
                    <td className="num">{formatCurrency(item.unit_price)}</td>
                    <td className="num">{formatCurrency(item.computedSubtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sale-invoice-totals">
              <div>
                <span>Subtotal</span>
                <span>{formatCurrency(summary.subtotal)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div>
                  <span>Discount</span>
                  <span>-{formatCurrency(summary.discountAmount)}</span>
                </div>
              )}
              {summary.taxAmount > 0 && (
                <div>
                  <span>Tax / GST</span>
                  <span>{formatCurrency(summary.taxAmount)}</span>
                </div>
              )}
              <div className="sale-invoice-grand">
                <span>Grand Total</span>
                <span>{formatCurrency(summary.grandTotal)}</span>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="760px"
        title={sale ? `Sale Details #${sale.id}` : 'Sale Details'}
        headerExtra={
          sale && (
            <div className="sale-header-nav">
              <Badge status={sale.status || 'completed'} />
              {(onPrevious || onNext) && (
                <div className="segmented-group" role="group" aria-label="Navigate sales">
                  <button
                    type="button"
                    className="segmented-btn"
                    aria-label="Previous sale"
                    onClick={onPrevious}
                    disabled={!hasPrevious || loading}
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                    <span>Prev</span>
                  </button>
                  <button
                    type="button"
                    className="segmented-btn"
                    aria-label="Next sale"
                    onClick={onNext}
                    disabled={!hasNext || loading}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )
        }
        footer={
          <div className="sale-modal-footer">
            <div className="sale-modal-footer-actions">
              {sale && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopySaleLink}
                  >
                    {copiedLink ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />}
                    <span>{copiedLink ? 'Copied link' : 'Copy sale link'}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handlePrintInvoice}
                  >
                    <Printer size={14} aria-hidden="true" />
                    <span>Print Invoice</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadPdf}
                  >
                    <FileDown size={14} aria-hidden="true" />
                    <span>Download PDF</span>
                  </button>
                </>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
          </div>
        }
      >
        {loading || !sale ? (
          <TableSkeleton rows={4} columns={4} />
        ) : (
          <div className="stack-md">
            <div className="detail-grid sale-detail-grid">
              <div>
                <div className="detail-label">Customer</div>
                <div className="detail-value">{sale.customer_name}</div>
                <div className="cell-secondary" style={{ marginTop: '2px' }}>
                  {[sale.customer_code, sale.customer_city].filter(Boolean).join(' · ')}
                </div>
                {sale.customer_id && (
                  <Link
                    to={`/customers/${sale.customer_id}`}
                    className="table-link"
                    style={{ fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                    onClick={onClose}
                  >
                    <span>View customer</span>
                    <ExternalLink size={11} aria-hidden="true" />
                  </Link>
                )}
              </div>

              <div>
                <div className="detail-label">Sale Date</div>
                <div className="detail-value tabular-nums">{formatDate(sale.sale_date)}</div>
                {sale.created_by_name && (
                  <div className="cell-secondary" style={{ marginTop: '2px' }}>
                    Recorded by {sale.created_by_name}
                  </div>
                )}
              </div>

              <div>
                <div className="detail-label">Status</div>
                {canManage ? (
                  <div style={{ marginTop: '4px' }}>
                    <select
                      aria-label="Change Status"
                      className="form-control form-control-sm"
                      value={selectedStatus}
                      onChange={handleStatusChange}
                      disabled={updatingStatus}
                    >
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                ) : (
                  <div style={{ marginTop: '4px' }}>
                    <Badge status={sale.status || 'completed'} />
                  </div>
                )}
              </div>
            </div>

            {pendingCancelConfirm && (
              <div className="alert alert-warning" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <div className="alert-warning-title">Confirm Sale Cancellation</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Are you sure you want to cancel Sale #{sale.id}?
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={updatingStatus}
                    onClick={() => {
                      setStatusDraft({ saleKey: '', status: '', confirmCancel: false });
                    }}
                  >
                    Keep Current
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    disabled={updatingStatus}
                    onClick={() => commitStatusUpdate('cancelled')}
                  >
                    {updatingStatus ? 'Updating...' : 'Confirm Cancel'}
                  </button>
                </div>
              </div>
            )}

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
                    {itemsWithSubtotal.map((item, idx) => {
                      const metaLine = [item.category, item.brand].filter(Boolean).join(' · ');
                      return (
                        <tr key={item.id || idx}>
                          <td>
                            <Link
                              to={`/products?search=${encodeURIComponent(item.sku || item.product_name)}`}
                              className="table-link cell-primary"
                              onClick={onClose}
                            >
                              {item.product_name}
                            </Link>
                            {metaLine && <div className="cell-secondary">{metaLine}</div>}
                          </td>
                          <td className="num">{item.quantity}</td>
                          <td className="num">{formatCurrency(item.unit_price)}</td>
                          <td className="num cell-primary">{formatCurrency(item.computedSubtotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sale-summary-box" aria-label="Sale summary totals">
              <div className="sale-summary-row">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(summary.subtotal)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div className="sale-summary-row">
                  <span>Discount</span>
                  <span className="tabular-nums" style={{ color: 'var(--success)' }}>
                    -{formatCurrency(summary.discountAmount)}
                  </span>
                </div>
              )}
              {summary.taxAmount > 0 && (
                <div className="sale-summary-row">
                  <span>Tax / GST</span>
                  <span className="tabular-nums">{formatCurrency(summary.taxAmount)}</span>
                </div>
              )}
              <div className="sale-summary-row sale-summary-total">
                <span>Grand Total</span>
                <span className="tabular-nums">{formatCurrency(summary.grandTotal)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
      {printableInvoice}
    </>
  );
};

export default SaleDetailModal;
