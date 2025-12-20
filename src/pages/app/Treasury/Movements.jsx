import { useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import SegmentedTabs from '../../../components/app/SegmentedTabs.jsx';
import './treasury.scss';

const columns = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'fecha', label: 'Fecha', align: 'right' },
  { key: 'monto', label: 'Monto', align: 'right' },
  { key: 'concepto', label: 'Concepto' },
  { key: 'cuenta', label: 'Cuenta', align: 'center' },
];

const rows = [
  { tipo: 'Egreso', fecha: '2025-01-18', monto: '€240', concepto: 'Suministros oficina', cuenta: 'Caja Principal' },
  { tipo: 'Egreso', fecha: '2025-01-17', monto: '€89', concepto: 'Hosting mensual', cuenta: 'Banco Santander' },
  { tipo: 'Ingreso', fecha: '2025-01-16', monto: '€3,450', concepto: 'Factura F-2025-0042', cuenta: 'Banco Santander' },
];

const arrow = {
  ingreso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 19V5M12 5l-5 5M12 5l5 5" />
    </svg>
  ),
  egreso: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 5v14M12 19l-5-5M12 19l5-5" />
    </svg>
  ),
};

export default function Movements() {
  const [tab, setTab] = useState('todos');

  return (
    <section className="app-page">
      <PageHeader
        title="Movimientos"
        subtitle="Gestión de ingresos y egresos"
        actions={
          <>
            <SearchInput placeholder="Buscar movimientos…" />
            <PrimaryButton label="Nuevo movimiento" />
          </>
        }
      />

      <div className="treasury__filters">
        <SegmentedTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'todos', label: 'Todos' },
            { value: 'ingresos', label: 'Ingresos' },
            { value: 'egresos', label: 'Egresos' },
          ]}
        />
      </div>

      <DataTable
        columns={columns}
        rows={rows.map((item, index) => ({
          id: index,
          cells: [
            <span className="treasury__tipo" key="tipo">
              <span className="treasury__tipo-icon">
                {item.tipo === 'Ingreso' ? arrow.ingreso : arrow.egreso}
              </span>
              <span>{item.tipo}</span>
            </span>,
            item.fecha,
            item.monto,
            item.concepto,
            item.cuenta,
          ],
        }))}
      />
    </section>
  );
}
