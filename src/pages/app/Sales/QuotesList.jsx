import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import StatusBadge from '../../../components/app/StatusBadge.jsx';
import './sales.scss';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'total', label: 'Total', align: 'center' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'fecha', label: 'Fecha', align: 'right' },
];

const row = {
  id: 'q1',
  cliente: 'Acme Corp',
  total: '€2,500',
  estado: 'Enviado',
  fecha: '2025-01-15',
};

export default function QuotesList() {
  return (
    <section className="app-page">
      <PageHeader
        title="Presupuestos"
        subtitle="Gestión de presupuestos"
        actions={<PrimaryButton label="Nuevo presupuesto" />}
      />

      <DataTable
        columns={columns}
        rows={[
          {
            id: row.id,
            cells: [
              row.id,
              row.cliente,
              row.total,
              <div className="sales__estado" key="estado">
                <StatusBadge label={row.estado} />
                <button type="button" className="sales__link">
                  Convertir a factura
                </button>
              </div>,
              row.fecha,
            ],
          },
        ]}
      />
    </section>
  );
}
