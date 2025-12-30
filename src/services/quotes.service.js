import * as XLSX from 'xlsx';
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
  } catch {
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

function normalizeDateValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'number') {
    const parser = XLSX?.SSF?.parse_date_code;
    if (typeof parser === 'function') {
      const parsed = parser(value);
      if (parsed?.y && parsed?.m && parsed?.d) {
        const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
        return date.toISOString().slice(0, 10);
      }
    }
    return '';
  }
  if (typeof value === 'string' || value instanceof String) {
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const slashMatch = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);

    if (slashMatch) {
      const day = Number(slashMatch[1]);
      const month = Number(slashMatch[2]);
      let year = Number(slashMatch[3]);
      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year.toString().padStart(4, '0')}-${month
          .toString()
          .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      }
    }
    return '';
  }
  return '';
}

function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeQuoteDate(value) {
  return normalizeDateValue(value);
}

function assertValidDate(value) {
  if (!value) throw new Error('La fecha es obligatoria');
  if (!isValidDateString(value)) throw new Error('La fecha es inválida');
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
    const normalizedDate = normalizeDateValue(clean.date);
    assertValidDate(normalizedDate);
    const totalValue = Number(clean.total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      throw new Error('El total debe ser mayor a 0');
    }
    const resolvedClientId = clean.clientId || resolveClientIdByName(clean.clientName);
    const newQuote = {
      ...clean,
      date: normalizedDate,
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
    if (updates.date !== undefined) {
      const normalizedDate = normalizeDateValue(updates.date);
      assertValidDate(normalizedDate);
      updates.date = normalizedDate;
    }
    if (updates.total !== undefined) {
      const totalValue = Number(updates.total);
      if (!Number.isFinite(totalValue) || totalValue <= 0) {
        throw new Error('El total debe ser mayor a 0');
      }
    }
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
