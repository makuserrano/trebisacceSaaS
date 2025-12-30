const STORAGE_KEY = 'trebisacce_clients_v1';
const LATENCY_MIN = 300;
const LATENCY_MAX = 500;

const seedClients = [
  {
    id: 'cli-001',
    name: 'Acme Corp',
    type: 'empresa',
    email: 'contact@acme.com',
    phone: '+54 11 4321 0001',
  },
  {
    id: 'cli-002',
    name: 'Tech Solutions',
    type: 'pyme',
    email: 'info@techsol.com',
    phone: '+54 11 4321 0002',
  },
  {
    id: 'cli-003',
    name: 'Global Services',
    type: 'empresa',
    email: 'hello@global.com',
    phone: '+54 11 4321 0003',
  },
  {
    id: 'cli-004',
    name: 'Northwind',
    type: 'pyme',
    email: 'ventas@northwind.com',
    phone: '+54 11 4321 0004',
  },
  {
    id: 'cli-005',
    name: 'Office Supplies Inc',
    type: 'proveedor',
    email: 'sales@officesupplies.com',
    phone: '+54 11 4321 0005',
  },
  {
    id: 'cli-006',
    name: 'Distribuidora La Plata',
    type: 'minorista',
    email: 'compras@dlp.com',
    phone: '+54 11 4321 0006',
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

function readClients() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedClients));
    return [...seedClients];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch  {
    // fall through to reset if corrupted
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedClients));
  return [...seedClients];
}

function writeClients(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeName(value) {
  if (!value) return '';
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function assertUniqueName(name, ignoreId = '') {
  const normalized = normalizeName(name);
  const clients = readClients();
  const duplicate = clients.find(
    (client) =>
      normalizeName(client.name) === normalized && client.id !== ignoreId
  );
  if (duplicate) {
    throw new Error('Ya existe un cliente con ese nombre');
  }
}

function validateClient(data, ignoreId = '') {
  if (!data.name) throw new Error('El nombre es obligatorio');
  assertUniqueName(data.name, ignoreId);
  if (data.email && !isEmailValid(data.email)) {
    throw new Error('Email invalido');
  }
}

function readStorageList(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    return [];
  }
  return [];
}

function hasClientReferences(client) {
  if (!client) return false;
  const normalizedName = normalizeName(client.name);
  const invoices = readStorageList('trebisacce_invoices');
  const quotes = readStorageList('trebisacce_quotes');
  const matchClient = (item) =>
    item?.clientId === client.id ||
    (item?.clientName && normalizeName(item.clientName) === normalizedName);
  return invoices.some(matchClient) || quotes.some(matchClient);
}

function sanitizeClient(data) {
  if (!data || typeof data !== 'object') return {};
  const allowed = {};
  if (data.id !== undefined) allowed.id = data.id;
  if (data.name !== undefined) allowed.name = data.name;
  if (data.type !== undefined) allowed.type = data.type;
  if (data.email !== undefined) allowed.email = data.email;
  if (data.phone !== undefined) allowed.phone = data.phone;
  if (data.createdAt !== undefined) allowed.createdAt = data.createdAt;
  if (data.updatedAt !== undefined) allowed.updatedAt = data.updatedAt;
  return allowed;
}

export function getClients() {
  return withLatency(() => readClients().map((client) => ({ ...client })));
}

export function getClientById(id) {
  if (!id) throw new Error('Client id is required');
  const clients = readClients();
  const client = clients.find((item) => item.id === id);
  if (!client) return null;
  return { ...client };
}

export function findClientByName(name) {
  if (!name) return null;
  const normalized = normalizeName(name);
  const clients = readClients();
  const matches = clients.filter((client) => normalizeName(client.name) === normalized);
  if (matches.length === 1) return { ...matches[0] };
  return null;
}

export function getOrCreateClientByName(name) {
  return withLatency(() => {
    if (!name) throw new Error('Client name is required');
    const normalized = normalizeName(name);
    const clients = readClients();
    const existing = clients.find(
      (client) => normalizeName(client.name) === normalized
    );
    if (existing) return { ...existing };
    const now = Date.now();
    const newClient = {
      id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.toString().trim(),
      type: 'empresa',
      createdAt: now,
      updatedAt: now,
    };
    clients.unshift(newClient);
    writeClients(clients);
    return { ...newClient };
  });
}

export function createClient(clientData) {
  return withLatency(() => {
    const clients = readClients();
    const clean = sanitizeClient(clientData);
    validateClient(clean);
    const now = Date.now();
    const createdAt = clean.createdAt ?? now;
    const updatedAt = clean.updatedAt ?? createdAt;
    const newClient = {
      ...clean,
      id: clean.id || `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt,
      updatedAt,
    };
    clients.unshift(newClient);
    writeClients(clients);
    return { ...newClient };
  });
}

export function updateClient(id, partialData) {
  return withLatency(() => {
    if (!id) throw new Error('Client id is required');
    const clients = readClients();
    const index = clients.findIndex((client) => client.id === id);
    if (index === -1) throw new Error('Client not found');
    const updates = sanitizeClient(partialData);
    const updated = {
      ...clients[index],
      ...updates,
      id: clients[index].id,
      updatedAt: updates.updatedAt ?? Date.now(),
    };
    validateClient(updated, clients[index].id);
    clients[index] = updated;
    writeClients(clients);
    return { ...updated };
  });
}

export function removeClient(id) {
  return withLatency(() => {
    if (!id) throw new Error('Client id is required');
    const clients = readClients();
    const target = clients.find((client) => client.id === id);
    if (!target) {
      throw new Error('Client not found');
    }
    if (hasClientReferences(target)) {
      throw new Error('No se puede eliminar: cliente con movimientos');
    }
    const nextClients = clients.filter((client) => client.id !== id);
    if (nextClients.length === clients.length) {
      throw new Error('Client not found');
    }
    writeClients(nextClients);
    return { id };
  });
}
