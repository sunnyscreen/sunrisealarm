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

    // Get alarm configuration from KV
    const alarmsJson = await kv.get(`user:${authResult.userId}:alarms`);
    const alarms = alarmsJson ? JSON.parse(alarmsJson) : null;

    return res.status(200).json({
      success: true,
      alarms
    });
  } catch (error) {
    console.error('Get alarms error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
