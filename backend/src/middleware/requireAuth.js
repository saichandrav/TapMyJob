/**
 * Middleware that requires an authenticated session.
 * Returns 401 if req.session.user is absent.
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

module.exports = requireAuth;
