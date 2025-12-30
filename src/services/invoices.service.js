import * as XLSX from 'xlsx';
import { findClientByName, getClientById } from './clients.service.js';

const STORAGE_KEY = 'trebisacce_invoices';
const PAYMENTS_STORAGE_KEY = 'trebisacce_payments_v1';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const seedInvoices = [
  { id: 'inv-001', number: 'F-2025-0042', clientName: 'Acme Corp', date: '2025-01-18', status: 'issued', total: 3450 },
  { id: 'inv-002', number: 'F-2025-0041', clientName: 'Tech Solutions', date: '2025-01-16', status: 'issued', total: 1890 },
  { id: 'inv-003', number: 'F-2025-0045', clientName: 'Acme Corp', date: '2025-01-10', status: 'draft', total: 2500 },
  { id: 'inv-004', number: 'F-2025-0046', clientName: 'Global Services', date: '2025-01-08', status: 'paid', total: 980 },
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

function readInvoices() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedInvoices));
    return [...seedInvoices];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedInvoices));
  return [...seedInvoices];
}

function writeInvoices(list) {
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
const INVOICES_CHANGED_EVENT = 'trebisacce:invoices-changed';

function emitInvoicesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(INVOICES_CHANGED_EVENT));
}

function sanitizeInvoice(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.number !== undefined) allowed.number = data.number;
  if (data.clientName !== undefined) allowed.clientName = data.clientName;
  if (data.clientId !== undefined) allowed.clientId = data.clientId;
  if (data.date !== undefined) allowed.date = data.date;
  if (data.status !== undefined) allowed.status = data.status;
  if (data.total !== undefined) allowed.total = data.total;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
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

export function normalizeInvoiceDate(value) {
  return normalizeDateValue(value);
}

function assertValidDate(value) {
  if (!value) throw new Error('La fecha es obligatoria');
  if (!isValidDateString(value)) throw new Error('La fecha es inválida');
}

export function getInvoices() {
  return withLatency(() => {
    const invoices = readInvoices().map((inv) => hydrateClientName({ ...inv }));
    invoices.sort((a, b) => {
      const dateCompare = (b.date || '').localeCompare(a.date || '');
      if (dateCompare !== 0) return dateCompare;
      const createdB = Number(b.createdAt) || 0;
      const createdA = Number(a.createdAt) || 0;
      return createdB - createdA;
    });
    return invoices;
  });
}

export function createInvoice(invoiceData) {
  return withLatency(() => {
    const invoices = readInvoices();
    const clean = sanitizeInvoice(invoiceData);
    const normalizedDate = normalizeDateValue(clean.date);
    assertValidDate(normalizedDate);
    const totalValue = Number(clean.total);
    if (!Number.isFinite(totalValue) || totalValue <= 0) {
      throw new Error('El total debe ser mayor a 0');
    }
    const resolvedClientId = clean.clientId || resolveClientIdByName(clean.clientName);
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newInvoice = {
      ...clean,
      date: normalizedDate,
      clientId: resolvedClientId || clean.clientId,
      id: clean.id || `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt,
      updatedAt,
    };
    invoices.unshift(newInvoice);
    writeInvoices(invoices);
    return { ...newInvoice };
  });
}

export function updateInvoice(id, partialData) {
  return withLatency(() => {
    if (!id) throw new Error('Invoice id is required');
    const invoices = readInvoices();
    const index = invoices.findIndex((inv) => inv.id === id);
    if (index === -1) throw new Error('Invoice not found');
    const updates = sanitizeInvoice(partialData);
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
    const updated = { ...invoices[index], ...updates, clientId: resolvedClientId || updates.clientId, id: invoices[index].id };
    invoices[index] = updated;
    writeInvoices(invoices);
    return { ...updated };
  });
}

export function getInvoiceSnapshot(id) {
  if (!id) throw new Error('Invoice id is required');
  const invoices = readInvoices();
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) throw new Error('Invoice not found');
  return { ...invoice };
}

export function updateInvoiceStatus(id, status) {
  if (!id) throw new Error('Invoice id is required');
  const invoices = readInvoices();
  const index = invoices.findIndex((inv) => inv.id === id);
  if (index === -1) throw new Error('Invoice not found');
  const updatedAt = Date.now();
  const updated = {
    ...invoices[index],
    status,
    updatedAt,
  };
  invoices[index] = updated;
  writeInvoices(invoices);
  emitInvoicesChanged();
  return { ...updated };
}

export function deleteInvoice(id) {
  return withLatency(() => {
    if (!id) throw new Error('Invoice id is required');
    const invoices = readInvoices();
    const rawPayments = localStorage.getItem(PAYMENTS_STORAGE_KEY);
    if (rawPayments) {
      try {
        const payments = JSON.parse(rawPayments);
        if (Array.isArray(payments)) {
          const hasPayments = payments.some((payment) => payment?.invoiceId === id);
          if (hasPayments) {
            throw new Error('No se puede eliminar una factura con pagos registrados');
          }
        }
      } catch (err) {
        if (err?.message) throw err;
      }
    }
    const nextInvoices = invoices.filter((inv) => inv.id !== id);
    if (nextInvoices.length === invoices.length) {
      throw new Error('Invoice not found');
    }
    writeInvoices(nextInvoices);
    return { id };
  });
}
