/**
 * Shared backend formatting helpers matching frontend/src/utils/format.js
 */

const formatCurrency = (val, options = {}) => {
  const num = typeof val === 'number' ? val : parseFloat(val) || 0;
  const maxDecimals = options.decimals !== undefined
    ? options.decimals
    : (options.maximumFractionDigits !== undefined ? options.maximumFractionDigits : 0);
  const minDecimals = options.decimals !== undefined
    ? options.decimals
    : (options.minimumFractionDigits !== undefined ? options.minimumFractionDigits : 0);

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(num);
};

module.exports = {
  formatCurrency,
};

