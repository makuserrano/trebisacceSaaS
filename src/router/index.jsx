import { Navigate, createBrowserRouter } from 'react-router-dom';
import App from '../app/App.jsx';
import AppLayout from '../app/AppLayout.jsx';
import Home from '../pages/Home/Home.jsx';
import Dashboard from '../pages/Dashboard/Dashboard.jsx';
import ContactsList from '../pages/app/Contacts/ContactsList.jsx';
import ProductsList from '../pages/app/Products/ProductsList.jsx';
import QuotesList from '../pages/app/Sales/QuotesList.jsx';
import InvoicesList from '../pages/app/Sales/InvoicesList.jsx';
import SalesOverview from '../pages/app/Sales/SalesOverview.jsx';
import TreasuryOverview from '../pages/app/Treasury/TreasuryOverview.jsx';
import AccountsList from '../pages/app/Treasury/AccountsList.jsx';
import TransactionsList from '../pages/app/Treasury/TransactionsList.jsx';
import PaymentsList from '../pages/app/Treasury/PaymentsList.jsx';
import DecisionsList from '../pages/app/Decisions/DecisionsList.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Home />,
      },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="inicio" replace />,
      },
      {
        path: 'inicio',
        element: <Dashboard />,
      },
      {
        path: 'contactos',
        element: <ContactsList />,
      },
      {
        path: 'productos',
        element: <ProductsList />,
      },
      {
        path: 'ventas',
        element: <SalesOverview />,
      },
      {
        path: 'ventas/presupuestos',
        element: <QuotesList />,
      },
      {
        path: 'ventas/facturas',
        element: <InvoicesList />,
      },
      {
        path: 'tesoreria',
        element: <TreasuryOverview />,
      },
      {
        path: 'tesoreria/cuentas',
        element: <AccountsList />,
      },
      {
        path: 'tesoreria/movimientos',
        element: <TransactionsList />,
      },
      {
        path: 'tesoreria/pagos',
        element: <PaymentsList />,
      },
      {
        path: 'decisiones',
        element: <DecisionsList />,
      },
    ],
  },
]);

export default router;
