const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'tlwm_secret';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acces non autorise' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide ou expire' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (!['ADMIN_AFRIQUE', 'ADMIN_PAYS', 'ADMIN'].includes(role)) {
    return res.status(403).json({ error: 'Acces reserve aux administrateurs' });
  }
  next();
};

module.exports = { authenticateToken, requireAdmin };
