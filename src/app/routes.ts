import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Vehicles from './pages/Vehicles';
import WorkOrders from './pages/WorkOrders';
import Diagnostico from './pages/Diagnostico';
import ControlCalidad from './pages/ControlCalidad';
import Inventory from './pages/Inventory';
import ConfigSecurity from './pages/ConfigSecurity';
import ClientPortal from './pages/ClientPortal';
import Appointments from './pages/Appointments';
import Reportes from './pages/Reportes';
import Facturas from './pages/Facturas';
import JiraPlanning from './pages/JiraPlanning';
import SystemDocs from './pages/SystemDocs';
import UserStoryBoard from './pages/UserStoryBoard';
import ArquitecturaDocs from './pages/ArquitecturaDocs';
import ModeloDatos from './pages/ModeloDatos';
import Trazabilidad from './pages/Trazabilidad';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'citas', Component: Appointments },
      { path: 'clientes', Component: Clients },
      { path: 'vehiculos', Component: Vehicles },
      { path: 'ordenes', Component: WorkOrders },
      { path: 'diagnostico', Component: Diagnostico },
      { path: 'control-calidad', Component: ControlCalidad },
      { path: 'inventario', Component: Inventory },
      { path: 'portal', Component: ClientPortal },
      { path: 'reportes', Component: Reportes },
      { path: 'configuracion', Component: ConfigSecurity },
      { path: 'facturas', Component: Facturas },
      { path: 'jira-planning', Component: JiraPlanning },
      { path: 'historias-usuario', Component: UserStoryBoard },
      { path: 'documentacion', Component: SystemDocs },
      { path: 'arquitectura', Component: ArquitecturaDocs },
      { path: 'modelo-datos', Component: ModeloDatos },
      { path: 'trazabilidad', Component: Trazabilidad },
    ],
  },
]);
