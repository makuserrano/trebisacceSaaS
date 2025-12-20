import DataTable from '../../../components/app/DataTable.jsx';
import InlineSelect from '../../../components/app/InlineSelect.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import './sales.scss';

const columns = [
  { key: 'numero', label: 'Número' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'total', label: 'Total', align: 'center' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'fecha', label: 'Fecha', align: 'right' },
];

const rows = [
  ['F-2025-0042', 'Acme Corp', '€3,450', 'Emitida', '2025-01-18'],
  ['F-2025-0041', 'Tech Solutions', '€1,890', 'Emitida', '2025-01-16'],
  ['F-2025-0045', 'Acme Corp', '€2,500', 'Borrador', '2025-12-20'],
];

export default function InvoicesList() {
  return (
    <section className="app-page">
      <PageHeader
        title="Facturas"
        subtitle="Gestión de facturas"
        actions={<PrimaryButton label="Nueva factura" />}
      />

      <DataTable
        columns={columns}
        rows={rows.map((row, index) => ({
          id: index,
          cells: [
            row[0],
            row[1],
            row[2],
            <InlineSelect key="estado" label={row[3]} />,
            row[4],
          ],
        }))}
      />
    </section>
  );
}
