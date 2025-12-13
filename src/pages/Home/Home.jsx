import './home.scss';

export default function Home() {
  return (
    <div className="page home-page">
      <div className="container">
        <header className="hero">
          <div className="hero__badge">MVP • Versión temprana</div>

          <h1 className="hero__title">Trebisacce</h1>

          <div className="hero__pill">Registro • Resultados • Evidencia</div>

          <p className="hero__subtitle">
            Aplicación web para registrar decisiones y revisar sus resultados con
            el tiempo.
          </p>

          <div className="hero__actions">
            <button className="btn btn--primary">Empezar</button>
            <button className="btn">Ver demo</button>
          </div>
        </header>

        <div className="hero__divider" aria-hidden="true" />

        <section className="grid3">
          <div className="card">
            <h3 className="card__title">Registrar decisiones</h3>
            <p className="card__text">
              Captura lo que decidiste y por qué, en un formato claro.
            </p>
          </div>

          <div className="card">
            <h3 className="card__title">Fijar expectativas</h3>
            <p className="card__text">
              Escribe lo que esperas que ocurra antes de ejecutar.
            </p>
          </div>

          <div className="card">
            <h3 className="card__title">Revisar resultados</h3>
            <p className="card__text">
              Cierra el ciclo después y compara lo esperado con lo real.
            </p>
          </div>
        </section>

        <footer className="footer">
          <span className="footer__text">© {new Date().getFullYear()} Trebisacce</span>
        </footer>
      </div>
    </div>
  );
}
