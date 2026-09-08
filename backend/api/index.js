import url from 'node:url';
import { handleRequest, syncCatalogFromDatabase, dbPool } from '../mock-spree-server.mjs';

let synced = false;

export default async function handler(req, res) {
  if (!synced && dbPool) {
    try {
      await syncCatalogFromDatabase();
      synced = true;
    } catch (err) {
      console.warn('Initial sync failed:', err.message);
    }
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname || '';

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Spree-Publishable-Key, X-Spree-Channel, X-Spree-Currency, X-Spree-Country, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  let body = req.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      // Raw non-JSON string
    }
  }

  handleRequest(req, res, pathname, parsedUrl.query, body);
}
