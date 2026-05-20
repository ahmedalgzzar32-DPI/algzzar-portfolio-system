/**
 * api.js — Complete API Integration Layer v2
 * Algzzar Portfolio System · Production-Ready
 *
 * Architecture:
 *   - Centralized fetch with auto auth injection
 *   - Automatic token refresh on 401
 *   - Graceful error handling & retry queue
 *   - Typed response normalization
 *   - Offline detection
 */

'use strict';

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = () => window.ALGZZAR_API_URL || 'https://automatic-journey-x5qqvg699x5q3pv75-5000.app.github.dev/api';

// ── Token & Session Management ────────────────────────────────────────────────
const Auth = {
  getAccessToken: () => {
    try { return localStorage.getItem('algzzar_access_token'); } catch { return null; }
  },
  setAccessToken: (token) => {
    try { localStorage.setItem('algzzar_access_token', token); } catch {}
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('algzzar_user') || 'null'); } catch { return null; }
  },
  setUser: (user) => {
    try { localStorage.setItem('algzzar_user', JSON.stringify(user)); } catch {}
  },
  clearSession: () => {
    try {
      localStorage.removeItem('algzzar_access_token');
      localStorage.removeItem('algzzar_user');
    } catch {}
  },
  isLoggedIn: () => !!Auth.getAccessToken(),
  redirectToLogin: () => {
    // IMPORTANT FIX: resolve login page relative to current page's directory
    // so this works regardless of deployment sub-path.
    const currentDir = window.location.pathname.replace(/\/[^\/]*$/, '/');
    window.location.href = currentDir + 'admin-login.html';
  },
};

// ── Request Queue for token refresh ──────────────────────────────────────────
let _isRefreshing = false;
let _refreshQueue = [];

function _processQueue(error) {
  _refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  _refreshQueue = [];
}

// ── Core Request Handler ──────────────────────────────────────────────────────
async function request(path, options = {}) {
  const base = API_BASE();
  const url = `${base}${path}`;

  const headers = { ...options.headers };

  // Auto-inject auth token
  const token = Auth.getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData — browser sets it with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (networkErr) {
    throw new Error('Network error — check your connection');
  }

  // ── 401: attempt token refresh ────────────────────────────────
  if (response.status === 401 && !options._retry) {
    if (_isRefreshing) {
      // Wait for refresh to complete then retry
      return new Promise((resolve, reject) => {
        _refreshQueue.push({ resolve, reject });
      }).then(() => request(path, { ...options, _retry: true }))
        .catch(() => { throw new Error('Session expired'); });
    }

    _isRefreshing = true;

    try {
      const refreshRes = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        Auth.setAccessToken(refreshData?.data?.accessToken || refreshData?.accessToken);
        _processQueue(null);
        _isRefreshing = false;
        return request(path, { ...options, _retry: true });
      }
    } catch {}

    // Refresh failed — clear session
    _isRefreshing = false;
    _processQueue(new Error('Session expired'));
    Auth.clearSession();
    Auth.redirectToLogin();
    throw new Error('Session expired. Please log in again.');
  }

  // ── Parse response ─────────────────────────────────────────────
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}`;
    if (isJson) {
      try {
        const errData = await response.json();
        errorMsg = errData.message || errData.error || errorMsg;
      } catch {}
    }
    throw new Error(errorMsg);
  }

  if (isJson) return response.json();
  return { success: true };
}

// ── HTTP Shorthand Methods ────────────────────────────────────────────────────
const get = (path, params) => {
  const qs = params && Object.keys(params).length
    ? '?' + new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
      ).toString()
    : '';
  return request(path + qs);
};

const post = (path, body, isForm = false) => request(path, {
  method: 'POST',
  body: isForm ? body : JSON.stringify(body),
});

const put = (path, body, isForm = false) => request(path, {
  method: 'PUT',
  body: isForm ? body : JSON.stringify(body),
});

const patch = (path, body) => request(path, {
  method: 'PATCH',
  body: body ? JSON.stringify(body) : undefined,
});

const del = (path) => request(path, { method: 'DELETE' });

// ── Response Normalizers ──────────────────────────────────────────────────────
// Backend sends: { success, data: { key } } or { success, data: [...] }
// These normalizers extract the relevant nested key

const extractAbout   = (r) => r?.data?.about   ?? r?.data ?? null;
const extractSkills  = (r) => r?.data?.skills   ?? r?.data ?? [];
const extractExp     = (r) => r?.data?.experience ?? r?.data ?? [];
const extractStats   = (r) => r?.data?.stats    ?? r?.data ?? {};
const extractProjects= (r) => r?.data?.projects ?? r?.data ?? [];
const extractMessages= (r) => r?.data           ?? [];

// ── Auth API ──────────────────────────────────────────────────────────────────
const AuthAPI = {
  login: async (email, password) => {
    const r = await post('/auth/login', { email, password });
    const token = r?.data?.accessToken || r?.accessToken;
    const user  = r?.data?.user        || r?.user;
    if (token) Auth.setAccessToken(token);
    if (user)  Auth.setUser(user);
    return { token, user };
  },
  logout: async () => {
    try { await post('/auth/logout'); } catch {}
    Auth.clearSession();
  },
  getMe: () => get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    post('/auth/change-password', { currentPassword, newPassword }),
  isLoggedIn: Auth.isLoggedIn,
  getUser: Auth.getUser,
  getToken: Auth.getAccessToken,
};

// ── Portfolio (Public) API ────────────────────────────────────────────────────
const PortfolioAPI = {
  getProjects: async (params) => {
    const r = await get('/portfolio/projects', params);
    return {
      projects: extractProjects(r),
      pagination: r?.data?.pagination ?? {},
      raw: r,
    };
  },
  getProjectBySlug: async (slug) => {
    const r = await get(`/portfolio/projects/${slug}`);
    return r?.data?.project ?? r?.data ?? null;
  },
  getAbout: async () => {
    const r = await get('/portfolio/about');
    return extractAbout(r);
  },
  getSkills: async () => {
    const r = await get('/portfolio/skills');
    return {
      skills: extractSkills(r),
      grouped: r?.data?.grouped ?? {},
    };
  },
  getExperience: async () => {
    const r = await get('/portfolio/experience');
    return extractExp(r);
  },
  getStats: async () => {
    const r = await get('/portfolio/stats');
    return extractStats(r);
  },
  submitContact: (data) => post('/portfolio/contact', data),
  getCategories: async () => {
    const r = await get('/categories');
    return r?.data ?? [];
  },
};

// ── Admin API ─────────────────────────────────────────────────────────────────
const AdminAPI = {
  // ── Dashboard ──────────────────────────────────────────────────
  getDashboard: async () => {
    const r = await get('/admin/dashboard');
    return r?.data ?? {};
  },

  // ── Projects ───────────────────────────────────────────────────
  getProjects: async (params) => {
    const r = await get('/admin/projects', params);
    return {
      projects: r?.data?.projects ?? r?.data ?? [],
      pagination: r?.data?.pagination ?? {},
    };
  },
  getProject: async (id) => {
    const r = await get(`/admin/projects/${id}`);
    return r?.data?.project ?? r?.data ?? null;
  },
  createProject: (formData) => post('/admin/projects', formData, true),
  updateProject: (id, formData) => put(`/admin/projects/${id}`, formData, true),
  deleteProject: (id) => del(`/admin/projects/${id}`),
  togglePublish: (id) => patch(`/admin/projects/${id}/toggle`),
  toggleFeatured: (id) => patch(`/admin/projects/${id}/featured`),

  // ── About / Profile ────────────────────────────────────────────
  getAbout: async () => {
    const r = await get('/admin/about');
    return r?.data?.about ?? r?.data ?? null;
  },
  updateAbout: (formData) => put('/admin/about', formData, true),

  // ── Skills ─────────────────────────────────────────────────────
  getSkills: async () => {
    const r = await get('/admin/skills');
    return r?.data ?? [];
  },
  createSkill: (data) => post('/admin/skills', data),
  updateSkill: (id, data) => put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => del(`/admin/skills/${id}`),

  // ── Experience ─────────────────────────────────────────────────
  getExperience: async () => {
    const r = await get('/admin/experience');
    return r?.data ?? [];
  },
  createExperience: (data) => post('/admin/experience', data),
  updateExperience: (id, data) => put(`/admin/experience/${id}`, data),
  deleteExperience: (id) => del(`/admin/experience/${id}`),

  // ── Messages ───────────────────────────────────────────────────
  getMessages: async (params) => {
    const r = await get('/admin/messages', params);
    return r?.data ?? [];
  },
  getMessage: async (id) => {
    const r = await get(`/admin/messages/${id}`);
    return r?.data ?? null;
  },
  markRead: (id) => patch(`/admin/messages/${id}/read`),
  deleteMessage: (id) => del(`/admin/messages/${id}`),

  // ── Categories ─────────────────────────────────────────────────
  getCategories: async () => {
    const r = await get('/categories');
    return r?.data ?? [];
  },
  createCategory: (data) => post('/categories', data),
  updateCategory: (id, data) => put(`/categories/${id}`, data),
  deleteCategory: (id) => del(`/categories/${id}`),

  // ── Upload (multipart) ─────────────────────────────────────────
  uploadMedia: (formData, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const base = API_BASE();
      xhr.open('POST', `${base}/upload`, true);

      const token = Auth.getAccessToken();
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.withCredentials = true;

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(data);
          else reject(new Error(data.message || `Upload failed (${xhr.status})`));
        } catch { reject(new Error('Upload response parse error')); }
      };

      xhr.onerror = () => reject(new Error('Upload network error'));
      xhr.send(formData);
    });
  },
};

// ── Health Check ──────────────────────────────────────────────────────────────
const health = () => {
  const base = API_BASE().replace('/api', '');
  return fetch(`${base}/health`).then(r => r.json()).catch(() => ({ status: 'unreachable' }));
};

// ── Export ────────────────────────────────────────────────────────────────────
// Works both as ES module (type="module") and as global (window.AlgzzarAPI)
const AlgzzarAPI = { AuthAPI, PortfolioAPI, AdminAPI, Auth, health };

// Global fallback for non-module scripts
if (typeof window !== 'undefined') window.AlgzzarAPI = AlgzzarAPI;

// NOTE: ES module export statements are intentionally omitted.
// This file is loaded as a plain <script> tag (not type="module").
// Adding export/import statements causes a SyntaxError in that context.
// All public API is available via window.AlgzzarAPI (set above).
