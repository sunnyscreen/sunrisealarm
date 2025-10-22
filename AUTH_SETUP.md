# Authentication System Setup Guide

This guide explains how to set up and use the new authentication system for Sunnyscreen.

## Overview

The authentication system uses:
- **Vercel KV** (Redis) for flat-file user storage
- **JWT tokens** for authentication
- **bcrypt** for password hashing
- Role-based access control (free, premium, admin)

## Architecture

```
User → auth.html (Login/Signup) → API endpoints → Vercel KV
                                                 ↓
                                           app.html (Cloud sync)
                                           admin.html (Admin panel)
```

## Setup Instructions

### 1. Install Vercel KV

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **KV**
3. Name it (e.g., "sunnyscreen-users")
4. The environment variables will be auto-configured

### 2. Set JWT Secret

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add it to Vercel environment variables:
1. Go to **Settings** → **Environment Variables**
2. Add `JWT_SECRET` with the generated value
3. Apply to all environments (Production, Preview, Development)

### 3. Deploy

```bash
git push
```

Vercel will automatically:
- Install dependencies (@vercel/kv, jsonwebtoken, bcryptjs)
- Configure KV connection
- Deploy API endpoints

## User Roles

### Free (default)
- Access to basic alarm features
- Data synced to cloud
- 1 alarm configuration

### Premium
- Unlimited alarms (future feature)
- Priority support
- Advanced customization options

### Admin
- Full access to admin panel
- User management (view, update roles, delete)
- System statistics dashboard

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/verify` - Verify JWT token

### User Profile
- `GET /api/user/profile` - Get current user profile

### Alarms
- `POST /api/alarms/save` - Save alarm configuration
- `GET /api/alarms/get` - Get alarm configuration

### Admin (admin role required)
- `GET /api/admin/users` - List all users
- `GET /api/admin/user?userId={id}` - Get specific user
- `PUT /api/admin/user?userId={id}` - Update user role
- `DELETE /api/admin/user?userId={id}` - Delete user
- `GET /api/admin/stats` - Get user statistics

## Pages

### `/auth.html` - Login/Signup
- Tab interface for login and registration
- Email + password authentication
- Auto-redirect to app after login
- Option to continue as guest (localStorage only)

### `/app.html` - Main Application
- Works with or without authentication
- Auto-syncs to cloud when logged in
- Shows user role and status
- Admin panel button for admin users
- Logout button when authenticated

### `/admin.html` - Admin Dashboard
- Requires admin role
- View all users with statistics
- Update user roles (free → premium → admin)
- Delete users
- Search functionality
- User statistics overview

## Data Storage

### Vercel KV Schema

User data:
```
user:{userId}:email → "user@example.com"
user:{userId}:password → "hashed_password"
user:{userId}:role → "free" | "premium" | "admin"
user:{userId}:created → ISO timestamp
user:{userId}:alarms → JSON string of alarm config

email:{email} → userId (for login lookup)
users:all → Set of all user IDs
```

## Security Features

- ✅ bcrypt password hashing (10 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ Token verification on protected endpoints
- ✅ Role-based access control
- ✅ Admin-only routes protected by middleware
- ✅ Environment variable for JWT secret
- ✅ HTTPS only (enforced by Vercel)

## Creating First Admin User

After deployment, you'll need to manually promote a user to admin using Vercel KV:

1. Go to Vercel dashboard → Storage → Your KV database
2. Find your user ID from `email:{your-email}`
3. Set `user:{userId}:role` to `"admin"`

Or use the Vercel CLI:

```bash
vercel env pull .env.local
npm install -g @vercel/cli
vercel kv get email:your@email.com  # Get user ID
vercel kv set user:{userId}:role admin
```

## Local Development

For local testing without Vercel KV:

1. The app will work in guest mode (localStorage only)
2. API endpoints will fail gracefully
3. To test auth locally, you need to:
   - Install Vercel CLI: `npm i -g vercel`
   - Link project: `vercel link`
   - Pull env vars: `vercel env pull .env.local`
   - Run: `vercel dev`

## Migration from localStorage

Existing users using localStorage will:
1. Continue to work without authentication (guest mode)
2. See a "Login / Signup" button
3. Can create an account and their data will sync to cloud
4. Local data is preserved as fallback

## Future Enhancements

- Email verification
- Password reset flow
- OAuth providers (Google, GitHub)
- Stripe integration for premium subscriptions
- Multi-alarm support for premium users
- Alarm history and analytics

## Troubleshooting

### Users can't log in
- Check KV database is provisioned
- Verify `JWT_SECRET` environment variable is set
- Check browser console for API errors

### Admin panel shows 403
- Verify user role is set to "admin" in KV
- Check JWT token is valid (not expired)

### Data not syncing
- Verify user is logged in (check user info at bottom of app)
- Check network tab for API errors
- Ensure KV connection is working

## Support

For issues, check:
1. Browser console for errors
2. Vercel deployment logs
3. KV database connection status
4. Environment variables are set correctly
