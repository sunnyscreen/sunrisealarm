const { kv } = require('@vercel/kv');
const { requireAdmin } = require('../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAdmin(req);

    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    // Get all user IDs
    const userIds = await kv.smembers('users:all');

    if (!userIds || userIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalUsers: 0,
          freeUsers: 0,
          premiumUsers: 0,
          adminUsers: 0
        }
      });
    }

    // Get roles for all users
    const roles = await Promise.all(
      userIds.map(userId => kv.get(`user:${userId}:role`))
    );

    // Count users by role
    const stats = {
      totalUsers: userIds.length,
      freeUsers: roles.filter(r => !r || r === 'free').length,
      premiumUsers: roles.filter(r => r === 'premium').length,
      adminUsers: roles.filter(r => r === 'admin').length
    };

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
