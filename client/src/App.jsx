import React, { Suspense, lazy } from 'react';
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
import Cart from './pages/Cart';

// The admin console is lazy: it's a large chunk (dashboard, sales, the
// POS till, inventory, accounts) that only staff ever open, and it was
// previously bundled into the first load for every customer visiting the
// menu. Customer-facing pages stay eager — they're the common path.
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Sales = lazy(() => import('./pages/admin/Sales'));
const Inventory = lazy(() => import('./pages/admin/Inventory'));
const POSPage = lazy(() => import('./pages/admin/POS'));
const Accounts = lazy(() => import('./pages/admin/Accounts'));

function Layout() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-parchment text-espresso flex flex-col justify-between font-sans">
      {!isAdminRoute && <Navbar />}
      <main className="flex-grow">
        <Suspense
          fallback={
            <div className="pt-32 text-center text-espresso">Loading...</div>
          }
        >
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
        </Suspense>
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
