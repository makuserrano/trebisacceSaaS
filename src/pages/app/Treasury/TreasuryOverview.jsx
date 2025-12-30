import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PageHeader from '../../../components/app/PageHeader.jsx';
import { getTreasuryOverview } from '../../../services/treasury.analytics.js';
import './treasury.scss';

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

const chartColors = ['#eb5e28', '#f4d35e', '#3ddc97', '#4d9de0', '#b8b8ff'];

export default function TreasuryOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);

  const range = useMemo(() => getDateRange(30), []);

  const fetchOverview = useCallback(() => {
    setLoading(true);
    setError(null);
    getTreasuryOverview(range)
      .then((data) => setOverview(data))
      .catch((err) => setError(err?.message || 'No se pudo cargar tesorer?a.'))
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOverview(), 0);
    return () => clearTimeout(timer);
  }, [fetchOverview]);

  useEffect(() => {
    const handler = () => fetchOverview();
    window.addEventListener('trebisacce:transactions-changed', handler);
    window.addEventListener('trebisacce:accounts-changed', handler);
    return () => {
      window.removeEventListener('trebisacce:transactions-changed', handler);
      window.removeEventListener('trebisacce:accounts-changed', handler);
    };
  }, [fetchOverview]);

  const incomeByAccount = useMemo(() => {
    if (!overview) return [];
    const accountMap = overview.accounts.reduce((acc, account) => {
      acc[account.id] = account.name;
      return acc;
    }, {});
    return overview.incomeByAccount.map((item) => ({
      name: accountMap[item.accountId] || 'Sin cuenta',
      value: item.value,
    }));
  }, [overview]);

  const kpis = overview?.kpis;
  const hasCharts =
    overview &&
    (overview.dailyNet.length > 0 ||
      overview.expenseByCategory.length > 0 ||
      incomeByAccount.length > 0 ||
      overview.paymentsByMethod.length > 0);

  return (
    <section className="app-page treasury-page--overview">
      <PageHeader
        title="Tesorería"
        subtitle="Resumen financiero de los últimos 30 días"
      />

      {loading && <p>Cargando...</p>}
      {error && (
        <div className="treasury__state">
          <p>{error}</p>
          <button type="button" className="treasury__cta" onClick={fetchOverview}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && overview && (
        <>
          <div className="kpi-grid">
            <article className="kpi-card">
              <p className="kpi-card__label">Saldo total</p>
              <p className="kpi-card__value">
                {currencyFormatter.format(kpis.totalBalance)}
              </p>
              <p className="kpi-card__meta">todas las cuentas</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-card__label">Ingresos 30 días</p>
              <p className="kpi-card__value">
                {currencyFormatter.format(kpis.income)}
              </p>
              <p className="kpi-card__meta">solo movimientos de caja</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-card__label">Egresos 30 días</p>
              <p className="kpi-card__value">
                {currencyFormatter.format(kpis.expense)}
              </p>
              <p className="kpi-card__meta">salidas registradas</p>
            </article>
            <article className="kpi-card">
              <p className="kpi-card__label">Neto 30 días</p>
              <p className="kpi-card__value">
                {currencyFormatter.format(kpis.net)}
              </p>
              <p className="kpi-card__meta">ingresos - egresos</p>
            </article>
          </div>

          {hasCharts ? (
            <div className="treasury__charts">
              <div className="treasury__chart-card">
                <h3 className="treasury__chart-title">Neto diario</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={overview.dailyNet}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <Tooltip
                      formatter={(value) => currencyFormatter.format(value)}
                      labelFormatter={(label) => `Fecha ${label}`}
                    />
                    <Line type="monotone" dataKey="net" stroke="#eb5e28" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="treasury__chart-card">
                <h3 className="treasury__chart-title">Egresos por categoría</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={overview.expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {overview.expenseByCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => currencyFormatter.format(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="treasury__chart-card">
                <h3 className="treasury__chart-title">Ingresos por cuenta</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={incomeByAccount}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <Tooltip formatter={(value) => currencyFormatter.format(value)} />
                    <Bar dataKey="value" fill="#4d9de0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="treasury__chart-card">
                <h3 className="treasury__chart-title">Ingresos por método</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={overview.paymentsByMethod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="method" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <Tooltip formatter={(value) => currencyFormatter.format(value)} />
                    <Bar dataKey="value" fill="#3ddc97" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="treasury__empty">Todavía no hay datos para gráficos.</p>
          )}
        </>
      )}
    </section>
  );
}
