const jwt = require('jsonwebtoken');
const { kv } = require('@vercel/kv');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

async function verifyToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user still exists
    const userExists = await kv.exists(`user:${decoded.userId}:email`);
    if (!userExists) {
      return { error: 'User no longer exists', status: 401 };
    }

    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { error: 'Token expired', status: 401 };
    }
    return { error: 'Invalid token', status: 401 };
  }
}

async function requireAuth(req) {
  const result = await verifyToken(req);
  if (result.error) {
    return result;
  }

  // Get user role
  const role = await kv.get(`user:${result.userId}:role`);
  return { ...result, role: role || 'free' };
}

async function requireAdmin(req) {
  const result = await requireAuth(req);
  if (result.error) {
    return result;
  }

  if (result.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return result;
}

module.exports = {
  verifyToken,
  requireAuth,
  requireAdmin,
  JWT_SECRET
};
