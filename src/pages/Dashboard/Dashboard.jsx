import PageHeader from '../../components/app/PageHeader.jsx';
import StatusBadge from '../../components/app/StatusBadge.jsx';
import './dashboard.scss';

const kpis = [
  { label: 'Ventas del periodo', value: '€5,340', meta: 'últimos 30 días', delta: '+12.5%' },
  { label: 'Gastos del periodo', value: '€329', meta: 'últimos 30 días', delta: '+8.2%' },
  { label: 'Margen estimado', value: '€5,011', meta: 'últimos 30 días', delta: '+18.4%' },
];

const latestInvoices = [
  { id: 'F-2025-0042', client: 'Acme Corp', amount: '€3,450', status: 'Emitida' },
  { id: 'F-2025-0041', client: 'Tech Solutions', amount: '€1,890', status: 'Emitida' },
  { id: 'F-2025-0045', client: 'Acme Corp', amount: '€2,500', status: 'Borrador' },
];

const latestExpenses = [
  { label: 'Suministros oficina', amount: '€240', status: 'Pendiente' },
  { label: 'Hosting mensual', amount: '€89', status: 'Pagado' },
  { label: 'Servicios legales', amount: '€320', status: 'Pendiente' },
];

const latestDecisions = [
  { code: 'DEC-01', title: 'Renovar contrato proveedor A', status: 'Cerrada' },
  { code: 'DEC-02', title: 'Inversión en marketing Q2', status: 'Abierta' },
  { code: 'DEC-03', title: 'Migración de infraestructura', status: 'En evaluación' },
];

export default function Dashboard() {
  return (
    <section className="app-page dashboard-page">
      <PageHeader title="Inicio" subtitle="Resumen general del negocio" />

      <div className="kpi-grid">
        {kpis.map((item) => (
          <article className="kpi-card" key={item.label}>
            <p className="kpi-card__label">{item.label}</p>
            <p className="kpi-card__value">{item.value}</p>
            <p className="kpi-card__meta">
              <span>{item.meta}</span>
              <span className="kpi-card__delta">{item.delta}</span>
            </p>
          </article>
        ))}
      </div>

      <div className="dashboard-page__chart app-surface">
        <div className="dashboard-page__chart-header">
          <h2>Ventas vs Gastos</h2>
          <p className="dashboard-page__muted">Comparativa simple</p>
        </div>
        <div className="chart-placeholder">Gráfico de barras</div>
      </div>

      <div className="card-grid dashboard-page__lists">
        <article className="list-card">
          <h3 className="list-card__title">Últimas facturas</h3>
          {latestInvoices.map((invoice) => (
            <div className="list-card__item" key={invoice.id}>
              <div className="list-card__meta">
                <p className="list-card__label">{invoice.id}</p>
                <p className="list-card__value">
                  {invoice.client} · {invoice.amount}
                </p>
              </div>
              <StatusBadge label={invoice.status} tone={invoice.status === 'Borrador' ? 'muted' : 'accent'} />
            </div>
          ))}
        </article>

        <article className="list-card">
          <h3 className="list-card__title">Últimos gastos</h3>
          {latestExpenses.map((expense) => (
            <div className="list-card__item" key={expense.label}>
              <div className="list-card__meta">
                <p className="list-card__label">{expense.status}</p>
                <p className="list-card__value">{expense.label}</p>
              </div>
              <span className="list-card__value">{expense.amount}</span>
            </div>
          ))}
        </article>

        <article className="list-card">
          <h3 className="list-card__title">Últimas decisiones</h3>
          {latestDecisions.map((decision) => (
            <div className="list-card__item" key={decision.code}>
              <div className="list-card__meta">
                <p className="list-card__label">{decision.code}</p>
                <p className="list-card__value">{decision.title}</p>
              </div>
              <StatusBadge label={decision.status} tone={decision.status === 'Cerrada' ? 'muted' : 'accent'} />
            </div>
          ))}
        </article>
      </div>
    </section>
  );
}
