import { useState } from "react";
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
          <a className="topbar__login" href="#login">
            Iniciar sesión
          </a>
          <button className="topbar__cta" type="button">
            Registrarse
          </button>
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

        <a
          className="topbar__dropdown-link topbar__dropdown-link--login"
          href="#login"
          onClick={closeMenu}
        >
          Iniciar sesión
        </a>
        <a
          className="topbar__dropdown-cta"
          href="#registro"
          onClick={closeMenu}
        >
          Registrarse
        </a>
      </nav>
    </header>
  );
}
