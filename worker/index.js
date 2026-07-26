// Cloudflare Worker entry point. The live deployment
// (incentives-calculator2.nibbz2024.workers.dev) is a plain Worker with a
// static-assets binding, not a Cloudflare Pages project — Pages Functions'
// file-based routing doesn't apply here, so this hand-routes each API
// handler (still just plain functions in functions/api/**, unchanged) and
// falls back to serving the built frontend for everything else.
import * as bootstrap from '../functions/api/bootstrap.js';
import * as login from '../functions/api/admin/login.js';
import * as logout from '../functions/api/admin/logout.js';
import * as me from '../functions/api/admin/me.js';
import * as changePassword from '../functions/api/admin/change-password.js';
import * as schemesIndex from '../functions/api/admin/schemes/index.js';
import * as schemesActivate from '../functions/api/admin/schemes/activate.js';
import * as productsIndex from '../functions/api/admin/products/index.js';
import * as rulesIndex from '../functions/api/admin/rules/index.js';
import * as ruleById from '../functions/api/admin/rules/[id].js';
import * as announcementsIndex from '../functions/api/admin/announcements/index.js';
import * as announcementById from '../functions/api/admin/announcements/[id].js';

const routes = [
  { method: 'GET', pattern: /^\/api\/bootstrap$/, handler: bootstrap.onRequestGet },
  { method: 'POST', pattern: /^\/api\/admin\/login$/, handler: login.onRequestPost },
  { method: 'POST', pattern: /^\/api\/admin\/logout$/, handler: logout.onRequestPost },
  { method: 'GET', pattern: /^\/api\/admin\/me$/, handler: me.onRequestGet },
  { method: 'POST', pattern: /^\/api\/admin\/change-password$/, handler: changePassword.onRequestPost },
  { method: 'GET', pattern: /^\/api\/admin\/schemes$/, handler: schemesIndex.onRequestGet },
  { method: 'PUT', pattern: /^\/api\/admin\/schemes$/, handler: schemesIndex.onRequestPut },
  { method: 'POST', pattern: /^\/api\/admin\/schemes\/activate$/, handler: schemesActivate.onRequestPost },
  { method: 'GET', pattern: /^\/api\/admin\/products$/, handler: productsIndex.onRequestGet },
  { method: 'PUT', pattern: /^\/api\/admin\/products$/, handler: productsIndex.onRequestPut },
  { method: 'GET', pattern: /^\/api\/admin\/rules$/, handler: rulesIndex.onRequestGet },
  { method: 'PUT', pattern: /^\/api\/admin\/rules$/, handler: rulesIndex.onRequestPut },
  { method: 'DELETE', pattern: /^\/api\/admin\/rules\/([^/]+)$/, handler: ruleById.onRequestDelete, paramNames: ['id'] },
  { method: 'GET', pattern: /^\/api\/admin\/announcements$/, handler: announcementsIndex.onRequestGet },
  { method: 'PUT', pattern: /^\/api\/admin\/announcements$/, handler: announcementsIndex.onRequestPut },
  { method: 'DELETE', pattern: /^\/api\/admin\/announcements\/([^/]+)$/, handler: announcementById.onRequestDelete, paramNames: ['id'] }
];

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), camera=(), microphone=()'
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      for (const route of routes) {
        if (route.method !== request.method) continue;
        const match = url.pathname.match(route.pattern);
        if (!match) continue;
        const params = {};
        (route.paramNames || []).forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });
        return route.handler({ request, env, params, waitUntil: ctx.waitUntil.bind(ctx) });
      }
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => headers.set(k, v));
    return new Response(assetResponse.body, { status: assetResponse.status, headers });
  }
};
