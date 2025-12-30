import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import SegmentedTabs from '../../../components/app/SegmentedTabs.jsx';
import {
  createClient,
  getClients,
  removeClient,
  updateClient,
} from '../../../services/clients.service.js';
import './contacts.scss';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo', align: 'center' },
  { key: 'email', label: 'Email', align: 'center' },
  { key: 'telefono', label: 'Telefono', align: 'right' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
];

export default function ContactsList() {
  const [tab, setTab] = useState('todos');
  const [clients, setClients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'empresa',
    email: '',
    phone: '',
  });

  const fetchClients = () => {
    setLoading(true);
    setError(null);
    getClients()
      .then((data) => setClients(data))
      .catch((err) => setError(err?.message || 'Error al cargar contactos'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchClients(), 0);
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

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return clients.filter((client) => {
      if (tab === 'clientes' && client.type === 'proveedor') return false;
      if (tab === 'proveedores' && client.type !== 'proveedor') return false;
      if (!normalizedQuery) return true;
      const name = (client.name || '').toLowerCase();
      const email = (client.email || '').toLowerCase();
      const phone = (client.phone || '').toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        phone.includes(normalizedQuery)
      );
    });
  }, [clients, query, tab]);

  const handleOpenModal = (client = null) => {
    setError(null);
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name || '',
        type: client.type || 'empresa',
        email: client.email || '',
        phone: client.phone || '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        type: 'empresa',
        email: '',
        phone: '',
      });
    }
    setNameTouched(false);
    setSubmitAttempted(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitAttempted(true);
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    setIsSaving(true);
    setError(null);
    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };
    const request = editingClient
      ? updateClient(editingClient.id, payload)
      : createClient(payload);
    request
      .then((result) => {
        if (editingClient) {
          setClients((prev) =>
            prev.map((item) => (item.id === result.id ? result : item))
          );
        } else {
          setClients((prev) => [result, ...prev]);
        }
        setIsModalOpen(false);
        setEditingClient(null);
      })
      .catch((err) => {
        setError(err?.message || 'Error al guardar contacto');
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteClient = (client) => {
    const ok = window.confirm(
      `¿Eliminar el contacto ${client.name}? Esta accion no se puede deshacer.`
    );
    if (!ok) return;
    removeClient(client.id)
      .then(() => {
        setClients((prev) => prev.filter((item) => item.id !== client.id));
      })
      .catch((err) => {
        setError(err?.message || 'Error al eliminar contacto');
      });
  };

  const showEmpty = !loading && !error && filteredClients.length === 0;
  const isNameInvalid = !formData.name.trim();
  const showNameError = (nameTouched || submitAttempted) && isNameInvalid;

  return (
    <section className="app-page">
      <PageHeader
        title="Contactos"
        subtitle="Gestion de clientes y proveedores"
        actions={
          <>
            <SearchInput
              placeholder="Buscar contactos..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <PrimaryButton label="Nuevo contacto" onClick={() => handleOpenModal()} />
          </>
        }
      />

      <div className="contacts__filters">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'clientes', label: 'Clientes' },
            { value: 'proveedores', label: 'Proveedores' },
          ]}
        />
      </div>

      {loading && <p>Cargando...</p>}
      {error && (
        <div>
          <p>{error}</p>
          <PrimaryButton label="Reintentar" onClick={fetchClients} />
        </div>
      )}

      {showEmpty && (
        <div>
          <p>Todavia no hay contactos.</p>
          <PrimaryButton label="Nuevo contacto" onClick={() => handleOpenModal()} />
        </div>
      )}

      {!loading && !error && !showEmpty && (
        <DataTable
          columns={columns}
          rows={filteredClients.map((client) => ({
            id: client.id,
            cells: [
              client.name,
              client.type || '-',
              client.email || '-',
              client.phone || '-',
              <div key="acciones" className="contacts__action-cell">
                <button
                  type="button"
                  className="contacts__inline-action"
                  onClick={() => handleOpenModal(client)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="contacts__inline-action"
                  onClick={() => handleDeleteClient(client)}
                >
                  Eliminar
                </button>
              </div>,
            ],
          }))}
        />
      )}

      {isModalOpen && (
        <div
          className="contacts__modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div
            className="contacts__modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="contacts__modal-title">
              {editingClient ? 'Editar contacto' : 'Nuevo contacto'}
            </h2>
            <form className="contacts__modal-form" onSubmit={handleSubmit}>
              <label className="contacts__modal-field">
                <span>Nombre</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFieldChange}
                  onBlur={() => setNameTouched(true)}
                  placeholder="Ej: Acme Corp"
                />
                {showNameError && (
                  <span className="contacts__field-error">
                    El nombre es obligatorio.
                  </span>
                )}
              </label>
              <label className="contacts__modal-field">
                <span>Tipo</span>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleFieldChange}
                >
                  <option value="empresa">Empresa</option>
                  <option value="pyme">Pyme</option>
                  <option value="minorista">Minorista</option>
                  <option value="persona">Persona</option>
                  <option value="proveedor">Proveedor</option>
                </select>
              </label>
              <label className="contacts__modal-field">
                <span>Email</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFieldChange}
                  placeholder="Ej: contacto@empresa.com"
                />
              </label>
              <label className="contacts__modal-field">
                <span>Telefono</span>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFieldChange}
                  placeholder="Ej: +54 11 4321 0001"
                />
              </label>
              <div className="contacts__modal-actions">
                <button
                  type="button"
                  className="contacts__modal-cancel"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <PrimaryButton
                  type="submit"
                  label={isSaving ? 'Guardando...' : 'Guardar'}
                  disabled={isSaving || isNameInvalid}
                />
              </div>
            </form>
            {error && <p className="contacts__modal-error">{error}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
