export default function StatusBadge({ label, tone = 'accent' }) {
  const isMuted = tone === 'muted';
  return (
    <span className={`status-badge ${isMuted ? 'status-badge--muted' : ''}`}>
      {label}
    </span>
  );
}
