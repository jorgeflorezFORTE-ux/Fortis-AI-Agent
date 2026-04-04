/**
 * lib/tokenStore.js
 * Almacenamiento de tokens OAuth.
 * En desarrollo: archivo JSON local.
 * En producción (Vercel): usar Vercel KV (descomentar sección de abajo).
 */

import fs from 'fs';
import path from 'path';

const TOKEN_FILE = path.join(process.cwd(), '.tokens.json');

function readTokens() {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return {};
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

export function saveToken(companyId, tokenData) {
  const tokens = readTokens();
  tokens[companyId] = {
    ...tokenData,
    savedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  };
  writeTokens(tokens);
}

export function getToken(companyId) {
  const tokens = readTokens();
  return tokens[companyId] || null;
}

export function getAllTokens() {
  return readTokens();
}

export function deleteToken(companyId) {
  const tokens = readTokens();
  delete tokens[companyId];
  writeTokens(tokens);
}

export function isTokenExpired(tokenData) {
  if (!tokenData?.expiresAt) return true;
  return new Date(tokenData.expiresAt) < new Date(Date.now() + 5 * 60 * 1000);
}

export function getConnectionStatus() {
  const tokens = readTokens();
  const status = {};
  Object.keys(tokens).forEach(id => {
    status[id] = {
      connected: true,
      expired: isTokenExpired(tokens[id]),
      savedAt: tokens[id].savedAt,
      realmId: tokens[id].realmId,
    };
  });
  return status;
}

/* ── PRODUCCIÓN (Vercel KV) ──────────────────────────────────────────────────
Para Vercel, instala: npm install @vercel/kv
Luego reemplaza las funciones de arriba con:

import { kv } from '@vercel/kv';

export async function saveToken(companyId, tokenData) {
  await kv.set(`token:${companyId}`, JSON.stringify({
    ...tokenData,
    savedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  }));
}

export async function getToken(companyId) {
  const data = await kv.get(`token:${companyId}`);
  return data ? JSON.parse(data) : null;
}
────────────────────────────────────────────────────────────────────────────── */
