export default function PrimaryButton({ label, onClick, type = 'button' }) {
  return (
    <button type={type} className="primary-button" onClick={onClick}>
      <span className="primary-button__icon">+</span>
      <span>{label}</span>
    </button>
  );
}
