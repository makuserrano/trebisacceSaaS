const STORAGE_KEY = 'trebisacce_transactions_v1';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const seedTransactions = [
  {
    id: 'tx-001',
    date: '2025-01-18',
    type: 'expense',
    amount: 240,
    accountId: 'acc-001',
    category: 'Oficina',
    description: 'Suministros oficina',
  },
  {
    id: 'tx-002',
    date: '2025-01-17',
    type: 'expense',
    amount: 89,
    accountId: 'acc-002',
    category: 'Servicios',
    description: 'Hosting mensual',
  },
  {
    id: 'tx-003',
    date: '2025-01-16',
    type: 'income',
    amount: 3450,
    accountId: 'acc-002',
    category: 'Ventas',
    description: 'Cobro factura F-2025-0042',
  },
  {
    id: 'tx-004',
    date: '2025-01-15',
    type: 'income',
    amount: 1200,
    accountId: 'acc-003',
    category: 'Online',
    description: 'Ventas ecommerce',
  },
  {
    id: 'tx-005',
    date: '2025-01-14',
    type: 'expense',
    amount: 310,
    accountId: 'acc-001',
    category: 'Logistica',
    description: 'Envios',
  },
  {
    id: 'tx-006',
    date: '2025-01-13',
    type: 'income',
    amount: 980,
    accountId: 'acc-001',
    category: 'Ventas',
    description: 'Cobro mostrador',
  },
  {
    id: 'tx-007',
    date: '2025-01-12',
    type: 'transfer',
    amount: 500,
    fromAccountId: 'acc-001',
    toAccountId: 'acc-002',
    description: 'Reposicion banco',
  },
  {
    id: 'tx-008',
    date: '2025-01-11',
    type: 'expense',
    amount: 140,
    accountId: 'acc-003',
    category: 'Comisiones',
    description: 'Comision MP',
  },
  {
    id: 'tx-009',
    date: '2025-01-10',
    type: 'income',
    amount: 760,
    accountId: 'acc-002',
    category: 'Servicios',
    description: 'Consultoria',
  },
  {
    id: 'tx-010',
    date: '2025-01-09',
    type: 'expense',
    amount: 210,
    accountId: 'acc-001',
    category: 'Marketing',
    description: 'Campana redes',
  },
  {
    id: 'tx-011',
    date: '2025-01-08',
    type: 'transfer',
    amount: 300,
    fromAccountId: 'acc-002',
    toAccountId: 'acc-003',
    description: 'Fondeo MP',
  },
  {
    id: 'tx-012',
    date: '2025-01-07',
    type: 'expense',
    amount: 95,
    accountId: 'acc-002',
    category: 'Servicios',
    description: 'Dominios',
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

function readTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTransactions));
    return [...seedTransactions];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTransactions));
  return [...seedTransactions];
}

function writeTransactions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function emitTransactionsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('trebisacce:transactions-changed'));
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

function sanitizeTransaction(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.date !== undefined) allowed.date = normalizeDate(data.date);
  if (data.type !== undefined) allowed.type = data.type;
  if (data.amount !== undefined) allowed.amount = normalizeAmount(data.amount);
  if (data.accountId !== undefined) allowed.accountId = data.accountId;
  if (data.fromAccountId !== undefined) allowed.fromAccountId = data.fromAccountId;
  if (data.toAccountId !== undefined) allowed.toAccountId = data.toAccountId;
  if (data.category !== undefined) allowed.category = data.category;
  if (data.description !== undefined) allowed.description = data.description;
  if (data.reference !== undefined) allowed.reference = data.reference;
  if (data.relatedEntity !== undefined) allowed.relatedEntity = data.relatedEntity;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
  return allowed;
}

function validateTransaction(transaction) {
  if (!transaction.date) throw new Error('La fecha es obligatoria');
  if (!transaction.type) throw new Error('El tipo es obligatorio');
  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    throw new Error('El monto debe ser mayor a 0');
  }
  if (transaction.type === 'transfer') {
    if (!transaction.fromAccountId || !transaction.toAccountId) {
      throw new Error('Transferencia requiere cuentas origen y destino');
    }
    if (transaction.fromAccountId === transaction.toAccountId) {
      throw new Error('Las cuentas de la transferencia deben ser distintas');
    }
  } else {
    if (!transaction.accountId) throw new Error('La cuenta es obligatoria');
  }
}

function applyFilters(list, filter) {
  const { startDate, endDate, type, accountId } = filter || {};
  return list.filter((item) => {
    if (type && item.type !== type) return false;
    if (startDate && (item.date || '') < startDate) return false;
    if (endDate && (item.date || '') > endDate) return false;
    if (accountId) {
      if (item.type === 'transfer') {
        return item.fromAccountId === accountId || item.toAccountId === accountId;
      }
      return item.accountId === accountId;
    }
    return true;
  });
}

function summarize(list) {
  return list.reduce(
    (acc, item) => {
      if (item.type === 'income') acc.income += Number(item.amount) || 0;
      if (item.type === 'expense') acc.expense += Number(item.amount) || 0;
      return acc;
    },
    { income: 0, expense: 0 }
  );
}

function buildDailySeries(list, startDate, endDate) {
  const map = {};
  const result = [];
  list.forEach((item) => {
    const date = item.date || '';
    if (!date) return;
    if (!map[date]) {
      map[date] = { date, income: 0, expense: 0, net: 0 };
    }
    if (item.type === 'income') {
      map[date].income += Number(item.amount) || 0;
    } else if (item.type === 'expense') {
      map[date].expense += Number(item.amount) || 0;
    }
    map[date].net = map[date].income - map[date].expense;
  });
  const start = startDate || '';
  const end = endDate || '';
  const dates = Object.keys(map).sort();
  dates.forEach((date) => {
    if (start && date < start) return;
    if (end && date > end) return;
    result.push(map[date]);
  });
  return result;
}

export function getTransactions(filter = {}) {
  return withLatency(() => {
    const transactions = readTransactions().map((tx) => ({ ...tx }));
    const filtered = applyFilters(transactions, filter);
    filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return filtered;
  });
}

export function createTransaction(data) {
  return withLatency(() => {
    const transactions = readTransactions();
    const clean = sanitizeTransaction(data);
    validateTransaction(clean);
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newTransaction = {
      ...clean,
      id: clean.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt,
      updatedAt,
    };
    transactions.unshift(newTransaction);
    writeTransactions(transactions);
    emitTransactionsChanged();
    return { ...newTransaction };
  });
}

export function updateTransaction(id, patch) {
  return withLatency(() => {
    if (!id) throw new Error('Transaction id is required');
    const transactions = readTransactions();
    const index = transactions.findIndex((tx) => tx.id === id);
    if (index === -1) throw new Error('Transaction not found');
    const updates = sanitizeTransaction(patch);
    const updated = {
      ...transactions[index],
      ...updates,
      id: transactions[index].id,
      updatedAt: updates.updatedAt ?? Date.now(),
    };
    validateTransaction(updated);
    transactions[index] = updated;
    writeTransactions(transactions);
    emitTransactionsChanged();
    return { ...updated };
  });
}

export function removeTransaction(id) {
  return withLatency(() => {
    if (!id) throw new Error('Transaction id is required');
    const transactions = readTransactions();
    const nextTransactions = transactions.filter((tx) => tx.id !== id);
    if (nextTransactions.length === transactions.length) {
      throw new Error('Transaction not found');
    }
    writeTransactions(nextTransactions);
    emitTransactionsChanged();
    return { id };
  });
}

export function getAccountBalances(accountIds = []) {
  return withLatency(() => {
    const transactions = readTransactions();
    const balances = {};
    const ensure = (id) => {
      if (!id) return;
      balances[id] = balances[id] ?? 0;
    };
    accountIds.forEach((id) => ensure(id));
    transactions.forEach((tx) => {
      const amount = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        ensure(tx.accountId);
        balances[tx.accountId] += amount;
      } else if (tx.type === 'expense') {
        ensure(tx.accountId);
        balances[tx.accountId] -= amount;
      } else if (tx.type === 'transfer') {
        ensure(tx.fromAccountId);
        ensure(tx.toAccountId);
        balances[tx.fromAccountId] -= amount;
        balances[tx.toAccountId] += amount;
      }
    });
    return balances;
  });
}

export function getTransactionsSummary(filter = {}) {
  return withLatency(() => {
    const transactions = applyFilters(readTransactions(), filter);
    const { income, expense } = summarize(transactions);
    return {
      income,
      expense,
      net: income - expense,
    };
  });
}

export function getDailyNetSeries(filter = {}) {
  return withLatency(() => {
    const transactions = applyFilters(readTransactions(), filter);
    return buildDailySeries(transactions, filter.startDate, filter.endDate);
  });
}

export function getExpenseByCategory(filter = {}) {
  return withLatency(() => {
    const transactions = applyFilters(readTransactions(), filter);
    const summary = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'expense') return;
      const key = tx.category || 'Sin categoria';
      summary[key] = (summary[key] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(summary).map(([name, value]) => ({ name, value }));
  });
}

export function getIncomeByAccount(filter = {}) {
  return withLatency(() => {
    const transactions = applyFilters(readTransactions(), filter);
    const summary = {};
    transactions.forEach((tx) => {
      if (tx.type !== 'income') return;
      const key = tx.accountId || 'sin-cuenta';
      summary[key] = (summary[key] || 0) + (Number(tx.amount) || 0);
    });
    return Object.entries(summary).map(([accountId, value]) => ({
      accountId,
      value,
    }));
  });
}
