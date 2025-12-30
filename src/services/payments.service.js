import { getInvoiceSnapshot, updateInvoiceStatus } from './invoices.service.js';

const STORAGE_KEY = 'trebisacce_payments_v1';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const METHOD_VALUES = new Set(['cash', 'transfer', 'card', 'mercado_pago', 'other']);

const seedPayments = [
  {
    id: 'pay-001',
    invoiceId: 'inv-001',
    date: '2025-01-19',
    amount: 1200,
    method: 'transfer',
    reference: 'TRX-0012',
    notes: '',
  },
  {
    id: 'pay-002',
    invoiceId: 'inv-001',
    date: '2025-01-20',
    amount: 900,
    method: 'card',
    reference: 'VISA-4821',
    notes: '',
  },
  {
    id: 'pay-003',
    invoiceId: 'inv-002',
    date: '2025-01-18',
    amount: 800,
    method: 'cash',
    reference: '',
    notes: 'Anticipo en caja',
  },
  {
    id: 'pay-004',
    invoiceId: 'inv-002',
    date: '2025-01-19',
    amount: 500,
    method: 'mercado_pago',
    reference: 'MP-7782',
    notes: '',
  },
  {
    id: 'pay-005',
    invoiceId: 'inv-004',
    date: '2025-01-09',
    amount: 980,
    method: 'transfer',
    reference: 'TRX-0021',
    notes: '',
  },
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

function readPayments() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPayments));
    return [...seedPayments];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedPayments));
  return [...seedPayments];
}

function writePayments(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeMethod(value) {
  if (!value) return 'other';
  const raw = value.toString().trim().toLowerCase();
  if (!raw) return 'other';
  if (METHOD_VALUES.has(raw)) return raw;
  if (raw.includes('mercado')) return 'mercado_pago';
  if (raw.includes('transf')) return 'transfer';
  if (raw.includes('efect')) return 'cash';
  if (raw.includes('tarj')) return 'card';
  return 'other';
}

function normalizeDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return '';
}

function normalizeAmount(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    let cleaned = value.trim();
    if (!cleaned) return Number.NaN;
    cleaned = cleaned.replace(/[^\d,.-]/g, '');
    if (!cleaned) return Number.NaN;
    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');
    if (hasComma && hasDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      cleaned = cleaned.replace(',', '.');
    }
    return Number(cleaned);
  }
  return Number.NaN;
}

function sanitizePayment(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.invoiceId !== undefined) allowed.invoiceId = data.invoiceId;
  if (data.date !== undefined) allowed.date = normalizeDate(data.date);
  if (data.amount !== undefined) allowed.amount = normalizeAmount(data.amount);
  if (data.method !== undefined) allowed.method = normalizeMethod(data.method);
  if (data.reference !== undefined) allowed.reference = data.reference;
  if (data.notes !== undefined) allowed.notes = data.notes;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
  return allowed;
}

function getPaidAmountFromList(list, invoiceId) {
  return list
    .filter((item) => item.invoiceId === invoiceId)
    .reduce((acc, item) => acc + (normalizeAmount(item.amount) || 0), 0);
}

function computeNextStatus(invoice, paidAmount) {
  if (invoice.status === 'draft') return 'draft';
  const total = Number(invoice.total) || 0;
  if (paidAmount >= total && total > 0) return 'paid';
  if (paidAmount > 0) return 'issued';
  return 'issued';
}

function ensureInvoiceIsPayable(invoiceId) {
  const invoice = getInvoiceSnapshot(invoiceId);
  if (invoice.status === 'draft') {
    throw new Error('No se pueden registrar pagos sobre facturas en borrador');
  }
  return invoice;
}

function validatePayment(data) {
  if (!data.invoiceId) throw new Error('invoiceId es obligatorio');
  if (!data.date) throw new Error('La fecha es obligatoria');
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    throw new Error('El monto debe ser mayor a 0');
  }
  if (!data.method || !METHOD_VALUES.has(data.method)) {
    throw new Error('Método de pago inválido');
  }
}

function recalculateInvoiceStatus(invoiceId, paymentsList) {
  let invoice;
  try {
    invoice = getInvoiceSnapshot(invoiceId);
  } catch (err) {
    return;
  }
  const paidAmount = getPaidAmountFromList(paymentsList, invoiceId);
  const nextStatus = computeNextStatus(invoice, paidAmount);
  updateInvoiceStatus(invoiceId, nextStatus);
}

export function getPayments(filter = {}) {
  return withLatency(() => {
    const payments = readPayments().map((payment) => ({ ...payment }));
    const { invoiceId } = filter || {};
    const filtered = invoiceId
      ? payments.filter((payment) => payment.invoiceId === invoiceId)
      : payments;
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return filtered;
  });
}

export function getPaymentsByInvoiceId(invoiceId) {
  return getPayments({ invoiceId });
}

export function getPaidAmount(invoiceId) {
  return withLatency(() => {
    if (!invoiceId) throw new Error('invoiceId es obligatorio');
    const payments = readPayments();
    return getPaidAmountFromList(payments, invoiceId);
  });
}

export function getInvoicePaymentSummaries(invoiceIds = []) {
  return withLatency(() => {
    const payments = readPayments();
    const summaries = {};
    invoiceIds.forEach((invoiceId) => {
      if (!invoiceId) return;
      let invoice;
      try {
        invoice = getInvoiceSnapshot(invoiceId);
      } catch (err) {
        return;
      }
      const paidAmount = getPaidAmountFromList(payments, invoiceId);
      const total = Number(invoice.total) || 0;
      summaries[invoiceId] = {
        paidAmount,
        balance: Math.max(total - paidAmount, 0),
      };
    });
    return summaries;
  });
}

export function getPaymentsSummary(filter = {}) {
  return withLatency(() => {
    const payments = readPayments();
    const { startDate, endDate } = filter || {};
    let total = 0;
    const byMethod = {};
    payments.forEach((payment) => {
      const date = payment.date || '';
      if (startDate && date < startDate) return;
      if (endDate && date > endDate) return;
      const amount = normalizeAmount(payment.amount) || 0;
      total += amount;
      const method = payment.method || 'other';
      byMethod[method] = (byMethod[method] || 0) + amount;
    });
    const methodSeries = Object.entries(byMethod).map(([method, value]) => ({
      method,
      value,
    }));
    return { total, byMethod: methodSeries };
  });
}

export function createPayment(paymentData) {
  return withLatency(() => {
    const payments = readPayments();
    const clean = sanitizePayment(paymentData);
    const invoice = ensureInvoiceIsPayable(clean.invoiceId);
    validatePayment(clean);
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newPayment = {
      ...clean,
      id: clean.id || `pay-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt,
      updatedAt,
    };
    payments.unshift(newPayment);
    writePayments(payments);
    recalculateInvoiceStatus(invoice.id, payments);
    return { ...newPayment };
  });
}

export function updatePayment(id, partialData) {
  return withLatency(() => {
    if (!id) throw new Error('Payment id is required');
    const payments = readPayments();
    const index = payments.findIndex((payment) => payment.id === id);
    if (index === -1) throw new Error('Payment not found');
    const previous = payments[index];
    const updates = sanitizePayment(partialData);
    const next = {
      ...previous,
      ...updates,
      id: previous.id,
      updatedAt: updates.updatedAt ?? Date.now(),
    };
    ensureInvoiceIsPayable(next.invoiceId);
    validatePayment(next);
    payments[index] = next;
    writePayments(payments);
    const affectedInvoices = new Set([previous.invoiceId, next.invoiceId]);
    affectedInvoices.forEach((invoiceId) => {
      recalculateInvoiceStatus(invoiceId, payments);
    });
    return { ...next };
  });
}

export function removePayment(id) {
  return withLatency(() => {
    if (!id) throw new Error('Payment id is required');
    const payments = readPayments();
    const payment = payments.find((item) => item.id === id);
    if (!payment) throw new Error('Payment not found');
    const nextPayments = payments.filter((item) => item.id !== id);
    writePayments(nextPayments);
    recalculateInvoiceStatus(payment.invoiceId, nextPayments);
    return { id };
  });
}
