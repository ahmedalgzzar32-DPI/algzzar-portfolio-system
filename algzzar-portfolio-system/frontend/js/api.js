/**
 * api.js — Complete API Integration Layer
 * Algzzar Portfolio System · Production-Ready
 * Connects all frontend to the Express/MongoDB backend
 */

'use strict';

// ── Config ────────────────────────────────────────────────────
const API_BASE = window.ALGZZAR_API_URL || 'http://localhost:5000/api';

// ── Token Management ─────────────────────────────────────────
const Auth = {
  getAccessToken: () => localStorage.getItem('algzzar_access_token'),
  setAccessToken: (token) => localStorage.setItem('algzzar_access_token', token),
  clearTokens: () => {
    localStorage.removeItem('algzzar_access_token');
    localStorage.removeItem('algzzar_user');
  },
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('algzzar_user') || 'null'); } 
    catch { return null; }
  },
  setUser: (user) => localStorage.setItem('algzzar_user', JSON.stringify(user)),
  isLoggedIn: () => !!Auth.getAccessToken(),
};

// ── Core Request Handler ──────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  
  const token = Auth.getAccessToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) delete headers['Content-Type'];

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle 401 → try refresh
  if (response.status === 401 && !options._retry) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(() => request(path, { ...options, _retry: true }));
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        Auth.setAccessToken(data.data.accessToken);
        refreshQueue.forEach(q => q.resolve());
        refreshQueue = [];
        return request(path, { ...options, _retry: true });
      }
    } catch {}
    
    // Refresh failed — log out
    isRefreshing = false;
    refreshQueue.forEach(q => q.reject());
    refreshQueue = [];
    Auth.clearTokens();
    if (window.location.pathname.includes('dashboard')) {
      window.location.href = '/admin-login.html';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }));
    throw new Error(err.message || 'Request failed');
  }

  return response.json();
}

// ── Shorthand helpers ─────────────────────────────────────────
const get  = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(path + qs);
};
const post = (path, body, isForm) => request(path, {
  method: 'POST',
  body: isForm ? body : JSON.stringify(body),
});
const put  = (path, body, isForm) => request(path, {
  method: 'PUT',
  body: isForm ? body : JSON.stringify(body),
});
const patch = (path, body) => request(path, {
  method: 'PATCH',
  body: JSON.stringify(body),
});
const del  = (path) => request(path, { method: 'DELETE' });

// ── Auth API ──────────────────────────────────────────────────
export const AuthAPI = {
  login: async (email, password) => {
    const data = await post('/auth/login', { email, password });
    Auth.setAccessToken(data.data.accessToken);
    Auth.setUser(data.data.user);
    return data.data;
  },
  logout: async () => {
    await post('/auth/logout').catch(() => {});
    Auth.clearTokens();
  },
  getMe: () => get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    post('/auth/change-password', { currentPassword, newPassword }),
  isLoggedIn: Auth.isLoggedIn,
  getUser: Auth.getUser,
};

// ── Portfolio (Public) API ────────────────────────────────────
export const PortfolioAPI = {
  getProjects: (params) => get('/portfolio/projects', params),
  getProjectBySlug: (slug) => get(`/portfolio/projects/${slug}`),
  getAbout: () => get('/portfolio/about'),
  getSkills: () => get('/portfolio/skills'),
  getExperience: () => get('/portfolio/experience'),
  getStats: () => get('/portfolio/stats'),
  submitContact: (data) => post('/portfolio/contact', data),
  getCategories: () => get('/categories'),
};

// ── Projects Admin API ────────────────────────────────────────
export const ProjectsAPI = {
  getAll: (params) => get('/projects/admin/all', params),
  getOne: (id) => get(`/projects/${id}`),
  create: (formData) => post('/projects', formData, true),
  update: (id, formData) => put(`/projects/${id}`, formData, true),
  delete: (id) => del(`/projects/${id}`),
  addImages: (id, formData) => post(`/projects/${id}/images`, formData, true),
  togglePublish: (id) => patch(`/admin/projects/${id}/toggle`),
  toggleFeatured: (id) => patch(`/admin/projects/${id}/featured`),
};

// ── Admin API ─────────────────────────────────────────────────
export const AdminAPI = {
  getDashboard: () => get('/admin/dashboard'),
  
  // About/Profile
  getAbout: () => get('/admin/about'),
  updateAbout: (formData) => put('/admin/about', formData, true),
  
  // Skills
  getSkills: () => get('/admin/skills'),
  createSkill: (data) => post('/admin/skills', data),
  updateSkill: (id, data) => put(`/admin/skills/${id}`, data),
  deleteSkill: (id) => del(`/admin/skills/${id}`),
  
  // Experience
  getExperience: () => get('/admin/experience'),
  createExperience: (data) => post('/admin/experience', data),
  updateExperience: (id, data) => put(`/admin/experience/${id}`, data),
  deleteExperience: (id) => del(`/admin/experience/${id}`),
  
  // Messages
  getMessages: (params) => get('/admin/messages', params),
  getMessage: (id) => get(`/admin/messages/${id}`),
  markRead: (id) => patch(`/admin/messages/${id}/read`),
  deleteMessage: (id) => del(`/admin/messages/${id}`),
  
  // Projects (admin routes)
  getProjects: (params) => get('/admin/projects', params),
  createProject: (formData) => post('/admin/projects', formData, true),
  updateProject: (id, formData) => put(`/admin/projects/${id}`, formData, true),
  deleteProject: (id) => del(`/admin/projects/${id}`),
  
  // Categories
  getCategories: () => get('/categories'),
  createCategory: (data) => post('/categories', data),
  updateCategory: (id, data) => put(`/categories/${id}`, data),
  deleteCategory: (id) => del(`/categories/${id}`),
};

// ── Health Check ──────────────────────────────────────────────
export const health = () => fetch(`${API_BASE.replace('/api', '')}/health`).then(r => r.json());

export { Auth };
export default { AuthAPI, PortfolioAPI, ProjectsAPI, AdminAPI, health, Auth };
