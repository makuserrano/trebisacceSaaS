import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../../components/app/PageHeader.jsx';
import StatusBadge from '../../../components/app/StatusBadge.jsx';
import { getInvoices } from '../../../services/invoices.service.js';
import { getQuotes } from '../../../services/quotes.service.js';
import './sales.scss';

const invoiceStatusLabel = {
  draft: 'Borrador',
  issued: 'Emitida',
  paid: 'Cobrada',
};

const quoteStatusLabel = {
  draft: 'Borrador',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function SalesOverview() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOverview = () => {
    setLoading(true);
    setError(null);
    Promise.all([getInvoices(), getQuotes()])
      .then(([invoiceData, quoteData]) => {
        setInvoices(invoiceData);
        setQuotes(quoteData);
      })
      .catch((err) => {
        setError(err?.message || 'No se pudo cargar ventas.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchOverview(), 0);
    return () => clearTimeout(timer);
  }, []);

  const kpis = useMemo(() => {
    const totalInvoiced = invoices.reduce(
      (acc, invoice) => acc + (Number(invoice.total) || 0),
      0,
    );
    const pendingInvoices = invoices.filter((invoice) => invoice.status !== 'paid')
      .length;
    const openQuotes = quotes.filter((quote) =>
      ['draft', 'sent'].includes(quote.status),
    ).length;

    return [
      {
        label: 'Facturación acumulada',
        value: currencyFormatter.format(totalInvoiced),
        meta: 'suma total registrada',
        delta: `${invoices.length} facturas`,
      },
      {
        label: 'Facturas pendientes',
        value: pendingInvoices.toString(),
        meta: 'por cobrar',
        delta: `${pendingInvoices} activas`,
      },
      {
        label: 'Presupuestos abiertos',
        value: openQuotes.toString(),
        meta: 'en seguimiento',
        delta: `${quotes.length} totales`,
      },
    ];
  }, [invoices, quotes]);

  const latestInvoices = useMemo(() => {
    return [...invoices]
      .sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
      })
      .slice(0, 3);
  }, [invoices]);

  const latestQuotes = useMemo(() => {
    return [...quotes]
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3);
  }, [quotes]);

  return (
    <section className="app-page sales-overview">
      <PageHeader
        title="Ventas"
        subtitle="Resumen de actividad comercial"
        actions={
          <div className="sales-overview__actions">
            <button
              type="button"
              className="sales-overview__cta"
              onClick={() => navigate('/app/ventas/facturas')}
            >
              Ver facturas
            </button>
            <button
              type="button"
              className="sales-overview__cta sales-overview__cta--secondary"
              onClick={() => navigate('/app/ventas/presupuestos')}
            >
              Ver presupuestos
            </button>
          </div>
        }
      />

      {loading && <p>Cargando...</p>}
      {error && (
        <div className="sales-overview__state">
          <p>{error}</p>
          <button type="button" className="sales-overview__cta" onClick={fetchOverview}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
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

          <div className="card-grid sales-overview__lists">
            <article className="list-card">
              <h3 className="list-card__title">Últimas facturas</h3>
              {latestInvoices.map((invoice) => (
                <div className="list-card__item" key={invoice.id}>
                  <div className="list-card__meta">
                    <p className="list-card__label">{invoice.number}</p>
                    <p className="list-card__value">
                      {invoice.clientName} · {currencyFormatter.format(invoice.total)}
                    </p>
                  </div>
                  <StatusBadge
                    label={invoiceStatusLabel[invoice.status] ?? invoice.status}
                    tone={invoice.status === 'draft' ? 'muted' : 'accent'}
                  />
                </div>
              ))}
              {latestInvoices.length === 0 && (
                <p className="sales-overview__empty">Todavía no hay facturas.</p>
              )}
            </article>

            <article className="list-card">
              <h3 className="list-card__title">Últimos presupuestos</h3>
              {latestQuotes.map((quote) => (
                <div className="list-card__item" key={quote.id}>
                  <div className="list-card__meta">
                    <p className="list-card__label">{quote.number}</p>
                    <p className="list-card__value">
                      {quote.clientName} · {currencyFormatter.format(quote.total)}
                    </p>
                  </div>
                  <StatusBadge
                    label={quoteStatusLabel[quote.status] ?? quote.status}
                    tone={quote.status === 'draft' ? 'muted' : 'accent'}
                  />
                </div>
              ))}
              {latestQuotes.length === 0 && (
                <p className="sales-overview__empty">Todavía no hay presupuestos.</p>
              )}
            </article>
          </div>
        </>
      )}
    </section>
  );
}
