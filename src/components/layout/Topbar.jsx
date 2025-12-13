import './topbar.scss';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand">Trebisacce</div>
        <button className="topbar__menu" type="button" aria-label="Abrir menú">
          <span className="topbar__icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </header>
  );
}
