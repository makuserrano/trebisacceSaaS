import "./home.scss";
import Footer from "../../components/layout/Footer";

export default function Home() {
  return (
    <div className="page home-page">
      <div className="container">
        <section className="hero home-hero">
          <div className="home-hero__grid">
            <div className="home-hero__content">
              <p className="home-hero__eyebrow t-small t-muted">
                Gestión y análisis para PyMEs
              </p>

              <h1 className="home-hero__title t-title">
                Opera con claridad. Decide con evidencia.
              </h1>

              <p className="home-hero__subtitle t-body t-muted">
                Trebisacce reúne operación, finanzas y reporting en un solo lugar. Un
                espacio sin adornos para ver la foto completa y tomar decisiones con
                datos, no con suposiciones.
              </p>

              <div className="home-hero__highlights">
                <div className="home-hero__highlight">Panel único de operación</div>
                <div className="home-hero__highlight">Trazabilidad de decisiones</div>
                <div className="home-hero__highlight">Indicadores accionables</div>
              </div>

              <div className="hero__actions">
                <button className="btn btn--primary">Probar demo</button>
                <button className="btn">Hablar con nosotros</button>
              </div>
            </div>

            <div className="home-hero__panel">
              <div className="home-hero__panel-header">
                <div className="home-hero__badge t-small t-muted">Resumen semanal</div>
                <span className="home-hero__status t-small">Actualizado</span>
              </div>
              <div className="home-hero__panel-rows">
                <div className="home-hero__row">
                  <span className="home-hero__row-label t-small t-muted">Ingresos</span>
                  <span className="home-hero__row-value t-body">+12.4%</span>
                </div>
                <div className="home-hero__row">
                  <span className="home-hero__row-label t-small t-muted">Gastos operativos</span>
                  <span className="home-hero__row-value t-body">-3.1%</span>
                </div>
                <div className="home-hero__row">
                  <span className="home-hero__row-label t-small t-muted">Cobros pendientes</span>
                  <span className="home-hero__row-value t-body">8 días</span>
                </div>
                <div className="home-hero__row">
                  <span className="home-hero__row-label t-small t-muted">Proyectos activos</span>
                  <span className="home-hero__row-value t-body">14</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section section--process" id="proceso">
          <div className="section__header">
            <h2 className="section__title t-section">El proceso</h2>
            <p className="section__subtitle t-body t-muted">
              Un flujo breve para ordenar la operación y medir resultados sin ruido.
            </p>
          </div>

          <div className="process__grid">
            <div className="process__item">
              <span className="process__icon">1</span>
              <h3 className="process__title t-card">Mapear la operación</h3>
              <p className="process__text t-body t-muted">
                Inventaria procesos, responsables y plazos en un tablero único.
              </p>
            </div>

            <div className="process__item">
              <span className="process__icon">2</span>
              <h3 className="process__title t-card">Registrar decisiones</h3>
              <p className="process__text t-body t-muted">
                Documenta qué se decide, por qué y cómo impacta en el negocio.
              </p>
            </div>

            <div className="process__item">
              <span className="process__icon">3</span>
              <h3 className="process__title t-card">Medir y ajustar</h3>
              <p className="process__text t-body t-muted">
                Conecta indicadores clave y detecta desviaciones a tiempo.
              </p>
            </div>
          </div>
        </section>

        <section className="section section--features" id="funcionalidades">
          <div className="section__header">
            <h2 className="section__title t-section">Funcionalidades</h2>
            <p className="section__subtitle t-body t-muted">
              Herramientas prácticas para que la dirección tenga control real y el
              equipo ejecute sin fricción.
            </p>
          </div>

          <div className="features__grid">
            <div className="feature-card">
              <h3 className="feature-card__title t-card">Visión financiera</h3>
              <p className="feature-card__text t-body t-muted">
                Flujo de caja, cobros y pagos en tiempo real para prever movimientos.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-card__title t-card">Pipeline operativo</h3>
              <p className="feature-card__text t-body t-muted">
                Proyectos, tareas y responsables en un solo tablero con estados claros.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-card__title t-card">Alertas accionables</h3>
              <p className="feature-card__text t-body t-muted">
                Señales simples cuando hay desvíos en plazos, margen o calidad.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-card__title t-card">Trazabilidad</h3>
              <p className="feature-card__text t-body t-muted">
                Cada decisión queda registrada con contexto y responsables.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-card__title t-card">Reportes ejecutivos</h3>
              <p className="feature-card__text t-body t-muted">
                Resúmenes listos para comité: avances, riesgos y próximos pasos.
              </p>
            </div>

            <div className="feature-card">
              <h3 className="feature-card__title t-card">Permisos y orden</h3>
              <p className="feature-card__text t-body t-muted">
                Roles simples para mantener la información segura y actualizada.
              </p>
            </div>
          </div>
        </section>

        <section className="section section--audience" id="audiencia">
          <div className="section__header">
            <h2 className="section__title t-section">Para quién es</h2>
            <p className="section__subtitle t-body t-muted">
              Claridad sobre quién se beneficia del producto y cuándo es mejor esperar.
            </p>
          </div>

          <div className="audience__grid">
            <div className="audience__col">
              <h3 className="audience__title t-card">Para quién es</h3>
              <ul className="audience__list t-body t-muted">
                <li>Dueños y administradores que buscan control sin hojas sueltas.</li>
                <li>Equipos que necesitan seguimiento de procesos y decisiones.</li>
                <li>PyMEs que ya manejan ingresos recurrentes y quieren escalar.</li>
              </ul>
            </div>
            <div className="audience__col">
              <h3 className="audience__title t-card">Para quién no es</h3>
              <ul className="audience__list t-body t-muted">
                <li>Negocios sin procesos definidos o sin responsable operativo.</li>
                <li>Equipos que prefieren suites genéricas de ofimática.</li>
                <li>Organizaciones que no comparten datos básicos de operación.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section section--cta" id="precios">
          <div className="cta__content">
            <div>
              <p className="cta__eyebrow t-small t-muted">Planes claros, sin capas ocultas</p>
              <h2 className="cta__title t-section">Listo para probar Trebisacce</h2>
              <p className="cta__subtitle t-body t-muted">
                Te guiamos en la configuración inicial y en las métricas clave para tu
                negocio. La demo es guiada y sin compromiso.
              </p>
            </div>
            <div className="cta__actions">
              <button className="btn btn--primary">Probar demo</button>
              <button className="btn">Solicitar llamada</button>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
