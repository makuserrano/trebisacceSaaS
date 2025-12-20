import { useState } from "react";
import { Link } from "react-router-dom";
import "./topbar.scss";

export default function Topbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className={`topbar ${isOpen ? "is-open" : ""}`}>
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
          <Link className="topbar__login" to="/app">
            Iniciar sesión
          </Link>
          <Link className="topbar__cta" to="/app">
            Registrarse
          </Link>
        </div>

        <button
          className="topbar__toggle"
          type="button"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={toggleMenu}
        >
          <svg
            className="topbar__toggle-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M4 7.5h16M4 12h16M4 16.5h10"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="topbar__dropdown" aria-label="Navegación principal">
        <a className="topbar__dropdown-link" href="#proceso" onClick={closeMenu}>
          Proceso
        </a>
        <a
          className="topbar__dropdown-link"
          href="#funcionalidades"
          onClick={closeMenu}
        >
          Funcionalidades
        </a>
        <a className="topbar__dropdown-link" href="#audiencia" onClick={closeMenu}>
          Para quién
        </a>

        <span className="topbar__divider" aria-hidden="true" />

        <Link className="topbar__dropdown-link topbar__dropdown-link--login" to="/app" onClick={closeMenu}>
          Iniciar sesión
        </Link>
        <Link className="topbar__dropdown-cta" to="/app" onClick={closeMenu}>
          Registrarse
        </Link>
      </nav>
    </header>
  );
}
