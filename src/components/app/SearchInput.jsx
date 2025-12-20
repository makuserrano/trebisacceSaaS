export default function SearchInput({ placeholder = 'Buscar...', value, onChange }) {
  const inputProps = onChange ? { value: value ?? '' } : { defaultValue: value };
  return (
    <label className="search-input">
      <span className="search-input__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="6" />
          <path d="m15.5 15.5 3.5 3.5" />
        </svg>
      </span>
      <input
        className="search-input__field"
        type="text"
        placeholder={placeholder}
        onChange={onChange}
        {...inputProps}
      />
    </label>
  );
}
