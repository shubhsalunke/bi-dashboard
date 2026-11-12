const ACCESS_TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';

export const getAccessToken = () => {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const isPersistentSession = () => {
  try {
    return Boolean(
      localStorage.getItem(ACCESS_TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
    );
  } catch {
    return false;
  }
};

export const setAuthTokens = ({ accessToken, refreshToken, rememberMe = false }) => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);

    const targetStorage = rememberMe ? localStorage : sessionStorage;
    if (accessToken) {
      targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    // Storage unavailable
  }
};

export const updateAuthTokens = ({ accessToken, refreshToken }) => {
  const rememberMe = isPersistentSession();
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  try {
    if (accessToken) {
      targetStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      targetStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {
    // Storage unavailable
  }
};

export const clearAuthTokens = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Storage unavailable
  }
};

