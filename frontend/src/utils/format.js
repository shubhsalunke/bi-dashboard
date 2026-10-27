/**
 * Shared formatting helpers for currency, dates, and numbers.
 */

export const formatCurrency = (val, options = {}) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  const maxDecimals = options.decimals !== undefined
    ? options.decimals
    : (options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 0);
  const minDecimals = options.decimals !== undefined
    ? options.decimals
    : (options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0);

  // Indian Rupee format (e.g. ₹1,24,500)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num);
};

export const formatCompactCurrency = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;

  // Indian format: Lakhs (L) and Crores (Cr)
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)}Cr`;
  }
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `₹${(num / 1000).toFixed(0)}k`;
  }
  return `₹${num}`;
};

export const formatDate = (val) => {
  if (!val) return '-';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val).split('T')[0] || String(val);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-GB', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(val);
  }
};
