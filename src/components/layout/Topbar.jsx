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
            Para quién
          </a>
        </nav>

        <div className="topbar__actions">
          <a className="topbar__login" href="#login">
            Iniciar sesión
          </a>
          <button className="topbar__cta" type="button">
            Registrarse
          </button>
        </div>
      </div>
    </header>
  );
}
