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

    return res.status(200).json({
      success: true,
      user: {
        userId: authResult.userId,
        email: authResult.email,
        role: authResult.role
      }
    });
  } catch (error) {
    console.error('Verify error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
