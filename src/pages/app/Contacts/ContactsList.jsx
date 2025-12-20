import { useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import SegmentedTabs from '../../../components/app/SegmentedTabs.jsx';
import './contacts.scss';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo', align: 'center' },
  { key: 'email', label: 'Email', align: 'center' },
  { key: 'telefono', label: 'Teléfono', align: 'right' },
];

const rows = [
  ['Acme Corp', 'Cliente', 'contact@acme.com', '+34 911 222 333'],
  ['Tech Solutions', 'Cliente', 'info@techsol.com', '+34 922 333 444'],
  ['Global Services', 'Cliente', 'hello@global.com', '+34 933 444 555'],
  ['Office Supplies Inc', 'Proveedor', 'sales@officesupplies.com', '+34 944 555 666'],
];

export default function ContactsList() {
  const [tab, setTab] = useState('todos');

  return (
    <section className="app-page">
      <PageHeader
        title="Contactos"
        subtitle="Gestión de clientes y proveedores"
        actions={
          <>
            <SearchInput placeholder="Buscar contactos…" />
            <PrimaryButton label="Nuevo contacto" />
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

      <DataTable
        columns={columns}
        rows={rows.map((cells, index) => ({ id: index, cells }))}
      />
    </section>
  );
}
