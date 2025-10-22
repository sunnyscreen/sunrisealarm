// Client-side authentication helpers

function getToken() {
  return localStorage.getItem('auth_token');
}

function setToken(token) {
  localStorage.setItem('auth_token', token);
}

function removeToken() {
  localStorage.removeItem('auth_token');
}

function getCurrentUser() {
  const userJson = localStorage.getItem('current_user');
  return userJson ? JSON.parse(userJson) : null;
}

function setCurrentUser(user) {
  localStorage.setItem('current_user', JSON.stringify(user));
}

function removeCurrentUser() {
  localStorage.removeItem('current_user');
}

function isAuthenticated() {
  return !!getToken();
}

function logout() {
  removeToken();
  removeCurrentUser();
  window.location.href = '/auth.html';
}

async function verifyAuth() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/verify', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentUser(data.user);
      return data.user;
    } else {
      removeToken();
      removeCurrentUser();
      return null;
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

async function requireAuth() {
  const user = await verifyAuth();

  if (!user) {
    window.location.href = '/auth.html';
    return null;
  }

  return user;
}

async function requireAdmin() {
  const user = await requireAuth();

  if (!user) {
    return null;
  }

  if (user.role !== 'admin') {
    alert('Admin access required');
    window.location.href = '/app.html';
    return null;
  }

  return user;
}

function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

function isAdmin() {
  return hasRole('admin');
}

function isPremium() {
  return hasRole('premium') || hasRole('admin');
}

function isFree() {
  return hasRole('free');
}
