import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
const axisFormatter = new Intl.NumberFormat('es-AR', {
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
const methodLabel = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  mercado_pago: 'Mercado Pago',
  other: 'Otro',
};

const methodLabelShort = {
  cash: 'Efectivo',
  transfer: 'Transf.',
  card: 'Tarjeta',
  mercado_pago: 'MP',
  other: 'Otro',
};

export default function TreasuryOverview() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const navigate = useNavigate();

  const range = useMemo(() => getDateRange(30), []);

  const fetchOverview = useCallback(() => {
    setLoading(true);
    setError(null);
    getTreasuryOverview(range)
      .then((data) => setOverview(data))
      .catch((err) => setError(err?.message || 'No se pudo cargar tesorería.'))
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

  const paymentsByMethod = useMemo(() => {
    if (!overview) return [];
    return overview.paymentsByMethod.map((item) => ({
      ...item,
      label: methodLabel[item.method] || item.method,
      labelShort: methodLabelShort[item.method] || item.method,
    }));
  }, [overview]);

  const kpis = overview?.kpis;
  const hasAccounts = overview?.accounts?.length > 0;
  const hasMovements =
    overview &&
    (overview.dailyNet.length > 0 ||
      overview.expenseByCategory.length > 0 ||
      incomeByAccount.length > 0);
  const showOnboarding = overview && (!hasAccounts || !hasMovements);
  const dailyNetTicks = useMemo(() => {
    if (!overview?.dailyNet?.length) return undefined;
    const values = overview.dailyNet.map((item) => Number(item.net) || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max === 0 && min === 0) return [0];
    return undefined;
  }, [overview]);
  const incomeAccountTicks = useMemo(() => {
    if (!incomeByAccount.length) return undefined;
    const values = incomeByAccount.map((item) => Number(item.value) || 0);
    const max = Math.max(...values);
    const min = Math.min(...values);
    if (max === 0 && min === 0) return [0];
    return undefined;
  }, [incomeByAccount]);

  const formatDateShort = (value) => {
    if (typeof value !== 'string') return value;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}`;
  };

  const formatDateLong = (value) => {
    if (typeof value !== 'string') return value;
    const [year, month, day] = value.split('-');
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const truncateLabel = (value, max = 12) => {
    if (typeof value !== 'string') return value;
    if (value.length <= max) return value;
    return `${value.slice(0, max).trim()}…`;
  };

  const formatCompactARS = (value) => {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return value;
    const absValue = Math.abs(numberValue);
    if (absValue < 1000) return axisFormatter.format(numberValue);
    if (absValue < 1_000_000) {
      const compact = numberValue / 1000;
      return `${axisFormatter.format(compact)}k`;
    }
    const compact = numberValue / 1_000_000;
    const decimals = absValue < 10_000_000 ? 1 : 0;
    return `${compact.toFixed(decimals).replace('.', ',')}M`;
  };

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

          {showOnboarding && (
            <div className="treasury__onboarding">
              <div>
                <h3 className="treasury__onboarding-title">Empezá a cargar datos</h3>
                <p className="treasury__onboarding-copy">
                  Para ver el resumen de tesorería necesitás cuentas y movimientos
                  registrados.
                </p>
              </div>
              <div className="treasury__onboarding-actions">
                <button
                  type="button"
                  className="treasury__cta"
                  onClick={() => navigate('/app/tesoreria/cuentas')}
                >
                  Crear cuenta
                </button>
                <button
                  type="button"
                  className="treasury__cta"
                  onClick={() => navigate('/app/tesoreria/movimientos')}
                >
                  Registrar movimiento
                </button>
                <button
                  type="button"
                  className="treasury__cta"
                  onClick={() => navigate('/app/tesoreria/pagos')}
                >
                  Registrar cobro
                </button>
              </div>
            </div>
          )}

          <div className="treasury__charts">
            <div className="treasury__chart-card">
              <h3 className="treasury__chart-title">Neto diario</h3>
              {overview.dailyNet.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart
                    data={overview.dailyNet}
                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      tickFormatter={formatDateShort}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      tickFormatter={formatCompactARS}
                      allowDecimals={false}
                      ticks={dailyNetTicks}
                    />
                    <Tooltip
                      formatter={(value) => currencyFormatter.format(value)}
                      labelFormatter={(label) => `Fecha ${formatDateLong(label)}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#eb5e28"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: '#eb5e28' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="treasury__empty">Sin datos</p>
              )}
            </div>

            <div className="treasury__chart-card">
              <h3 className="treasury__chart-title">Egresos por categoría</h3>
              {overview.expenseByCategory.length > 0 ? (
                <>
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
                          <Cell
                            key={entry.name}
                            fill={chartColors[index % chartColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [
                          currencyFormatter.format(value),
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="treasury__legend">
                    {overview.expenseByCategory.map((entry, index) => (
                      <div className="treasury__legend-item" key={entry.name}>
                        <span
                          className="treasury__legend-swatch"
                          style={{ background: chartColors[index % chartColors.length] }}
                        />
                        <span className="treasury__legend-label">{entry.name}</span>
                        <span className="treasury__legend-value">
                          {currencyFormatter.format(entry.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="treasury__empty">Sin datos</p>
              )}
            </div>

            <div className="treasury__chart-card">
              <h3 className="treasury__chart-title">Ingresos por cuenta</h3>
              {incomeByAccount.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={incomeByAccount}
                    margin={{ top: 8, right: 16, left: 0, bottom: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      tickFormatter={(value) => truncateLabel(value)}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      tickFormatter={formatCompactARS}
                      allowDecimals={false}
                      ticks={incomeAccountTicks}
                    />
                    <Tooltip
                      formatter={(value) => currencyFormatter.format(value)}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="value" fill="#4d9de0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="treasury__empty">Sin datos</p>
              )}
            </div>

            <div className="treasury__chart-card">
              <h3 className="treasury__chart-title">Ingresos por método</h3>
              {paymentsByMethod.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={paymentsByMethod}
                    margin={{ top: 8, right: 16, left: 0, bottom: 28 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="labelShort"
                      tick={{ fill: 'rgba(255,255,255,0.6)' }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.6)' }} />
                    <Tooltip
                      formatter={(value) => currencyFormatter.format(value)}
                      labelFormatter={(label, payload) =>
                        payload?.[0]?.payload?.label || label
                      }
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {paymentsByMethod.map((entry, index) => (
                        <Cell
                          key={`${entry.method}-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="treasury__empty">Sin datos</p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
