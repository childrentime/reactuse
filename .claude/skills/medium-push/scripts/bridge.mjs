#!/usr/bin/env node

/**
 * Medium Push Bridge Server
 *
 * Zero-dependency Node.js server that bridges CLI tools with the Chrome extension.
 * Uses HTTP for receiving content and SSE for pushing to the extension.
 *
 * Endpoints:
 *   POST /paste   - Send markdown content to Medium editor
 *                   Body: { "content": "..." } or { "filePath": "/path/to/file.md" }
 *   GET  /events  - SSE stream consumed by the Chrome extension
 *   GET  /health  - Health check
 *
 * Usage:
 *   node bridge.mjs                    # default port 18766
 *   BRIDGE_PORT=9999 node bridge.mjs   # custom port
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const PORT = parseInt(process.env.BRIDGE_PORT || '18766', 10);
const sseClients = new Set();
let lastInspectResult = null;
let inspectResolve = null;

const server = createServer(async (req, res) => {
  // CORS — allow requests from any origin (extension + CLI)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── SSE stream for extension ───────────────────────────────────────
  if (req.method === 'GET' && req.url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write(': connected\n\n');
    sseClients.add(res);
    log(`SSE client connected (total: ${sseClients.size})`);

    req.on('close', () => {
      sseClients.delete(res);
      log(`SSE client disconnected (total: ${sseClients.size})`);
    });
    return;
  }

  // ── Health check ───────────────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/health') {
    json(res, 200, { status: 'ok', clients: sseClients.size, port: PORT });
    return;
  }

  // ── Paste endpoint ─────────────────────────────────────────────────
  if (req.method === 'POST' && req.url === '/paste') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        let content;
        const ct = req.headers['content-type'] || '';

        if (ct.includes('application/json')) {
          const payload = JSON.parse(body);
          if (payload.filePath) {
            content = readFileSync(payload.filePath, 'utf-8');
            log(`Read file: ${payload.filePath} (${content.length} chars)`);
          } else {
            content = payload.content;
          }
        } else {
          content = body;
        }

        if (!content) {
          json(res, 400, { error: 'Provide "content" or "filePath" in JSON body' });
          return;
        }

        const data = JSON.stringify({ type: 'SET_MARKDOWN', content });
        let sent = 0;
        for (const client of sseClients) {
          try {
            client.write(`data: ${data}\n\n`);
            sent++;
          } catch {
            sseClients.delete(client);
          }
        }

        log(`Sent ${content.length} chars to ${sent} client(s)`);
        json(res, 200, { success: true, contentLength: content.length, clientsSent: sent });
      } catch (e) {
        log(`Error: ${e.message}`);
        json(res, 500, { error: e.message });
      }
    });
    return;
  }

  // ── Inspect: ask extension to report DOM structure ───────────────
  if (req.method === 'GET' && req.url === '/inspect') {
    const data = JSON.stringify({ type: 'INSPECT_DOM' });
    let sent = 0;
    for (const client of sseClients) {
      try { client.write(`data: ${data}\n\n`); sent++; } catch { sseClients.delete(client); }
    }
    if (sent === 0) {
      json(res, 200, { error: 'No extension clients connected' });
      return;
    }
    // Wait for extension to POST back the result
    const promise = new Promise((resolve) => {
      inspectResolve = resolve;
      setTimeout(() => { inspectResolve = null; resolve({ error: 'timeout' }); }, 5000);
    });
    const result = await promise;
    json(res, 200, result);
    return;
  }

  // ── Inspect result: extension posts DOM info back ──────────────
  if (req.method === 'POST' && req.url === '/inspect-result') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const result = JSON.parse(body);
        lastInspectResult = result;
        if (inspectResolve) { inspectResolve(result); inspectResolve = null; }
        json(res, 200, { success: true });
      } catch (e) {
        json(res, 400, { error: e.message });
      }
    });
    return;
  }

  // ── 404 ────────────────────────────────────────────────────────────
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

server.listen(PORT, () => {
  log(`Medium Push Bridge running on http://localhost:${PORT}`);
  console.log(`  POST /paste   Send markdown to Medium editor`);
  console.log(`  GET  /events  SSE stream for extension`);
  console.log(`  GET  /health  Health check`);
  console.log();
});

// ── Helpers ────────────────────────────────────────────────────────────

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}
