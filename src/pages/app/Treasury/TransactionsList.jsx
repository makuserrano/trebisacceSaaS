import { useCallback, useEffect, useMemo, useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import SegmentedTabs from '../../../components/app/SegmentedTabs.jsx';
import { getAccounts } from '../../../services/accounts.service.js';
import {
  createTransaction,
  getAccountBalances,
  getTransactions,
  getTransactionsSummary,
  removeTransaction,
  updateTransaction,
} from '../../../services/transactions.service.js';
import './treasury.scss';

const columns = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'tipo', label: 'Tipo', align: 'center' },
  { key: 'cuenta', label: 'Cuenta' },
  { key: 'categoria', label: 'Categoria', align: 'center' },
  { key: 'monto', label: 'Monto', align: 'right' },
  { key: 'descripcion', label: 'Descripcion' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
];

const typeLabel = {
  income: 'Ingreso',
  expense: 'Egreso',
  transfer: 'Transferencia',
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function getDateRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const toIso = (date) => date.toISOString().slice(0, 10);
  return { startDate: toIso(start), endDate: toIso(end) };
}

export default function TransactionsList() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ income: 0, expense: 0, net: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('todos');
  const [filters, setFilters] = useState(() => ({
    ...getDateRange(30),
    accountId: '',
  }));
  const [formData, setFormData] = useState({
    date: '',
    type: 'income',
    amount: '',
    accountId: '',
    fromAccountId: '',
    toAccountId: '',
    category: '',
    description: '',
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    setError(null);
    const typeFilter = tab === 'todos' ? '' : tab;
    const requestFilter = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: typeFilter,
      accountId: filters.accountId || '',
    };
    Promise.all([
      getAccounts(),
      getTransactions(requestFilter),
      getTransactionsSummary(requestFilter),
    ])
      .then(([accountsData, transactionsData, summaryData]) => {
        setAccounts(accountsData);
        setTransactions(transactionsData);
        setSummary(summaryData);
        return getAccountBalances(accountsData.map((account) => account.id));
      })
      .then((data) => setBalances(data))
      .catch((err) => setError(err?.message || 'Error al cargar movimientos'))
      .finally(() => setLoading(false));
  }, [filters.accountId, filters.endDate, filters.startDate, tab]);

  useEffect(() => {
    Promise.resolve().then(fetchData);
  }, [fetchData]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving]);

  const accountMap = useMemo(() => {
    return accounts.reduce((acc, account) => {
      acc[account.id] = account;
      return acc;
    }, {});
  }, [accounts]);

  const getAccountName = (accountId) => {
    if (!accountId) return '—';
    return accountMap[accountId]?.name || 'Cuenta eliminada';
  };

  const hasMissingAccount = (tx) => {
    if (!tx) return false;
    if (tx.type === 'transfer') {
      const fromMissing = tx.fromAccountId && !accountMap[tx.fromAccountId];
      const toMissing = tx.toAccountId && !accountMap[tx.toAccountId];
      return fromMissing || toMissing;
    }
    return tx.accountId && !accountMap[tx.accountId];
  };

  const totalBalance = Object.values(balances).reduce(
    (acc, value) => acc + (Number(value) || 0),
    0
  );

  const filteredTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return transactions;
    return transactions.filter((tx) => {
      const description = (tx.description || '').toLowerCase();
      const category = (tx.category || '').toLowerCase();
      const accountName =
        accountMap[tx.accountId]?.name ||
        accountMap[tx.fromAccountId]?.name ||
        accountMap[tx.toAccountId]?.name ||
        '';
      return (
        description.includes(normalized) ||
        category.includes(normalized) ||
        accountName.toLowerCase().includes(normalized)
      );
    });
  }, [transactions, query, accountMap]);

  const handleOpenModal = (transaction = null) => {
    setModalError(null);
    setSubmitAttempted(false);
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        date: transaction.date || '',
        type: transaction.type || 'income',
        amount: transaction.amount?.toString() || '',
        accountId: transaction.accountId || '',
        fromAccountId: transaction.fromAccountId || '',
        toAccountId: transaction.toAccountId || '',
        category: transaction.category || '',
        description: transaction.description || '',
      });
    } else {
      setEditingTransaction(null);
      setFormData({
        date: '',
        type: 'income',
        amount: '',
        accountId: '',
        fromAccountId: '',
        toAccountId: '',
        category: '',
        description: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (modalError) setModalError(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    const amountValue = Number(formData.amount);
    const isTransfer = formData.type === 'transfer';
    if (!formData.date || Number.isNaN(amountValue) || amountValue <= 0) {
      setModalError('Completá fecha y monto válido.');
      return;
    }
    if (isTransfer) {
      if (!formData.fromAccountId || !formData.toAccountId) {
        setModalError('Seleccioná cuentas de origen y destino.');
        return;
      }
    } else if (!formData.accountId) {
      setModalError('Seleccioná una cuenta.');
      return;
    }
    setIsSaving(true);
    setModalError(null);
    const payload = {
      date: formData.date,
      type: formData.type,
      amount: amountValue,
      accountId: formData.type === 'transfer' ? '' : formData.accountId,
      fromAccountId: formData.type === 'transfer' ? formData.fromAccountId : '',
      toAccountId: formData.type === 'transfer' ? formData.toAccountId : '',
      category: formData.category.trim(),
      description: formData.description.trim(),
    };
    const request = editingTransaction
      ? updateTransaction(editingTransaction.id, payload)
      : createTransaction(payload);
    request
      .then(() => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        fetchData();
      })
      .catch((err) => setModalError(err?.message || 'Error al guardar movimiento'))
      .finally(() => setIsSaving(false));
  };

  const handleDelete = (transaction) => {
    const ok = window.confirm(
      '¿Eliminar el movimiento? Esta acción no se puede deshacer.'
    );
    if (!ok) return;
    removeTransaction(transaction.id)
      .then(() => fetchData())
      .catch((err) => setError(err?.message || 'Error al eliminar movimiento'));
  };

  const rows = filteredTransactions.map((tx) => {
    const description = tx.description || tx.reference || '—';
    const isAccountMissing = hasMissingAccount(tx);
    return {
      id: tx.id,
      cells: [
        tx.date,
        <span key="tipo" className={`treasury__type-badge treasury__type-${tx.type}`}>
          {typeLabel[tx.type] || tx.type}
        </span>,
        tx.type === 'transfer'
          ? `${getAccountName(tx.fromAccountId)} → ${getAccountName(tx.toAccountId)}`
          : getAccountName(tx.accountId),
        tx.category || '—',
        currencyFormatter.format(tx.amount),
        description,
        <div key="acciones" className="treasury__action-cell">
          <button
            type="button"
            className="treasury__inline-action"
            onClick={() => handleOpenModal(tx)}
            disabled={isAccountMissing}
            title={isAccountMissing ? 'No se puede editar: cuenta eliminada.' : undefined}
          >
            Editar
          </button>
          <button
            type="button"
            className="treasury__inline-action"
            onClick={() => handleDelete(tx)}
          >
            Eliminar
          </button>
        </div>,
      ],
    };
  });

  const isDateInvalid = submitAttempted && !formData.date;
  const isAmountInvalid =
    submitAttempted && (formData.amount === '' || Number.isNaN(Number(formData.amount)));
  const isAccountInvalid =
    submitAttempted &&
    ((formData.type === 'transfer' &&
      (!formData.fromAccountId || !formData.toAccountId)) ||
      (formData.type !== 'transfer' && !formData.accountId));

  return (
    <section className="app-page treasury-page--transactions">
      <PageHeader
        title="Movimientos"
        subtitle="Gestión de ingresos, egresos y transferencias"
        actions={
          <>
            <SearchInput
              placeholder="Buscar movimientos..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <PrimaryButton label="Nuevo movimiento" onClick={() => handleOpenModal()} />
          </>
        }
      />

      <div className="treasury__filters">
        <SegmentedTabs
          value={tab}
          onChange={(value) => setTab(value)}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'income', label: 'Ingresos' },
            { value: 'expense', label: 'Egresos' },
            { value: 'transfer', label: 'Transferencias' },
          ]}
        />
      </div>

      <div className="treasury__filters treasury__filters--row">
        <label className="treasury__filter">
          <span>Desde</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, startDate: event.target.value }))
            }
          />
        </label>
        <label className="treasury__filter">
          <span>Hasta</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, endDate: event.target.value }))
            }
          />
        </label>
        <label className="treasury__filter">
          <span>Cuenta</span>
          <select
            value={filters.accountId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, accountId: event.target.value }))
            }
          >
            <option value="">Todas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!loading && !error && (
        <div className="kpi-grid">
          <article className="kpi-card">
            <p className="kpi-card__label">Ingresos del mes</p>
            <p className="kpi-card__value">
              {currencyFormatter.format(summary.income)}
            </p>
            <p className="kpi-card__meta">movimientos income</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-card__label">Egresos del mes</p>
            <p className="kpi-card__value">
              {currencyFormatter.format(summary.expense)}
            </p>
            <p className="kpi-card__meta">movimientos expense</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-card__label">Neto del mes</p>
            <p className="kpi-card__value">
              {currencyFormatter.format(summary.net)}
            </p>
            <p className="kpi-card__meta">ingresos - egresos</p>
          </article>
          <article className="kpi-card">
            <p className="kpi-card__label">Saldo total</p>
            <p className="kpi-card__value">
              {currencyFormatter.format(totalBalance)}
            </p>
            <p className="kpi-card__meta">todas las cuentas</p>
          </article>
        </div>
      )}

      {loading && <p>Cargando...</p>}
      {error && (
        <div className="treasury__state">
          <p>{error}</p>
          <button type="button" className="treasury__cta" onClick={fetchData}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && <DataTable columns={columns} rows={rows} />}

      {isModalOpen && (
        <div
          className="treasury__modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div
            className="treasury__modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="treasury__modal-title">
              {editingTransaction ? 'Editar movimiento' : 'Nuevo movimiento'}
            </h2>
            <form className="treasury__modal-form" onSubmit={handleSubmit}>
              <label className="treasury__modal-field">
                <span>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFieldChange}
                  className={isDateInvalid ? 'treasury__field-invalid' : ''}
                />
                {isDateInvalid && (
                  <span className="treasury__field-error">Obligatorio</span>
                )}
              </label>
              <label className="treasury__modal-field">
                <span>Tipo</span>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFieldChange}
                >
                  <option value="income">Ingreso</option>
                  <option value="expense">Egreso</option>
                  <option value="transfer">Transferencia</option>
                </select>
              </label>
              {formData.type === 'transfer' ? (
                <>
                  <label className="treasury__modal-field">
                    <span>Cuenta origen</span>
                    <select
                      name="fromAccountId"
                      value={formData.fromAccountId}
                      onChange={handleFieldChange}
                      className={isAccountInvalid ? 'treasury__field-invalid' : ''}
                    >
                      <option value="">Seleccionar cuenta</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="treasury__modal-field">
                    <span>Cuenta destino</span>
                    <select
                      name="toAccountId"
                      value={formData.toAccountId}
                      onChange={handleFieldChange}
                      className={isAccountInvalid ? 'treasury__field-invalid' : ''}
                    >
                      <option value="">Seleccionar cuenta</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    {isAccountInvalid && (
                      <span className="treasury__field-error">Obligatorio</span>
                    )}
                  </label>
                </>
              ) : (
                <label className="treasury__modal-field">
                  <span>Cuenta</span>
                  <select
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleFieldChange}
                    className={isAccountInvalid ? 'treasury__field-invalid' : ''}
                  >
                    <option value="">Seleccionar cuenta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                  {isAccountInvalid && (
                    <span className="treasury__field-error">Obligatorio</span>
                  )}
                </label>
              )}
              <label className="treasury__modal-field">
                <span>Monto</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFieldChange}
                  min="0"
                  step="1"
                  placeholder="Ej: 125000"
                  className={isAmountInvalid ? 'treasury__field-invalid' : ''}
                />
                {isAmountInvalid && (
                  <span className="treasury__field-error">Monto inválido</span>
                )}
              </label>
              <label className="treasury__modal-field">
                <span>Categoria</span>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleFieldChange}
                  placeholder="Ej: Servicios"
                />
              </label>
              <label className="treasury__modal-field">
                <span>Descripcion</span>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFieldChange}
                  placeholder="Ej: Pago proveedor"
                />
              </label>
              <div className="treasury__modal-actions">
                <button
                  type="button"
                  className="treasury__modal-cancel"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <PrimaryButton
                  type="submit"
                  label={isSaving ? 'Guardando...' : 'Guardar'}
                  disabled={isSaving}
                />
              </div>
            </form>
            {modalError && <p className="treasury__modal-error">{modalError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
