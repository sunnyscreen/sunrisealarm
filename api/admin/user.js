const { kv } = require('@vercel/kv');
const { requireAdmin } = require('../middleware/auth');

module.exports = async function handler(req, res) {
  try {
    const authResult = await requireAdmin(req);

    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // GET - Get user details
    if (req.method === 'GET') {
      const [email, role, created, alarmsJson] = await Promise.all([
        kv.get(`user:${userId}:email`),
        kv.get(`user:${userId}:role`),
        kv.get(`user:${userId}:created`),
        kv.get(`user:${userId}:alarms`)
      ]);

      if (!email) {
        return res.status(404).json({ error: 'User not found' });
      }

      const alarms = alarmsJson ? JSON.parse(alarmsJson) : null;

      return res.status(200).json({
        success: true,
        user: {
          userId,
          email,
          role: role || 'free',
          created,
          alarms
        }
      });
    }

    // PUT - Update user role
    if (req.method === 'PUT') {
      const { role } = req.body;

      if (!role || !['free', 'premium', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required (free, premium, admin)' });
      }

      // Check if user exists
      const email = await kv.get(`user:${userId}:email`);
      if (!email) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update user role
      await kv.set(`user:${userId}:role`, role);

      return res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        user: {
          userId,
          email,
          role
        }
      });
    }

    // DELETE - Delete user
    if (req.method === 'DELETE') {
      const email = await kv.get(`user:${userId}:email`);

      if (!email) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete all user data
      await Promise.all([
        kv.del(`user:${userId}:email`),
        kv.del(`user:${userId}:password`),
        kv.del(`user:${userId}:role`),
        kv.del(`user:${userId}:created`),
        kv.del(`user:${userId}:alarms`),
        kv.del(`email:${email}`),
        kv.srem('users:all', userId)
      ]);

      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin user management error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
