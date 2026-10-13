const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate Access and Refresh JWT Tokens
 * @param {Object} payload - User identification payload (id, email, role, name)
 */
const generateTokens = (payload) => {
  const userPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    name: payload.name,
  };

  const accessToken = jwt.sign(userPayload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });

  const refreshToken = jwt.sign(
    { id: payload.id, tokenType: 'refresh' },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    }
  );

  return { accessToken, refreshToken };
};

/**
 * Verify Access Token
 * @param {string} token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify Refresh Token
 * @param {string} token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
