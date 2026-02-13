import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Origins from './pages/Origins';
import OurStory from './pages/OurStory';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-parchment text-espresso flex flex-col justify-between font-sans">
        <Navbar />
        <main className="flex-grow">
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/origins" element={<Origins />} />
            <Route path="/story" element={<OurStory />} />
            </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
