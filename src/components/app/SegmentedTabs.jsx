export default function SegmentedTabs({ options, value, onChange }) {
  return (
    <div className="segmented-tabs" role="tablist" aria-label="Segmented control">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`segmented-tabs__item ${value === option.value ? 'is-active' : ''}`}
          onClick={() => onChange?.(option.value)}
          role="tab"
          aria-selected={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
