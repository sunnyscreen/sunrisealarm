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
        users: []
      });
    }

    // Get user details for each user
    const users = await Promise.all(
      userIds.map(async (userId) => {
        const [email, role, created] = await Promise.all([
          kv.get(`user:${userId}:email`),
          kv.get(`user:${userId}:role`),
          kv.get(`user:${userId}:created`)
        ]);

        return {
          userId,
          email,
          role: role || 'free',
          created
        };
      })
    );

    // Sort by creation date (newest first)
    users.sort((a, b) => {
      const dateA = new Date(a.created || 0);
      const dateB = new Date(b.created || 0);
      return dateB - dateA;
    });

    return res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Admin users list error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
