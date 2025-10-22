const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { kv } = require('@vercel/kv');
const { JWT_SECRET } = require('../middleware/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user ID from email
    const userId = await kv.get(`email:${email.toLowerCase()}`);
    if (!userId) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user password hash
    const storedHash = await kv.get(`user:${userId}:password`);
    if (!storedHash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, storedHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Get user role
    const role = await kv.get(`user:${userId}:role`) || 'free';

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        userId,
        email: email.toLowerCase(),
        role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
