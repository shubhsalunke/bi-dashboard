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

export const formatChartValue = (val) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  if (num >= 10000000) {
    return `₹${(Math.round((num / 10000000) * 100) / 100).toString()}Cr`;
  }
  if (num >= 100000) {
    const l = Math.round((num / 100000) * 10) / 10;
    return `₹${l}L`;
  }
  if (num >= 1000) {
    const k = Math.round((num / 1000) * 10) / 10;
    return `₹${k}k`;
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

export const formatMonth = (val) => {
  if (!val) return '';
  const match = String(val).trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(val);
  const year = Number(match[1]);
  const monthIdx = Number(match[2]) - 1;
  const d = new Date(year, monthIdx, 1);
  if (isNaN(d.getTime())) return String(val);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
