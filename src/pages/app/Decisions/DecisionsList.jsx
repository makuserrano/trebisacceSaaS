import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import SearchInput from '../../../components/app/SearchInput.jsx';
import StatusBadge from '../../../components/app/StatusBadge.jsx';
import './decisions.scss';

const columns = [
  { key: 'titulo', label: 'Título' },
  { key: 'fecha', label: 'Fecha', align: 'center' },
  { key: 'estado', label: 'Estado', align: 'right' },
];

const rows = [
  ['Renovar contrato proveedor A', '2025-01-10', 'Cerrada'],
  ['Inversión en marketing Q2', '2025-01-15', 'Abierta'],
];

export default function DecisionsList() {
  return (
    <section className="app-page">
      <PageHeader
        title="Decisiones"
        subtitle="Registro y seguimiento de decisiones empresariales"
        actions={
          <>
            <SearchInput placeholder="Buscar decisiones…" />
            <PrimaryButton label="Nueva decisión" />
          </>
        }
      />

      <DataTable
        columns={columns}
        rows={rows.map((item, index) => ({
          id: index,
          cells: [
            item[0],
            item[1],
            <StatusBadge key="estado" label={item[2]} tone={item[2] === 'Cerrada' ? 'muted' : 'accent'} />,
          ],
        }))}
      />
    </section>
  );
}
