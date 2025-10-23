/**
 * Seed script to create test users in Vercel KV
 *
 * Run with: node api/seed-test-users.js
 * Or via API: POST to /api/seed-test-users with ?secret=SEED_SECRET
 */

const bcrypt = require('bcryptjs');
const { kv } = require('@vercel/kv');

const TEST_USERS = [
  {
    email: 'user@test.com',
    password: 'testpassword123',
    role: 'free',
    userId: 'test_user_free'
  },
  {
    email: 'admin@test.com',
    password: 'testpassword123',
    role: 'admin',
    userId: 'test_user_admin'
  },
  {
    email: 'premium@test.com',
    password: 'testpassword123',
    role: 'premium',
    userId: 'test_user_premium'
  }
];

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');

  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUserId = await kv.get(`email:${user.email}`);

      if (existingUserId) {
        console.log(`⚠️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Store user data
      await Promise.all([
        kv.set(`user:${user.userId}:email`, user.email),
        kv.set(`user:${user.userId}:password`, hashedPassword),
        kv.set(`user:${user.userId}:role`, user.role),
        kv.set(`user:${user.userId}:created`, new Date().toISOString()),
        kv.set(`email:${user.email}`, user.userId),
        kv.sadd('users:all', user.userId)
      ]);

      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${user.email}:`, error.message);
    }
  }

  console.log('🎉 Test user seeding complete!');
}

// Serverless function handler for API endpoint
module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require secret parameter for security
  const { secret } = req.query;
  const SEED_SECRET = process.env.SEED_SECRET || 'default_seed_secret_change_me';

  if (secret !== SEED_SECRET) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  try {
    // Run seeding
    const results = [];

    for (const user of TEST_USERS) {
      try {
        const existingUserId = await kv.get(`email:${user.email}`);

        if (existingUserId) {
          results.push({ email: user.email, status: 'already_exists' });
          continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await Promise.all([
          kv.set(`user:${user.userId}:email`, user.email),
          kv.set(`user:${user.userId}:password`, hashedPassword),
          kv.set(`user:${user.userId}:role`, user.role),
          kv.set(`user:${user.userId}:created`, new Date().toISOString()),
          kv.set(`email:${user.email}`, user.userId),
          kv.sadd('users:all', user.userId)
        ]);

        results.push({ email: user.email, status: 'created', role: user.role });
      } catch (error) {
        results.push({ email: user.email, status: 'error', error: error.message });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Test users seeded',
      results
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};

// Allow running as standalone script
if (require.main === module) {
  seedTestUsers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
