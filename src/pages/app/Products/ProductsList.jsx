import { useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import StatusBadge from '../../../components/app/StatusBadge.jsx';
import ToggleSwitch from '../../../components/app/ToggleSwitch.jsx';
import SegmentedTabs from '../../../components/app/SegmentedTabs.jsx';
import './products.scss';

const columns = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'precio', label: 'Precio', align: 'right' },
  { key: 'costo', label: 'Costo', align: 'right' },
  { key: 'stock', label: 'Stock', align: 'right' },
  { key: 'estado', label: 'Estado', align: 'center' },
];

const rows = [
  ['Servicio Consultoría Básica', '€450', '€200', '0', true],
  ['Desarrollo Web Standard', '€2,500', '€1,200', '0', true],
  ['Mantenimiento Mensual', '€180', '€80', '0', true],
  ['Licencia Software Pro', '€89', '€30', '50', true],
];

export default function ProductsList() {
  const [tab, setTab] = useState('todos');

  return (
    <section className="app-page">
      <PageHeader
        title="Productos"
        subtitle="Gestión de productos y servicios"
        actions={
          <>
            <SearchInput placeholder="Buscar productos…" />
            <PrimaryButton label="Nuevo producto" />
          </>
        }
      />

      <div className="products__filters">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'servicios', label: 'Servicios' },
            { value: 'productos', label: 'Productos' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows.map((item, index) => ({
          id: index,
          cells: [
            item[0],
            item[1],
            item[2],
            item[3],
            <div className="products__status" key="estado">
              <StatusBadge label="Activo" />
              <ToggleSwitch on={item[4]} />
            </div>,
          ],
        }))}
      />
    </section>
  );
}
