import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Middleware adapter for Express
 * @param {Function} handler - The route handler
 * @param {Array<string>} [allowedRoles] - Optional array of roles ('admin', 'teacher')
 */
export const withAuth = (handler, allowedRoles = []) => {
  return async (req, res) => {
    try {
      if (req.method === 'OPTIONS') {
         return res.status(200).end();
      }

      const decoded = verifyToken(req);
      req.user = decoded; // { id, role, ... }

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      }

      return handler(req, res);
    } catch (error) {
      return res.status(401).json({ error: error.message });
    }
  };
};
