import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import RouteErrorBoundary from './components/RouteErrorBoundary';

// Only the landing page is eager, since it's what a first visit renders.
// Every other route is split out so a visitor downloads just the code for
// the page they're on. The admin console is the heaviest of these and only
// staff ever open it.
const Menu = lazy(() => import('./pages/Menu'));
const Origins = lazy(() => import('./pages/Origins'));
const OurStory = lazy(() => import('./pages/OurStory'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Cart = lazy(() => import('./pages/Cart'));
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
        <RouteErrorBoundary resetKey={location.pathname}>
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
        </RouteErrorBoundary>
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
