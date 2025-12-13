export default function App() {
  return (
    <div className="page">
      <div className="container">
        <header className="hero">
          <div className="hero__badge">MVP • Early build</div>

          <h1 className="hero__title">Trebisacce</h1>

          <p className="hero__subtitle">
            Web app to log decisions and review their outcomes over time.
          </p>

          <div className="hero__actions">
            <button className="btn btn--primary">Get started</button>
            <button className="btn">View demo</button>
          </div>
        </header>

        <section className="grid3">
          <div className="card">
            <h3 className="card__title">Log decisions</h3>
            <p className="card__text">
              Capture what you decided and why, in a clean format.
            </p>
          </div>

          <div className="card">
            <h3 className="card__title">Set expectations</h3>
            <p className="card__text">
              Write what you expect to happen before executing.
            </p>
          </div>

          <div className="card">
            <h3 className="card__title">Review outcomes</h3>
            <p className="card__text">
              Close the loop later and compare expected vs actual.
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
