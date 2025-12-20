export default function ToggleSwitch({ on }) {
  return (
    <span className={`toggle-switch ${on ? 'is-on' : ''}`}>
      <span className="toggle-switch__thumb" />
    </span>
  );
}
