const STORAGE_KEY = 'trebisacce_quotes';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const seedQuotes = [
  { id: 'quo-001', number: 'P-2025-010', clientName: 'Acme Corp', date: '2025-01-20', status: 'sent', total: 4200 },
  { id: 'quo-002', number: 'P-2025-009', clientName: 'Tech Solutions', date: '2025-01-18', status: 'draft', total: 1850 },
  { id: 'quo-003', number: 'P-2025-008', clientName: 'Global Services', date: '2025-01-12', status: 'accepted', total: 7600 },
  { id: 'quo-004', number: 'P-2025-007', clientName: 'Northwind', date: '2025-01-09', status: 'rejected', total: 2350 },
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

function sanitizeQuote(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.number !== undefined) allowed.number = data.number;
  if (data.clientName !== undefined) allowed.clientName = data.clientName;
  if (data.date !== undefined) allowed.date = data.date;
  if (data.status !== undefined) allowed.status = data.status;
  if (data.total !== undefined) allowed.total = data.total;
  return allowed;
}

export function getQuotes() {
  return withLatency(() => {
    const quotes = readQuotes();
    return quotes.map((quote) => ({ ...quote }));
  });
}

export function createQuote(quoteData) {
  return withLatency(() => {
    const quotes = readQuotes();
    const clean = sanitizeQuote(quoteData);
    const newQuote = {
      ...clean,
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
    const updated = { ...quotes[index], ...updates, id: quotes[index].id };
    quotes[index] = updated;
    writeQuotes(quotes);
    return { ...updated };
  });
}
