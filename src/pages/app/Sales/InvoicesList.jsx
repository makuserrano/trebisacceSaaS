import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DataTable from "../../../components/app/DataTable.jsx";
import InlineSelect from "../../../components/app/InlineSelect.jsx";
import PageHeader from "../../../components/app/PageHeader.jsx";
import PrimaryButton from "../../../components/app/PrimaryButton.jsx";
import {
  createInvoice,
  getInvoices,
  updateInvoice,
} from "../../../services/invoices.service.js";
import "./sales.scss";

const columns = [
  { key: "numero", label: "Número" },
  { key: "cliente", label: "Cliente" },
  { key: "total", label: "Total", align: "center" },
  { key: "estado", label: "Estado", align: "center" },
  { key: "fecha", label: "Fecha", align: "right" },
];

const statusLabel = {
  draft: "Borrador",
  issued: "Emitida",
  paid: "Cobrada",
};

const statusOptions = [
  { value: "draft", label: "Borrador" },
  { value: "issued", label: "Emitida" },
  { value: "paid", label: "Cobrada" },
];

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function InvoicesList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const statusMenuRef = useRef(null);
  const statusTriggerRef = useRef(null);
  const [statusMenuPosition, setStatusMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 160,
  });
  const [formData, setFormData] = useState({
    number: "",
    clientName: "",
    date: "",
    total: "",
    status: "draft",
  });

  const fetchInvoices = () => {
    setLoading(true);
    setError(null);
    getInvoices()
      .then((data) => {
        setInvoices(data);
      })
      .catch((err) => {
        setError(err?.message || "Error al cargar facturas");
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    const t = setTimeout(() => fetchInvoices(), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!openStatusId) return;
    const handleOutsideClick = (event) => {
      const menu = statusMenuRef.current;
      const trigger = statusTriggerRef.current;
      if (menu && menu.contains(event.target)) return;
      if (trigger && trigger.contains(event.target)) return;
      setOpenStatusId(null);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenStatusId(null);
      }
    };
    const handleScroll = () => {
      setOpenStatusId(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openStatusId]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSaving) {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSaving]);

  const handleStatusToggle = (invoiceId, event) => {
    if (openStatusId === invoiceId) {
      setOpenStatusId(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    statusTriggerRef.current = event.currentTarget;
    setStatusMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
    setOpenStatusId(invoiceId);
  };

  const handleStatusSelect = (invoice, nextStatus) => {
    updateInvoice(invoice.id, { status: nextStatus })
      .then((updated) => {
        setInvoices((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      })
      .catch((err) => {
        setError(err?.message || "Error al actualizar factura");
      })
      .finally(() => {
        setOpenStatusId(null);
      });
  };

  const handleOpenModal = () => {
    setError(null);
    setFormData({
      number: "",
      clientName: "",
      date: "",
      total: "",
      status: "draft",
    });
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
    const totalValue = Number(formData.total);
    if (
      !formData.number ||
      !formData.clientName ||
      !formData.date ||
      formData.total === "" ||
      Number.isNaN(totalValue)
    ) {
      setError("Completá número, cliente, fecha y total.");
      return;
    }
    setIsSaving(true);
    setError(null);
    createInvoice({
      number: formData.number,
      clientName: formData.clientName,
      date: formData.date,
      status: formData.status,
      total: totalValue,
    })
      .then((created) => {
        setInvoices((prev) => [created, ...prev]);
        setIsModalOpen(false);
      })
      .catch((err) => {
        setError(err?.message || "Error al guardar factura");
      })
      .finally(() => setIsSaving(false));
  };

  const rows = invoices.map((invoice) => ({
    id: invoice.id,
    cells: [
      invoice.number,
      invoice.clientName,
      currencyFormatter.format(invoice.total),
      <div key="estado" className="sales__status-cell">
        <button
          type="button"
          className="sales__inline-action sales__status-trigger"
          onClick={(event) => handleStatusToggle(invoice.id, event)}
          aria-haspopup="menu"
          aria-expanded={openStatusId === invoice.id}
          aria-label={`Cambiar estado de ${invoice.number}`}
        >
          <span className="sales__status-trigger-content">
            <InlineSelect label={statusLabel[invoice.status] ?? invoice.status} />
          </span>
        </button>
      </div>,
      invoice.date,
    ],
  }));

  const showEmpty = !loading && !error && invoices.length === 0;
  const showTable = !loading && !error && invoices.length > 0;

  return (
    <section className="app-page sales-page--invoices">
      <PageHeader
        title="Facturas"
        subtitle="Gestión de facturas"
        actions={
          <PrimaryButton label="Nueva factura" onClick={handleOpenModal} />
        }
      />

      {loading && <p>Cargando...</p>}
      {error && (
        <div>
          <p>{error}</p>
          <PrimaryButton label="Reintentar" onClick={fetchInvoices} />
        </div>
      )}
      {showEmpty && (
        <div>
          <p>Todavía no hay facturas.</p>
          <PrimaryButton label="Nueva factura" onClick={handleOpenModal} />
        </div>
      )}

      {showTable && <DataTable columns={columns} rows={rows} />}
      {(() => {
        const openInvoice = invoices.find((invoice) => invoice.id === openStatusId);
        if (!openInvoice) return null;
        return createPortal(
          <div
            ref={statusMenuRef}
            className="sales__status-menu sales__status-menu--floating"
            role="menu"
            style={{
              top: `${statusMenuPosition.top}px`,
              left: `${statusMenuPosition.left}px`,
              width: `${statusMenuPosition.width}px`,
            }}
          >
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className="sales__status-option"
                role="menuitem"
                onClick={() => handleStatusSelect(openInvoice, option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>,
          document.body
        );
      })()}

      {isModalOpen && (
        <div
          className="sales__modal-backdrop"
          role="dialog"
          aria-modal="true"
          onMouseDown={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div
            className="sales__modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="sales__modal-title">Nueva factura</h2>
            <form className="sales__modal-form" onSubmit={handleSubmit}>
              <label className="sales__modal-field">
                <span>Número</span>
                <input
                  type="text"
                  name="number"
                  value={formData.number}
                  onChange={handleFieldChange}
                  placeholder="Ej: F-2025-0047"
                />
              </label>
              <label className="sales__modal-field">
                <span>Cliente</span>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleFieldChange}
                  placeholder="Ej: Acme Corp"
                />
              </label>
              <label className="sales__modal-field">
                <span>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFieldChange}
                />
              </label>
              <label className="sales__modal-field">
                <span>Total</span>
                <input
                  type="number"
                  name="total"
                  value={formData.total}
                  onChange={handleFieldChange}
                  min="0"
                  step="1"
                  placeholder="Ej: 125000"
                />
              </label>
              <label className="sales__modal-field">
                <span>Estado</span>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFieldChange}
                >
                  <option value="draft">Borrador</option>
                  <option value="issued">Emitida</option>
                  <option value="paid">Cobrada</option>
                </select>
              </label>
              <div className="sales__modal-actions">
                <button
                  type="button"
                  className="sales__modal-cancel"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <PrimaryButton
                  type="submit"
                  label={isSaving ? "Guardando..." : "Guardar"}
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
