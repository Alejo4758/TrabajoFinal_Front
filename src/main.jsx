import { StrictMode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import Home from './Pages/Home/Home.jsx'
import Patients from './Pages/Patients/Patients.jsx'
import SignIn from './Pages/SignIn/SignIn.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <StrictMode>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/inicio" element={<Home />} />
        <Route path="/pacientes" element={<Patients />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/login" element={<SignIn />} />
      </Routes>
    </StrictMode>
  </BrowserRouter>,
)
