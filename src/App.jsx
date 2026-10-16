import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/home/Home';
import Login from './Pages/Login/Login';
import RegisterAT from './pages/registerAT/RegisterAT';
import RegisterClient from './pages/RegisterClient/RegisterClient';
import ATSearchPage from './pages/ATSearch/ATSearch';
import ATProfile from './pages/ATProfile/ATProfile';
import ChatPage from './pages/chatPage/chatPage';

export default function App () {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/registerAT' element={<RegisterAT/>}/>
        <Route path='/registerClient' element={<RegisterClient/>}/>
        <Route path='/searchAT' element={<ATSearchPage/>}/>
        <Route path='/profileAT/at/:id' element={<ATProfile/>}/>
        <Route path='/chat' element={<ChatPage/>}/> 
      </Routes>
    </BrowserRouter>
  )
}