export default function PrimaryButton({ label, onClick, type = 'button', disabled = false }) {
  return (
    <button type={type} className="primary-button" onClick={onClick} disabled={disabled}>
      <span className="primary-button__icon">+</span>
      <span>{label}</span>
    </button>
  );
}
