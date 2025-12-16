import "./footer.scss";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__text">
          © {year} Trebisacce. Todos los derechos reservados.
        </span>
        <span className="footer__text footer__credit">
          Diseñado y desarrollado por Maku Serrano.
        </span>
      </div>
    </footer>
  );
}
