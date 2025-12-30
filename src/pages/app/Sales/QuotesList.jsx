import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import DataTable from "../../../components/app/DataTable.jsx";
import PageHeader from "../../../components/app/PageHeader.jsx";
import PrimaryButton from "../../../components/app/PrimaryButton.jsx";
import StatusBadge from "../../../components/app/StatusBadge.jsx";
import { createInvoice } from "../../../services/invoices.service.js";
import {
  getClientById,
  getClients,
  getOrCreateClientByName,
} from "../../../services/clients.service.js";
import {
  createQuote,
  getQuotes,
  removeQuote,
  updateQuote,
} from "../../../services/quotes.service.js";
import "./sales.scss";

const columns = [
  { key: "id", label: "ID" },
  { key: "cliente", label: "Cliente" },
  { key: "total", label: "Total", align: "center" },
  { key: "estado", label: "Estado", align: "center" },
  { key: "fecha", label: "Fecha", align: "right" },
  { key: "acciones", label: "Acciones", align: "right" },
];

const statusLabel = {
  sent: "Enviado",
  converted: "Convertido",
};

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export default function QuotesList() {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalError, setModalError] = useState(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [convertingId, setConvertingId] = useState(null);
  const [importFeedback, setImportFeedback] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    clientId: "",
    date: "",
    total: "",
  });

  const fetchQuotes = () => {
    setLoading(true);
    setError(null);
    getQuotes()
      .then((data) => {
        setQuotes(data);
      })
      .catch((err) => {
        setError(err?.message || "Error al cargar presupuestos");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchQuotes(), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      getClients()
        .then((data) => setClients(data))
        .catch((err) => {
          setError(err?.message || "Error al cargar clientes");
        });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const handleOpenModal = () => {
    setError(null);
    setModalError(null);
    setSubmitAttempted(false);
    setFormData({
      clientId: "",
      date: "",
      total: "",
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
    if (modalError) setModalError(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const totalValue = Number(formData.total);
    setSubmitAttempted(true);
    if (!formData.clientId || !formData.date || formData.total === "") {
      setModalError("Completá cliente, fecha y total.");
      return;
    }
    if (Number.isNaN(totalValue) || totalValue < 0) {
      setModalError("El total ingresado no es válido.");
      return;
    }
    const selectedClient = clients.find((client) => client.id === formData.clientId);
    setIsSaving(true);
    setModalError(null);
    createQuote({
      clientId: formData.clientId,
      clientName: selectedClient?.name || undefined,
      date: formData.date,
      total: totalValue,
      status: "sent",
    })
      .then((created) => {
        setQuotes((prev) => [created, ...prev]);
        setIsModalOpen(false);
      })
      .catch((err) => {
        setModalError(err?.message || "Error al guardar presupuesto");
      })
      .finally(() => setIsSaving(false));
  };

  const handleConvertQuote = (quote) => {
    if (quote.status !== "sent") return;
    setError(null);
    setConvertingId(quote.id);
    createInvoice({
      number: `F-${Date.now()}`,
      clientName: quote.clientName,
      clientId: quote.clientId,
      total: quote.total,
      date: quote.date,
      status: "issued",
    })
      .then(() => updateQuote(quote.id, { status: "converted" }))
      .then((updated) => {
        setQuotes((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      })
      .catch((err) => {
        setError(err?.message || "Error al convertir presupuesto");
      })
      .finally(() => setConvertingId(null));
  };

  const handleDeleteQuote = (quote) => {
    const ok = window.confirm(
      `¿Eliminar el presupuesto ${quote.id}? Esta acción no se puede deshacer.`
    );
    if (!ok) return;
    removeQuote(quote.id)
      .then(() => {
        setQuotes((prev) => prev.filter((item) => item.id !== quote.id));
      })
      .catch((err) => {
        setError(err?.message || "Error al eliminar presupuesto");
      });
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
      const slashMatch = trimmed.match(/^\s*(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\s*$/);
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
    if (value === null || value === undefined) return "sent";
    const raw = value.toString().trim().toLowerCase();
    if (!raw) return "sent";
    if (raw === "sent" || raw.includes("enviado")) return "sent";
    if (raw === "converted" || raw.includes("convert") || raw.includes("acept")) {
      return "converted";
    }
    return "sent";
  };

  const handleImportClick = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    if (!quotes.length) return;
    const data = quotes.map((quote) => ({
      ID: quote.id,
      Cliente: quote.clientName,
      Total: quote.total,
      Estado: statusLabel[quote.status] ?? quote.status,
      Fecha: quote.date,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presupuestos");
    XLSX.writeFile(workbook, "presupuestos.xlsx");
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
        id: findColumnIndex(headers, ["ID", "Id", "Identificador"]),
        clientName: findColumnIndex(headers, ["Cliente", "Client"]),
        clientId: findColumnIndex(headers, [
          "Cliente ID",
          "ClienteId",
          "Client ID",
          "ClientId",
          "ID Cliente",
        ]),
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
        const idValue = columnIndex.id >= 0 ? row[columnIndex.id] : "";
        const clientValue =
          columnIndex.clientName >= 0 ? row[columnIndex.clientName] : "";
        const clientIdValue =
          columnIndex.clientId >= 0 ? row[columnIndex.clientId] : "";
        const dateValue = columnIndex.date >= 0 ? row[columnIndex.date] : "";
        const totalValue = columnIndex.total >= 0 ? row[columnIndex.total] : "";
        const statusValue =
          columnIndex.status >= 0 ? row[columnIndex.status] : "";

        const normalizedId = idValue?.toString().trim();
        const normalizedClient = clientValue?.toString().trim();
        const normalizedClientId = clientIdValue?.toString().trim();
        const normalizedDate = formatDateValue(dateValue);
        const normalizedTotal = normalizeTotalValue(totalValue);
        const normalizedStatus = normalizeStatusValue(statusValue);

        const rowErrors = [];
        if (!normalizedClient && !normalizedClientId) {
          rowErrors.push("falta Cliente");
        }
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
          let resolvedClientId = normalizedClientId;
          let resolvedClientName = normalizedClient;

          if (resolvedClientId && !resolvedClientName) {
            const client = getClientById(resolvedClientId);
            if (client?.name) {
              resolvedClientName = client.name;
            }
          }

          if (!resolvedClientId && normalizedClient) {
            const client = await getOrCreateClientByName(normalizedClient);
            resolvedClientId = client.id;
            resolvedClientName = client.name;
          }

          const payload = {
            clientName: resolvedClientName,
            clientId: resolvedClientId || undefined,
            date: normalizedDate,
            total: normalizedTotal,
            status: normalizedStatus,
          };
          if (normalizedId) payload.id = normalizedId;
          await createQuote(payload);
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
      fetchQuotes();
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

  const sortedQuotes = useMemo(() => {
    return [...quotes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [quotes]);

  const sortedClients = useMemo(() => {
    const list = [...clients];
    list.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", "es", { sensitivity: "base" })
    );
    return list;
  }, [clients]);

  const rows = sortedQuotes.map((quote) => {
    const isConverted = quote.status === "converted";
    const isConverting = convertingId === quote.id;
    const actionLabel = isConverted
      ? "Convertida"
      : isConverting
        ? "Convirtiendo..."
        : "Convertir a factura";

    return {
      id: quote.id,
      cells: [
        quote.id,
        quote.clientName,
        currencyFormatter.format(quote.total),
        <div key="estado" className="sales__status-cell">
          <StatusBadge
            label={statusLabel[quote.status] ?? quote.status}
            tone={isConverted ? "muted" : "accent"}
          />
        </div>,
        quote.date,
        <div key="acciones" className="sales__action-cell sales__action-cell--quotes">
          <button
            type="button"
            className="sales__link"
            onClick={() => handleConvertQuote(quote)}
            disabled={isConverted || isConverting}
          >
            {actionLabel}
          </button>
          <button
            type="button"
            className="sales__inline-action sales__delete-button"
            onClick={() => handleDeleteQuote(quote)}
          >
            Eliminar
          </button>
        </div>,
      ],
    };
  });

  const showEmpty = !loading && !error && quotes.length === 0;
  const showTable = !loading && !error && quotes.length > 0;
  const totalValue = Number(formData.total);
  const isClientInvalid = submitAttempted && !formData.clientId;
  const isDateInvalid = submitAttempted && !formData.date;
  const isTotalInvalid =
    submitAttempted && (formData.total === "" || Number.isNaN(totalValue));

  return (
    <section className="app-page sales-page--quotes">
      <PageHeader
        title="Presupuestos"
        subtitle="Gestión de presupuestos"
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
              disabled={!quotes.length}
            >
              Exportar Excel
            </button>
            <PrimaryButton label="Nuevo presupuesto" onClick={handleOpenModal} />
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
          <PrimaryButton label="Reintentar" onClick={fetchQuotes} />
        </div>
      )}
      {showEmpty && (
        <div>
          <p>Todavía no hay presupuestos.</p>
          <PrimaryButton label="Nuevo presupuesto" onClick={handleOpenModal} />
        </div>
      )}

      {importFeedback && (
        <div className="sales__import-feedback">
          <div className="sales__import-feedback-main">
            <p>
              Importados {importFeedback.imported}, omitidos {importFeedback.skipped}
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
            <h2 className="sales__modal-title">Nuevo presupuesto</h2>
            <form className="sales__modal-form" onSubmit={handleSubmit}>
              <label className="sales__modal-field">
                <span>Cliente</span>
                <select
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleFieldChange}
                  className={isClientInvalid ? "sales__field-invalid" : ""}
                >
                  <option value="">Seleccioná un cliente...</option>
                  {sortedClients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                <span className="sales__modal-hint">
                  Si el cliente no existe, crealo desde Contactos.
                </span>
                {isClientInvalid && (
                  <span className="sales__field-error">Obligatorio</span>
                )}
              </label>
              <label className="sales__modal-field">
                <span>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFieldChange}
                  className={isDateInvalid ? "sales__field-invalid" : ""}
                />
                {isDateInvalid && (
                  <span className="sales__field-error">Obligatorio</span>
                )}
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
                  className={isTotalInvalid ? "sales__field-invalid" : ""}
                />
                {isTotalInvalid && (
                  <span className="sales__field-error">Total inválido</span>
                )}
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
            {modalError && <p className="sales__modal-error">{modalError}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
