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

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUserId = await kv.get(`email:${email.toLowerCase()}`);
    if (existingUserId) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store user data in KV
    await Promise.all([
      kv.set(`user:${userId}:email`, email.toLowerCase()),
      kv.set(`user:${userId}:password`, hashedPassword),
      kv.set(`user:${userId}:role`, 'free'),
      kv.set(`user:${userId}:created`, new Date().toISOString()),
      kv.set(`email:${email.toLowerCase()}`, userId),
      kv.sadd('users:all', userId)
    ]);

    // Generate JWT token
    const token = jwt.sign(
      { userId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      token,
      user: {
        userId,
        email: email.toLowerCase(),
        role: 'free'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
