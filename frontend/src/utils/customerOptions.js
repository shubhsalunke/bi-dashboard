export const CUSTOMER_INDUSTRIES = [
  'IT Services',
  'Finance',
  'Healthcare',
  'Retail',
  'Manufacturing',
  'Education',
  'Other',
];

export const CUSTOMER_TYPES = ['Large Business', 'Small Business', 'Startup', 'Individual'];

export const CUSTOMER_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'churned', label: 'Churned' },
];

export const CUSTOMER_STATUS_LABELS = Object.fromEntries(
  CUSTOMER_STATUSES.map((s) => [s.value, s.label])
);

export const CUSTOMER_STATUS_COLORS = {
  active: 'var(--success)',
  inactive: 'var(--chart-muted)',
  on_hold: 'var(--warning)',
  prospect: 'var(--accent)',
  churned: 'var(--danger)',
};

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

