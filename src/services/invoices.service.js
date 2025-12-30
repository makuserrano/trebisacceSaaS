const STORAGE_KEY = 'trebisacce_invoices';
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
  } catch (err) {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedInvoices));
  return [...seedInvoices];
}

function writeInvoices(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function sanitizeInvoice(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.number !== undefined) allowed.number = data.number;
  if (data.clientName !== undefined) allowed.clientName = data.clientName;
  if (data.date !== undefined) allowed.date = data.date;
  if (data.status !== undefined) allowed.status = data.status;
  if (data.total !== undefined) allowed.total = data.total;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
  return allowed;
}

export function getInvoices() {
  return withLatency(() => {
    const invoices = readInvoices().map((inv) => ({ ...inv }));
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
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newInvoice = {
      ...clean,
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
    const updated = { ...invoices[index], ...updates, id: invoices[index].id };
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
  return { ...updated };
}

export function deleteInvoice(id) {
  return withLatency(() => {
    if (!id) throw new Error('Invoice id is required');
    const invoices = readInvoices();
    const nextInvoices = invoices.filter((inv) => inv.id !== id);
    if (nextInvoices.length === invoices.length) {
      throw new Error('Invoice not found');
    }
    writeInvoices(nextInvoices);
    return { id };
  });
}
