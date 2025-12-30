import { findClientByName, getClientById } from './clients.service.js';

const STORAGE_KEY = 'trebisacce_quotes';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const ALLOWED_STATUS = new Set(['sent', 'converted']);

const seedQuotes = [
  { id: 'quo-001', clientName: 'Acme Corp', date: '2025-01-20', status: 'sent', total: 4200 },
  { id: 'quo-002', clientName: 'Tech Solutions', date: '2025-01-18', status: 'converted', total: 1850 },
  { id: 'quo-003', clientName: 'Global Services', date: '2025-01-12', status: 'sent', total: 7600 },
];

function withLatency(resultFn) {
  const delay = Math.floor(Math.random() * (LATENCY_MAX - LATENCY_MIN + 1)) + LATENCY_MIN;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(resultFn());
      } catch (err) {
        reject(err);
      }
    }, delay);
  });
}

function normalizeStatus(value) {
  if (value === null || value === undefined) return 'sent';
  const raw = value.toString().trim().toLowerCase();
  if (!raw) return 'sent';
  if (raw === 'sent' || raw.includes('enviado')) return 'sent';
  if (raw === 'converted' || raw.includes('convert') || raw.includes('acept')) return 'converted';
  if (raw.includes('draft') || raw.includes('borrador')) return 'sent';
  if (raw.includes('rejected') || raw.includes('rechaz')) return 'sent';
  return ALLOWED_STATUS.has(raw) ? raw : 'sent';
}

function readQuotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedQuotes));
    return [...seedQuotes];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedQuotes));
  return [...seedQuotes];
}

function writeQuotes(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}


function hydrateClientName(entity) {
  if (!entity) return entity;
  if (entity.clientName) return entity;
  if (entity.clientId) {
    const client = getClientById(entity.clientId);
    if (client?.name) return { ...entity, clientName: client.name };
  }
  return entity;
}

function resolveClientIdByName(name) {
  if (!name) return '';
  const client = findClientByName(name);
  return client?.id || '';
}
function sanitizeQuote(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.clientName !== undefined) allowed.clientName = data.clientName;
  if (data.clientId !== undefined) allowed.clientId = data.clientId;
  if (data.date !== undefined) allowed.date = data.date;
  if (data.status !== undefined) allowed.status = normalizeStatus(data.status);
  if (data.total !== undefined) allowed.total = data.total;
  return allowed;
}

export function getQuotes() {
  return withLatency(() => {
    const quotes = readQuotes().map((quote) => ({
      ...hydrateClientName(quote),
      status: normalizeStatus(quote.status),
    }));
    quotes.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return quotes;
  });
}

export function createQuote(quoteData) {
  return withLatency(() => {
    const quotes = readQuotes();
    const clean = sanitizeQuote(quoteData);
    const resolvedClientId = clean.clientId || resolveClientIdByName(clean.clientName);
    const newQuote = {
      ...clean,
      clientId: resolvedClientId || clean.clientId,
      status: clean.status || 'sent',
      id: clean.id || `quo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    quotes.unshift(newQuote);
    writeQuotes(quotes);
    return { ...newQuote };
  });
}

export function updateQuote(id, partialData) {
  return withLatency(() => {
    if (!id) throw new Error('Quote id is required');
    const quotes = readQuotes();
    const index = quotes.findIndex((quote) => quote.id === id);
    if (index === -1) throw new Error('Quote not found');
    const updates = sanitizeQuote(partialData);
    const resolvedClientId = updates.clientId || resolveClientIdByName(updates.clientName);
    const updated = { ...quotes[index], ...updates, clientId: resolvedClientId || updates.clientId, id: quotes[index].id };
    if (updated.status) {
      updated.status = normalizeStatus(updated.status);
    }
    quotes[index] = updated;
    writeQuotes(quotes);
    return { ...updated };
  });
}

export function removeQuote(id) {
  return withLatency(() => {
    if (!id) throw new Error('Quote id is required');
    const quotes = readQuotes();
    const nextQuotes = quotes.filter((quote) => quote.id !== id);
    if (nextQuotes.length === quotes.length) {
      throw new Error('Quote not found');
    }
    writeQuotes(nextQuotes);
    return { id };
  });
}
