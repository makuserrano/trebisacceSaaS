const STORAGE_KEY = 'trebisacce_accounts_v1';
const TRANSACTIONS_KEY = 'trebisacce_transactions_v1';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const seedAccounts = [
  { id: 'acc-001', name: 'Caja', type: 'cash', currency: 'ARS' },
  { id: 'acc-002', name: 'Banco', type: 'bank', currency: 'ARS' },
  { id: 'acc-003', name: 'Mercado Pago', type: 'mp', currency: 'ARS' },
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

function readAccounts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAccounts));
    return [...seedAccounts];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (err) {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedAccounts));
  return [...seedAccounts];
}

function writeAccounts(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function emitAccountsChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('trebisacce:accounts-changed'));
}

function normalizeName(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function sanitizeAccount(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.name !== undefined) allowed.name = data.name;
  if (data.type !== undefined) allowed.type = data.type;
  if (data.currency !== undefined) allowed.currency = data.currency;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
  return allowed;
}

function validateAccount(account, ignoreId = '') {
  if (!account.name) throw new Error('El nombre es obligatorio');
  const normalized = normalizeName(account.name);
  const accounts = readAccounts();
  const duplicate = accounts.find(
    (item) => normalizeName(item.name) === normalized && item.id !== ignoreId
  );
  if (duplicate) throw new Error('Ya existe una cuenta con ese nombre');
}

function hasAccountTransactions(accountId) {
  if (!accountId) return false;
  const raw = localStorage.getItem(TRANSACTIONS_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return false;
    return parsed.some(
      (tx) =>
        tx?.accountId === accountId ||
        tx?.fromAccountId === accountId ||
        tx?.toAccountId === accountId
    );
  } catch (err) {
    return false;
  }
}

export function getAccounts() {
  return withLatency(() => readAccounts().map((account) => ({ ...account })));
}

export function createAccount(accountData) {
  return withLatency(() => {
    const accounts = readAccounts();
    const clean = sanitizeAccount(accountData);
    validateAccount(clean);
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newAccount = {
      ...clean,
      id: clean.id || `acc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      currency: clean.currency || 'ARS',
      createdAt,
      updatedAt,
    };
    accounts.unshift(newAccount);
    writeAccounts(accounts);
    emitAccountsChanged();
    return { ...newAccount };
  });
}

export function updateAccount(id, partialData) {
  return withLatency(() => {
    if (!id) throw new Error('Account id is required');
    const accounts = readAccounts();
    const index = accounts.findIndex((account) => account.id === id);
    if (index === -1) throw new Error('Account not found');
    const updates = sanitizeAccount(partialData);
    const updated = {
      ...accounts[index],
      ...updates,
      id: accounts[index].id,
      updatedAt: updates.updatedAt ?? Date.now(),
    };
    validateAccount(updated, accounts[index].id);
    accounts[index] = updated;
    writeAccounts(accounts);
    emitAccountsChanged();
    return { ...updated };
  });
}

export function removeAccount(id) {
  return withLatency(() => {
    if (!id) throw new Error('Account id is required');
    const accounts = readAccounts();
    const target = accounts.find((account) => account.id === id);
    if (!target) throw new Error('Account not found');
    if (hasAccountTransactions(id)) {
      throw new Error('No se puede eliminar una cuenta con movimientos');
    }
    const nextAccounts = accounts.filter((account) => account.id !== id);
    writeAccounts(nextAccounts);
    emitAccountsChanged();
    return { id };
  });
}
