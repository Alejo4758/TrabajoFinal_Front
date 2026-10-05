import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import Calendar from './Pages/Calendar/Calendar'
import Login from './Pages/Login/Login'
import Register from './Pages/Register/Register'
import User from './Pages/User/User'
import Patients from './Pages/Patients/Patients'
import NotFound from './Pages/404/404'
export default function App () {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/user" element={<User />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}