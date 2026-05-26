/**
 * Cloudflare Workers Entry Point
 * للتعامل مع الطلبات على Cloudflare Workers
 */

import { Router } from 'itty-router';

// إنشاء Router
const router = Router();

// API Routes
router.get('/api/health', () => ({
  status: 'ok',
  message: 'Algzzar Portfolio API is running on Cloudflare Workers',
  timestamp: new Date().toISOString(),
}));

// Proxy requests to backend
router.all('/api/*', async (request, env, ctx) => {
  const backendUrl = env.BACKEND_URL || 'http://localhost:5000';
  const url = new URL(request.url);
  url.hostname = new URL(backendUrl).hostname;
  url.protocol = new URL(backendUrl).protocol;

  return fetch(new Request(url, request));
});

// 404 handler
router.all('*', () => ({
  error: 'Not Found',
  message: 'The requested resource was not found',
  status: 404,
}));

// Export handler
export default {
  fetch: router.handle,

  // Health check
  async scheduled(request, env, ctx) {
    const response = await fetch(`${env.BACKEND_URL || 'http://localhost:5000'}/api/health`);
    console.log('Scheduled health check:', response.status);
  },
};
