import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as XLSX from "xlsx";
import DataTable from "../../../components/app/DataTable.jsx";
import InlineSelect from "../../../components/app/InlineSelect.jsx";
import PageHeader from "../../../components/app/PageHeader.jsx";
import PrimaryButton from "../../../components/app/PrimaryButton.jsx";
import {
  createInvoice,
  deleteInvoice,
  getInvoices,
  updateInvoice,
} from "../../../services/invoices.service.js";
import "./sales.scss";

const baseColumns = [
  { key: "numero", label: "Número", sortable: true },
  { key: "cliente", label: "Cliente", sortable: true },
  { key: "total", label: "Total", align: "center", sortable: true },
  { key: "estado", label: "Estado", align: "center", sortable: true },
  { key: "fecha", label: "Fecha", align: "right", sortable: true },
  { key: "acciones", label: "Acciones", align: "right", sortable: false },
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
  const [isImporting, setIsImporting] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [openStatusId, setOpenStatusId] = useState(null);
  const statusMenuRef = useRef(null);
  const statusTriggerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [importFeedback, setImportFeedback] = useState(null);
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

  const handleSortClick = (key) => {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  };

  const handleDeleteInvoice = (invoice) => {
    const ok = window.confirm(
      `¿Eliminar la factura ${invoice.number}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    deleteInvoice(invoice.id)
      .then(() => {
        setInvoices((prev) => prev.filter((item) => item.id !== invoice.id));
      })
      .catch((err) => {
        setError(err?.message || "Error al eliminar factura");
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

  const normalizeHeader = (value) => {
    if (value === null || value === undefined) return "";
    return value
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  };

  const findColumnIndex = (headers, names) => {
    const normalizedNames = names.map(normalizeHeader);
    return headers.findIndex((header) => normalizedNames.includes(header));
  };

  const formatDateValue = (value) => {
    if (!value && value !== 0) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed?.y && parsed?.m && parsed?.d) {
        const date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
        return date.toISOString().slice(0, 10);
      }
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
      const slashMatch = trimmed.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);
      if (slashMatch) {
        const day = Number(slashMatch[1]);
        const month = Number(slashMatch[2]);
        let year = Number(slashMatch[3]);
        if (year < 100) year += 2000;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year.toString().padStart(4, "0")}-${month
            .toString()
            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        }
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
    return "";
  };

  const normalizeTotalValue = (value) => {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      let cleaned = value.trim();
      if (!cleaned) return Number.NaN;
      cleaned = cleaned.replace(/[^\d,.-]/g, "");
      if (!cleaned) return Number.NaN;
      const hasComma = cleaned.includes(",");
      const hasDot = cleaned.includes(".");
      if (hasComma && hasDot) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else if (hasComma) {
        cleaned = cleaned.replace(",", ".");
      }
      return Number(cleaned);
    }
    return Number.NaN;
  };

  const normalizeStatusValue = (value) => {
    if (value === null || value === undefined) return "draft";
    const raw = value.toString().trim().toLowerCase();
    if (!raw) return "draft";
    if (["draft", "issued", "paid"].includes(raw)) return raw;
    if (raw.includes("borrador")) return "draft";
    if (raw.includes("emitida")) return "issued";
    if (raw.includes("cobrada") || raw.includes("pagada")) return "paid";
    return "draft";
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    if (!invoices.length) return;
    const data = invoices.map((invoice) => ({
      "Número": invoice.number,
      Cliente: invoice.clientName,
      Fecha: invoice.date,
      Total: invoice.total,
      Estado: statusLabel[invoice.status] ?? invoice.status,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");
    XLSX.writeFile(workbook, "facturas.xlsx");
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setIsImporting(true);
    setImportFeedback(null);
    setError(null);

    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
        if (isCsv) {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      });

      const workbook = XLSX.read(data, {
        type: isCsv ? "string" : "array",
        cellDates: true,
        raw: true,
      });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        throw new Error("No se encontró una hoja para importar.");
      }
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      if (!rows.length) {
        throw new Error("El archivo no tiene filas.");
      }

      const headers = rows[0].map((header) => normalizeHeader(header));
      const columnIndex = {
        number: findColumnIndex(headers, ["Número", "Nro", "Factura", "Number"]),
        clientName: findColumnIndex(headers, ["Cliente", "Client"]),
        date: findColumnIndex(headers, ["Fecha", "Date"]),
        total: findColumnIndex(headers, ["Total", "Importe", "Amount"]),
        status: findColumnIndex(headers, ["Estado", "Status"]),
      };

      let imported = 0;
      let skipped = 0;
      const errors = [];

      for (let i = 1; i < rows.length; i += 1) {
        const row = rows[i] || [];
        const isRowEmpty = row.every(
          (cell) => cell === null || cell === undefined || cell === ""
        );
        if (isRowEmpty) continue;

        const rowNumber = i + 1;
        const numberValue =
          columnIndex.number >= 0 ? row[columnIndex.number] : "";
        const clientValue =
          columnIndex.clientName >= 0 ? row[columnIndex.clientName] : "";
        const dateValue = columnIndex.date >= 0 ? row[columnIndex.date] : "";
        const totalValue = columnIndex.total >= 0 ? row[columnIndex.total] : "";
        const statusValue =
          columnIndex.status >= 0 ? row[columnIndex.status] : "";

        const normalizedNumber = numberValue?.toString().trim();
        const normalizedClient = clientValue?.toString().trim();
        const normalizedDate = formatDateValue(dateValue);
        const normalizedTotal = normalizeTotalValue(totalValue);
        const normalizedStatus = normalizeStatusValue(statusValue);

        const rowErrors = [];
        if (!normalizedNumber) rowErrors.push("falta Número");
        if (!normalizedClient) rowErrors.push("falta Cliente");
        if (!normalizedDate) rowErrors.push("falta Fecha");
        if (Number.isNaN(normalizedTotal) || normalizedTotal < 0) {
          rowErrors.push("Total inválido");
        }

        if (rowErrors.length > 0) {
          skipped += 1;
          if (errors.length < 5) {
            errors.push(`Fila ${rowNumber}: ${rowErrors.join(", ")}`);
          }
          continue;
        }

        try {
          await createInvoice({
            number: normalizedNumber,
            clientName: normalizedClient,
            date: normalizedDate,
            total: normalizedTotal,
            status: normalizedStatus,
          });
          imported += 1;
        } catch (err) {
          skipped += 1;
          if (errors.length < 5) {
            errors.push(
              `Fila ${rowNumber}: ${err?.message || "Error al guardar"}`
            );
          }
        }
      }

      setImportFeedback({ imported, skipped, errors });
      fetchInvoices();
    } catch (err) {
      setImportFeedback({
        imported: 0,
        skipped: 0,
        errors: [err?.message || "No se pudo procesar el archivo."],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!sortConfig) return invoices;
    const sorted = [...invoices];
    const multiplier = sortConfig.direction === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const key = sortConfig.key;
      if (key === "numero") {
        return (
          (a.number || "").localeCompare(b.number || "", "es", {
            sensitivity: "base",
          }) * multiplier
        );
      }
      if (key === "cliente") {
        return (
          (a.clientName || "").localeCompare(b.clientName || "", "es", {
            sensitivity: "base",
          }) * multiplier
        );
      }
      if (key === "total") {
        const aValue = Number(a.total) || 0;
        const bValue = Number(b.total) || 0;
        return (aValue - bValue) * multiplier;
      }
      if (key === "estado") {
        return (
          (a.status || "").localeCompare(b.status || "", "es", {
            sensitivity: "base",
          }) * multiplier
        );
      }
      if (key === "fecha") {
        const aTime = Date.parse(a.date || "") || 0;
        const bTime = Date.parse(b.date || "") || 0;
        return (aTime - bTime) * multiplier;
      }
      return 0;
    });
    return sorted;
  }, [invoices, sortConfig]);

  const columns = useMemo(() => {
    return baseColumns.map((col) => {
      if (!col.sortable) return col;
      const isActive = sortConfig?.key === col.key;
      const direction = isActive ? sortConfig.direction : null;
      return {
        ...col,
        label: (
          <button
            type="button"
            className={`sales__sort-button ${isActive ? "is-active" : ""}`}
            onClick={() => handleSortClick(col.key)}
          >
            <span>{col.label}</span>
            {direction && (
              <span className="sales__sort-indicator">
                {direction === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        ),
      };
    });
  }, [sortConfig]);

  const rows = sortedInvoices.map((invoice) => ({
    id: invoice.id,
    cells: [
      invoice.number,
      invoice.clientName,
      currencyFormatter.format(invoice.total),
      <div key="estado" className="sales__status-cell">
        <button
          type="button"
          className={`sales__inline-action sales__status-trigger sales__status--${invoice.status}`}
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
      <div key="acciones" className="sales__action-cell">
        <button
          type="button"
          className="sales__inline-action sales__delete-button"
          onClick={() => handleDeleteInvoice(invoice)}
        >
          Eliminar
        </button>
      </div>,
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
          <div className="sales__header-actions">
            <button
              type="button"
              className="sales__import-button"
              onClick={handleImportClick}
              disabled={isImporting}
            >
              {isImporting ? "Importando..." : "Importar Excel"}
            </button>
            <button
              type="button"
              className="sales__import-button"
              onClick={handleExportClick}
              disabled={!invoices.length}
            >
              Exportar Excel
            </button>
            <PrimaryButton label="Nueva factura" onClick={handleOpenModal} />
          </div>
        }
      />
      <input
        ref={fileInputRef}
        className="sales__import-input"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleImportFile}
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

      {importFeedback && (
        <div className="sales__import-feedback">
          <div className="sales__import-feedback-main">
            <p>
              Importadas {importFeedback.imported}, omitidas{" "}
              {importFeedback.skipped}
            </p>
            {importFeedback.errors?.length > 0 && (
              <ul>
                {importFeedback.errors.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className="sales__import-feedback-clear"
            onClick={() => setImportFeedback(null)}
          >
            Limpiar
          </button>
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
