const emailService = require('../services/emailService');
const crypto = require('crypto');

// In-memory store for tokens (keyed by email)
const tokens = {};

// Email format validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const login = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const token = crypto.randomBytes(20).toString('hex');
  tokens[email] = {
    token,
    expires: Date.now() + 15 * 60 * 1000 // 15 minutes
  };

  try {
    await emailService.sendMagicLink(email, token);
    res.json({
      message: 'Magic link sent! Check the backend console for the login link (or your email if SMTP is configured).'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
};

const verify = async (req, res) => {
  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).json({ error: 'Token and email are required' });
  }

  const storedTokenData = tokens[email];

  if (!storedTokenData) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  // Check expiry first — delete token regardless of whether it's expired or valid
  if (Date.now() > storedTokenData.expires) {
    delete tokens[email];
    return res.status(400).json({ error: 'Token expired' });
  }

  if (storedTokenData.token !== token) {
    return res.status(400).json({ error: 'Invalid token' });
  }

  // Token is valid — consume it (single-use) and create session
  delete tokens[email];
  req.session.user = { email };

  res.json({ message: 'Successfully logged in', user: { email } });
};

const me = (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
};

const logout = (req, res) => {
  req.session.destroy();
  res.json({ message: 'Logged out' });
};

// Dev-only test login — bypasses magic link flow
const testLogin = (req, res) => {
  req.session.user = { email: 'test@example.com' };
  res.json({ message: 'Test login successful', user: { email: 'test@example.com' } });
};

module.exports = {
  login,
  verify,
  me,
  logout,
  testLogin,
  // Expose tokens map for testing purposes
  _tokens: tokens
};
