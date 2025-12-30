import { Outlet } from 'react-router-dom';
import Topbar from './components/layout/Topbar.jsx';

export default function App() {
  return (
    <>
      <Topbar />
      <Outlet />
    </>
  );
}
