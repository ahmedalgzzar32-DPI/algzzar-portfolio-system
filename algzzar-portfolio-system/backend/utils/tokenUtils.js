const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d';
const COOKIE_EXPIRY_DAYS = 7;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

const sendTokenCookie = (res, id) => {
  const token = generateToken(id);

  res.cookie('adminToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });

  return token;
};

const clearTokenCookie = (res) => {
  res.cookie('adminToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    expires: new Date(0),
    path: '/',
  });
};

module.exports = { generateToken, sendTokenCookie, clearTokenCookie };
