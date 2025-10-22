// API client wrapper with authentication

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/auth.html';
        return null;
      }

      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API
const authAPI = {
  async register(email, password) {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async login(email, password) {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async verify() {
    return apiRequest('/api/auth/verify', {
      method: 'GET'
    });
  }
};

// User API
const userAPI = {
  async getProfile() {
    return apiRequest('/api/user/profile', {
      method: 'GET'
    });
  }
};

// Alarms API
const alarmsAPI = {
  async save(alarmData) {
    return apiRequest('/api/alarms/save', {
      method: 'POST',
      body: JSON.stringify({ alarmData })
    });
  },

  async get() {
    return apiRequest('/api/alarms/get', {
      method: 'GET'
    });
  }
};

// Admin API
const adminAPI = {
  async getUsers() {
    return apiRequest('/api/admin/users', {
      method: 'GET'
    });
  },

  async getUser(userId) {
    return apiRequest(`/api/admin/user?userId=${userId}`, {
      method: 'GET'
    });
  },

  async updateUserRole(userId, role) {
    return apiRequest(`/api/admin/user?userId=${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
  },

  async deleteUser(userId) {
    return apiRequest(`/api/admin/user?userId=${userId}`, {
      method: 'DELETE'
    });
  },

  async getStats() {
    return apiRequest('/api/admin/stats', {
      method: 'GET'
    });
  }
};
