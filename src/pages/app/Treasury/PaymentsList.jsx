import { useEffect, useMemo, useState } from 'react';
import DataTable from '../../../components/app/DataTable.jsx';
import PageHeader from '../../../components/app/PageHeader.jsx';
import PrimaryButton from '../../../components/app/PrimaryButton.jsx';
import { getInvoices } from '../../../services/invoices.service.js';
import {
  createPayment,
  getPayments,
  getInvoicePaymentSummaries,
  removePayment,
  updatePayment,
} from '../../../services/payments.service.js';
import './treasury.scss';

const columns = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'factura', label: 'Factura' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'metodo', label: 'Método', align: 'center' },
  { key: 'importe', label: 'Importe', align: 'right' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
];

const methodLabel = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
  mercado_pago: 'Mercado Pago',
  other: 'Otro',
};

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PaymentsList() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [paymentSummaries, setPaymentSummaries] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    invoiceId: '',
    date: '',
    amount: '',
    method: 'cash',
    reference: '',
    notes: '',
  });

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([getPayments(), getInvoices()])
      .then(([paymentData, invoiceData]) => {
        setPayments(paymentData);
        setInvoices(invoiceData);
        return getInvoicePaymentSummaries(invoiceData.map((invoice) => invoice.id));
      })
      .then((summaries) => {
        setPaymentSummaries(summaries);
      })
      .catch((err) => {
        setError(err?.message || 'Error al cargar pagos');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchAll(), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isSaving) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, isSaving]);

  const invoiceMap = useMemo(() => {
    return invoices.reduce((acc, invoice) => {
      acc[invoice.id] = invoice;
      return acc;
    }, {});
  }, [invoices]);

  const payableInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoice.status === 'draft') return false;
      const summary = paymentSummaries[invoice.id];
      if (!summary) return true;
      return summary.balance > 0;
    });
  }, [invoices, paymentSummaries]);

  const kpis = useMemo(() => {
    const today = getLocalDateString();
    const currentMonth = today.slice(0, 7);
    const monthTotal = payments.reduce((acc, payment) => {
      if ((payment.date || '').startsWith(currentMonth)) {
        return acc + (Number(payment.amount) || 0);
      }
      return acc;
    }, 0);

    const todayTotal = payments.reduce((acc, payment) => {
      if (payment.date === today) {
        return acc + (Number(payment.amount) || 0);
      }
      return acc;
    }, 0);

    const pendingTotal = invoices.reduce((acc, invoice) => {
      if (invoice.status !== 'issued') return acc;
      const summary = paymentSummaries[invoice.id];
      if (!summary) return acc + (Number(invoice.total) || 0);
      return acc + (summary.balance || 0);
    }, 0);

    return [
      {
        label: 'Cobrado en el mes',
        value: currencyFormatter.format(monthTotal),
        meta: 'suma de pagos del mes',
      },
      {
        label: 'Cobrado hoy',
        value: currencyFormatter.format(todayTotal),
        meta: 'pagos del día',
      },
      {
        label: 'Pendiente de cobro',
        value: currencyFormatter.format(pendingTotal),
        meta: 'saldo de facturas emitidas',
      },
    ];
  }, [payments, invoices, paymentSummaries]);

  const handleOpenModal = (payment = null) => {
    setError(null);
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        invoiceId: payment.invoiceId || '',
        date: payment.date || '',
        amount: payment.amount?.toString() || '',
        method: payment.method || 'cash',
        reference: payment.reference || '',
        notes: payment.notes || '',
      });
    } else {
      setEditingPayment(null);
      setFormData({
        invoiceId: '',
        date: '',
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amountValue = Number(formData.amount);
    if (!formData.invoiceId || !formData.date) {
      setError('Selecciona una factura y fecha válida.');
      return;
    }
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError('El monto debe ser mayor a 0.');
      return;
    }
    setIsSaving(true);
    setError(null);
    const payload = {
      invoiceId: formData.invoiceId,
      date: formData.date,
      amount: amountValue,
      method: formData.method,
      reference: formData.reference.trim(),
      notes: formData.notes.trim(),
    };

    const request = editingPayment
      ? updatePayment(editingPayment.id, payload)
      : createPayment(payload);

    request
      .then(() => {
        setIsModalOpen(false);
        setEditingPayment(null);
        fetchAll();
      })
      .catch((err) => {
        setError(err?.message || 'Error al guardar pago');
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeletePayment = (payment) => {
    const ok = window.confirm(
      `¿Eliminar el pago ${payment.id}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    removePayment(payment.id)
      .then(() => {
        fetchAll();
      })
      .catch((err) => {
        setError(err?.message || 'Error al eliminar pago');
      });
  };

  const rows = payments.map((payment) => {
    const invoice = invoiceMap[payment.invoiceId];
    return {
      id: payment.id,
      cells: [
        payment.date,
        invoice?.number || payment.invoiceId,
        invoice?.clientName || '—',
        methodLabel[payment.method] || payment.method,
        currencyFormatter.format(payment.amount),
        <div key="acciones" className="treasury__action-cell">
          <button
            type="button"
            className="treasury__inline-action"
            onClick={() => handleOpenModal(payment)}
          >
            Editar
          </button>
          <button
            type="button"
            className="treasury__inline-action treasury__delete-button"
            onClick={() => handleDeletePayment(payment)}
          >
            Eliminar
          </button>
        </div>,
      ],
    };
  });

  const showEmpty = !loading && !error && payments.length === 0;

  return (
    <section className="app-page treasury-page--payments">
      <PageHeader
        title="Pagos"
        subtitle="Cobros y conciliación de facturas"
        actions={<PrimaryButton label="Registrar pago" onClick={() => handleOpenModal()} />}
      />

      <div className="kpi-grid">
        {kpis.map((item) => (
          <article className="kpi-card" key={item.label}>
            <p className="kpi-card__label">{item.label}</p>
            <p className="kpi-card__value">{item.value}</p>
            <p className="kpi-card__meta">{item.meta}</p>
          </article>
        ))}
      </div>

      {loading && <p>Cargando...</p>}
      {error && (
        <div>
          <p>{error}</p>
          <PrimaryButton label="Reintentar" onClick={fetchAll} />
        </div>
      )}
      {showEmpty && (
        <div>
          <p>Todavía no hay pagos.</p>
          <PrimaryButton label="Registrar pago" onClick={() => handleOpenModal()} />
        </div>
      )}

      {!loading && !error && payments.length > 0 && (
        <DataTable columns={columns} rows={rows} />
      )}

      {isModalOpen && (
        <div
          className="treasury__modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div
            className="treasury__modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="treasury__modal-title">
              {editingPayment ? 'Editar pago' : 'Registrar pago'}
            </h2>
            <form className="treasury__modal-form" onSubmit={handleSubmit}>
              <label className="treasury__modal-field">
                <span>Factura</span>
                <select
                  name="invoiceId"
                  value={formData.invoiceId}
                  onChange={handleFieldChange}
                >
                  <option value="">Seleccionar factura</option>
                  {payableInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.number} · {invoice.clientName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="treasury__modal-field">
                <span>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="treasury__modal-field">
                <span>Monto</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFieldChange}
                  min="0"
                  step="1"
                  placeholder="Ej: 125000"
                />
              </label>
              <label className="treasury__modal-field">
                <span>Método</span>
                <select
                  name="method"
                  value={formData.method}
                  onChange={handleFieldChange}
                >
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                  <option value="card">Tarjeta</option>
                  <option value="mercado_pago">Mercado Pago</option>
                  <option value="other">Otro</option>
                </select>
              </label>
              <label className="treasury__modal-field">
                <span>Referencia</span>
                <input
                  type="text"
                  name="reference"
                  value={formData.reference}
                  onChange={handleFieldChange}
                  placeholder="Ej: TRX-2025-01"
                />
              </label>
              <label className="treasury__modal-field">
                <span>Notas</span>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleFieldChange}
                  rows="3"
                  placeholder="Opcional"
                />
              </label>
              <div className="treasury__modal-actions">
                <button
                  type="button"
                  className="treasury__modal-cancel"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <PrimaryButton
                  type="submit"
                  label={isSaving ? 'Guardando...' : 'Guardar'}
                  disabled={isSaving}
                />
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
