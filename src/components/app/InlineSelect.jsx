export default function InlineSelect({ label }) {
  return (
    <span className="inline-select">
      <span className="status-badge status-badge--muted">{label}</span>
      <span className="inline-select__chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="m8 10 4 4 4-4" />
        </svg>
      </span>
    </span>
  );
}
