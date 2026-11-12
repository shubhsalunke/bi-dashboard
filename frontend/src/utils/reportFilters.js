export const DEFAULT_CITIES = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad', 'Hyderabad', 'Delhi'];

export const DEFAULT_CATEGORIES = [
  'Cloud Infrastructure',
  'Enterprise Software',
  'Cybersecurity',
  'Analytics & AI',
  'Professional Services',
];

export const DEFAULT_BRANDS = ['Tata', 'Infosys', 'Reliance', 'Mahindra', 'Bharat'];

export const DATE_PRESETS = [
  { id: 'all', label: 'All Time' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_fy', label: 'This Financial Year' },
];

export function formatDateInput(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPresetDates(presetId) {
  if (!presetId || presetId === 'all') {
    return { startDate: '', endDate: '' };
  }
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  switch (presetId) {
    case '7d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 7)),
        endDate: formatDateInput(now),
      };
    case '30d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 30)),
        endDate: formatDateInput(now),
      };
    case '90d':
      return {
        startDate: formatDateInput(new Date(year, month, day - 90)),
        endDate: formatDateInput(now),
      };
    case 'this_month':
      return {
        startDate: formatDateInput(new Date(year, month, 1)),
        endDate: formatDateInput(now),
      };
    case 'last_month':
      return {
        startDate: formatDateInput(new Date(year, month - 1, 1)),
        endDate: formatDateInput(new Date(year, month, 0)),
      };
    case 'this_quarter': {
      const qStart = Math.floor(month / 3) * 3;
      return {
        startDate: formatDateInput(new Date(year, qStart, 1)),
        endDate: formatDateInput(now),
      };
    }
    case 'this_fy': {
      const fyStartYear = month >= 3 ? year : year - 1;
      return {
        startDate: formatDateInput(new Date(fyStartYear, 3, 1)),
        endDate: formatDateInput(now),
      };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

export function buildPeriodComparison(pctValue) {
  if (pctValue === null || pctValue === undefined) {
    return {
      text: '— vs previous period',
      isNeutral: true,
    };
  }
  const num = Number(pctValue);
  if (Number.isNaN(num)) {
    return {
      text: '— vs previous period',
      isNeutral: true,
    };
  }
  const sign = num > 0 ? '+' : '';
  return {
    text: `${sign}${num.toFixed(1)}% vs previous period`,
    isPositive: num >= 0,
    isNeutral: false,
  };
}

export function escapeCsvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

