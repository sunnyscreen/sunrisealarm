const { kv } = require('@vercel/kv');
const { requireAuth } = require('../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAuth(req);

    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    // Get user profile data
    const [email, role, created] = await Promise.all([
      kv.get(`user:${authResult.userId}:email`),
      kv.get(`user:${authResult.userId}:role`),
      kv.get(`user:${authResult.userId}:created`)
    ]);

    return res.status(200).json({
      success: true,
      user: {
        userId: authResult.userId,
        email,
        role: role || 'free',
        created
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
