const { kv } = require('@vercel/kv');
const { requireAuth } = require('../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authResult = await requireAuth(req);

    if (authResult.error) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    const { alarmData } = req.body;

    if (!alarmData) {
      return res.status(400).json({ error: 'Alarm data is required' });
    }

    // Save alarm configuration to KV
    await kv.set(`user:${authResult.userId}:alarms`, JSON.stringify(alarmData));

    return res.status(200).json({
      success: true,
      message: 'Alarms saved successfully'
    });
  } catch (error) {
    console.error('Save alarms error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
