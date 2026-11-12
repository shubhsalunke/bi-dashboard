export const USER_ROLES = [
  {
    value: 'analyst',
    label: 'Analyst',
    description: 'Read-only access to dashboards, sales, customers, products, reports, and AI assistant.',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Manage customers and products, record sales transactions, and view reports.',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full administrative control including user management, deletion, and system audit logs.',
  },
];

export const USER_ROLE_MAP = USER_ROLES.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

export const USER_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const PHONE_REGEX = /^[+]?[\d\s()-]{7,20}$/;

export const getRoleLabel = (role) => USER_ROLE_MAP[role]?.label || role;

export const getRoleDescription = (role) => USER_ROLE_MAP[role]?.description || '';

export const evaluatePasswordStrength = (password) => {
  if (!password) {
    return {
      score: 0,
      label: '',
      level: 'none',
      percent: 0,
    };
  }

  let points = 0;
  if (password.length >= 6) points += 1;
  if (password.length >= 10) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (password.length < 8 || points <= 2) {
    return {
      score: points,
      label: 'Weak',
      level: 'weak',
      percent: 33,
    };
  }

  if (points <= 4) {
    return {
      score: points,
      label: 'Medium',
      level: 'medium',
      percent: 66,
    };
  }

  return {
    score: points,
    label: 'Strong',
    level: 'strong',
    percent: 100,
  };
};

const pickRandomChar = (charset) => {
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    return charset[arr[0] % charset.length];
  }
  return charset[Math.floor(Math.random() * charset.length)];
};

export const generateStrongPassword = (length = 14) => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*_-+=';
  const all = upper + lower + digits + special;

  const chars = [
    pickRandomChar(upper),
    pickRandomChar(lower),
    pickRandomChar(digits),
    pickRandomChar(special),
  ];

  for (let i = chars.length; i < length; i += 1) {
    chars.push(pickRandomChar(all));
  }

  for (let i = chars.length - 1; i > 0; i -= 1) {
    const swapIdx =
      typeof window !== 'undefined' && window.crypto?.getRandomValues
        ? (() => {
            const arr = new Uint32Array(1);
            window.crypto.getRandomValues(arr);
            return arr[0] % (i + 1);
          })()
        : Math.floor(Math.random() * (i + 1));
    const tmp = chars[i];
    chars[i] = chars[swapIdx];
    chars[swapIdx] = tmp;
  }

  return chars.join('');
};

