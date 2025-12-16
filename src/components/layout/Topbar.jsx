import "./topbar.scss";

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand">Trebisacce</div>

        <nav className="topbar__nav" aria-label="Navegación principal">
          <a className="topbar__link" href="#proceso">
            El proceso
          </a>
          <a className="topbar__link" href="#funcionalidades">
            Funcionalidades
          </a>
          <a className="topbar__link" href="#audiencia">
            Para quién es
          </a>
          <a className="topbar__link" href="#precios">
            Precios
          </a>
        </nav>

        <div className="topbar__actions">
          <button className="topbar__cta" type="button">
            Probar demo
          </button>
        </div>
      </div>
    </header>
  );
}
