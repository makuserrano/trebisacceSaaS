import './appTopbar.scss';

export default function AppTopbar({ title, onToggleSidebar }) {
  return (
    <header className="app-topbar">
      <button
        type="button"
        className="app-topbar__menu"
        onClick={onToggleSidebar}
        aria-label="Abrir menú"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="app-topbar__titles">
        <p className="app-topbar__eyebrow">Panel</p>
        <h2 className="app-topbar__title">{title}</h2>
      </div>
    </header>
  );
}
