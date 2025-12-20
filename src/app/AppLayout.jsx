import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from '../components/layout/AppSidebar.jsx';
import '../styles/app.scss';
import './appLayout.scss';

const navSections = [
  { label: 'Inicio', to: '/app/inicio', icon: 'home' },
  { label: 'Contactos', to: '/app/contactos', icon: 'users' },
  { label: 'Productos', to: '/app/productos', icon: 'box' },
  {
    label: 'Ventas',
    icon: 'sales',
    children: [
      { label: 'Presupuestos', to: '/app/ventas/presupuestos' },
      { label: 'Facturas', to: '/app/ventas/facturas' },
    ],
  },
  {
    label: 'Tesorería',
    icon: 'wallet',
    children: [
      { label: 'Cuentas', to: '/app/tesoreria/cuentas' },
      { label: 'Movimientos', to: '/app/tesoreria/movimientos' },
    ],
  },
  { label: 'Decisiones', to: '/app/decisiones', icon: 'flag' },
];

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`app-shell ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <AppSidebar
        sections={navSections}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="app-shell__main">
        <main className="app-shell__content">
          <button
            type="button"
            className="app-shell__menu"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            aria-label="Abrir menú"
          >
            <span />
            <span />
            <span />
          </button>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
