import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Origins from './pages/Origins';
import OurStory from './pages/OurStory';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Sales from './pages/admin/Sales';
import Inventory from './pages/admin/Inventory';
import POSPage from './pages/admin/POS';
import Accounts from './pages/admin/Accounts';
import Cart from './pages/Cart';

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-parchment text-espresso flex flex-col justify-between font-sans">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/origins" element={<Origins />} />
          <Route path="/story" element={<OurStory />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="sales" element={<Sales />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="accounts" element={<Accounts />} />
          </Route>
          </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}

export default App;
