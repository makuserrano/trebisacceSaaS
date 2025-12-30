import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import {
  createAccount,
  getAccounts,
  removeAccount,
  updateAccount,
} from '../../../services/accounts.service.js';
import { getAccountBalances } from '../../../services/transactions.service.js';
import './treasury.scss';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo', align: 'center' },
  { key: 'saldo', label: 'Saldo', align: 'right' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
];

const typeLabel = {
  cash: 'Caja',
  bank: 'Banco',
  mp: 'Mercado Pago',
  other: 'Otro',
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function AccountsList() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'cash',
  });

  const fetchAccounts = () => {
    setLoading(true);
    setError(null);
    getAccounts()
      .then((data) => {
        setAccounts(data);
        return getAccountBalances(data.map((account) => account.id));
      })
      .then((data) => setBalances(data))
      .catch((err) => setError(err?.message || 'Error al cargar cuentas'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAccounts(), 0);
    return () => clearTimeout(timer);
  }, []);

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

  const handleOpenModal = (account = null) => {
    setModalError(null);
    setSubmitAttempted(false);
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name || '',
        type: account.type || 'cash',
      });
    } else {
      setEditingAccount(null);
      setFormData({ name: '', type: 'cash' });
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
    if (!formData.name.trim()) {
      setModalError('El nombre es obligatorio.');
      return;
    }
    setIsSaving(true);
    setModalError(null);
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
    };
    const request = editingAccount
      ? updateAccount(editingAccount.id, payload)
      : createAccount(payload);
    request
      .then((result) => {
        if (editingAccount) {
          setAccounts((prev) =>
            prev.map((item) => (item.id === result.id ? result : item))
          );
        } else {
          setAccounts((prev) => [result, ...prev]);
        }
        setIsModalOpen(false);
        setEditingAccount(null);
        fetchAccounts();
      })
      .catch((err) => {
        setModalError(err?.message || 'Error al guardar cuenta');
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteAccount = (account) => {
    const ok = window.confirm(
      `¿Eliminar la cuenta ${account.name}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    removeAccount(account.id)
      .then(() => {
        setAccounts((prev) => prev.filter((item) => item.id !== account.id));
        fetchAccounts();
      })
      .catch((err) => {
        setError(err?.message || 'Error al eliminar cuenta');
      });
  };

  const rows = useMemo(() => {
    return accounts.map((account) => ({
      id: account.id,
      cells: [
        account.name,
        typeLabel[account.type] || account.type,
        currencyFormatter.format(balances[account.id] || 0),
        <div key="acciones" className="treasury__action-cell">
          <button
            type="button"
            className="treasury__inline-action"
            onClick={() => handleOpenModal(account)}
          >
            Editar
          </button>
          <button
            type="button"
            className="treasury__inline-action"
            onClick={() => handleDeleteAccount(account)}
          >
            Eliminar
          </button>
        </div>,
      ],
    }));
  }, [accounts, balances]);

  const showEmpty = !loading && !error && accounts.length === 0;
  const isNameInvalid = submitAttempted && !formData.name.trim();

  return (
    <section className="app-page treasury-page--accounts">
      <PageHeader
        title="Cuentas"
        subtitle="Gestión de cuentas de caja y banco"
        actions={<PrimaryButton label="Nueva cuenta" onClick={() => handleOpenModal()} />}
      />

      {loading && <p>Cargando...</p>}
      {error && (
        <div>
          <p>{error}</p>
          <PrimaryButton label="Reintentar" onClick={fetchAccounts} />
        </div>
      )}
      {showEmpty && (
        <div>
          <p>Todavía no hay cuentas.</p>
          <PrimaryButton label="Nueva cuenta" onClick={() => handleOpenModal()} />
        </div>
      )}

      {!loading && !error && !showEmpty && (
        <DataTable columns={columns} rows={rows} />
      )}

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
              {editingAccount ? 'Editar cuenta' : 'Nueva cuenta'}
            </h2>
            <form className="treasury__modal-form" onSubmit={handleSubmit}>
              <label className="treasury__modal-field">
                <span>Nombre</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFieldChange}
                  placeholder="Ej: Caja Principal"
                  className={isNameInvalid ? 'treasury__field-invalid' : ''}
                />
                {isNameInvalid && (
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
                  <option value="cash">Caja</option>
                  <option value="bank">Banco</option>
                  <option value="mp">Mercado Pago</option>
                  <option value="other">Otro</option>
                </select>
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
