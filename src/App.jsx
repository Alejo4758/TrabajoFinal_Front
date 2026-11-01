import { BrowserRouter, Route, Routes } from 'react-router';
import AuthProvider from './context/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import GuestRoute from './components/GuestRoute/GuestRoute';
import Home from './Pages/Home/Home';
import Login from './Pages/Login/Login';
import RegisterAT from './Pages/RegisterAT/RegisterAT';
import RegisterClient from './Pages/RegisterClient/RegisterClient';
import ATSearch from './Pages/ATSearch/ATSearch';
import ATProfile from './Pages/ATProfile/ATProfile';
import ChatPage from './Pages/chatPage/chatPage';
import PanelAdmin from './Pages/PanelAdmin/PanelAdmin';
import Dashboard from './Pages/AT/Dashboard/Dashboard';
import Unauthorized from './Pages/Unauthorized/Unauthorized';
import NotFound from './Pages/404/404';
import { ROLES } from './utils/constants';

export default function App () {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path='/' element={<Home/>}/>
          <Route path='/profileAT/at/:id' element={<ATProfile/>}/>
          <Route path='/unauthorized' element={<Unauthorized/>}/>

          {/* Solo visitantes: con sesión iniciada redirigen al inicio del rol */}
          <Route element={<GuestRoute/>}>
            <Route path='/login' element={<Login/>}/>
            <Route path='/registerAT' element={<RegisterAT/>}/>
            <Route path='/registerClient' element={<RegisterClient/>}/>
          </Route>

          {/* Cualquier usuario con sesión */}
          <Route element={<ProtectedRoute/>}>
            <Route path='/chat' element={<ChatPage/>}/>
            <Route path='/searchAT' element={<ATSearch/>}/>
          </Route>

          {/* Solo AT */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.AT]}/>}>
            <Route path='/dashboardAT' element={<Dashboard/>}/>
          </Route>

          {/* Solo ADMIN */}
          <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]}/>}>
            <Route path='/panelAdmin' element={<PanelAdmin/>}/>
          </Route>

          {/* Cualquier otra dirección muestra el 404 en vez de una pantalla en blanco */}
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
