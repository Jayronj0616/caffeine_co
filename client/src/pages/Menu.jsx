import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';

const Menu = () => {
  const [filter, setFilter] = useState('All');

  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/menu`);
        if (!response.ok) {
            throw new Error('Failed to fetch menu');
        }
        const data = await response.json();
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu:', error);
        // Fallback or empty state could be handled here
      }
    };

    fetchMenu();
  }, []);

  const categories = ['All', 'Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry'];
  
  const filteredItems = filter === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === filter);

  const handleSeed = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/seed`, { method: 'POST' });
        if (response.ok) {
            const data = await response.json();
            setMenuItems(data);
            setFilter('All');
        }
      } catch (error) {
        console.error('Error seeding database:', error);
      }
  };

  return (
    <div className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto min-h-screen animate-fade-in">
        <h2 className="text-4xl text-center mb-10 font-serif text-espresso underline decoration-oatmeal underline-offset-8">Seasonal Selection</h2>
        
        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
            {categories.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-4 py-2 text-sm uppercase tracking-widest border transition-all duration-300 ${filter === cat ? 'bg-espresso text-parchment border-espresso' : 'bg-transparent text-espresso border-oatmeal hover:border-bean hover:text-bean'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-16">
          {filteredItems.length > 0 ? filteredItems.map((item) => (
            <div key={item.id} className="group flex gap-6 items-start">
               {/* Image Container */}
              <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-oatmeal/20 rounded-lg overflow-hidden border border-oatmeal group-hover:border-bean transition-colors shadow-sm relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/latte.jpg'; }} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                  />
                  {/* Subtle overlay for luxury feel */}
                  <div className="absolute inset-0 bg-espresso/0 group-hover:bg-espresso/10 transition-colors duration-300" />
              </div>

              <div className="flex-grow flex flex-col justify-center">
                <div className="flex justify-between items-baseline border-b border-oatmeal pb-2 mb-2 group-hover:border-bean transition-colors">
                    <h4 className="text-xl font-serif font-semibold text-espresso group-hover:text-bean transition-colors">{item.name}</h4>
                    <span className="font-semibold text-espresso group-hover:text-bean transition-colors">${Number(item.price).toFixed(2)}</span>
                </div>
                <p className="text-sm text-bean italic mb-3">{item.description}</p>
                <div className="flex gap-3">
                  <button className="self-start text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-1 hover:text-bean transition-colors">
                      Add to Order <ShoppingBag size={12}/>
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-2 text-center py-10 border border-dashed border-oatmeal rounded-lg flex flex-col items-center gap-4">
              <p className="italic text-bean">No items found.</p>
              {filter === 'All' && menuItems.length === 0 && (
                  <button 
                    onClick={handleSeed}
                    className="bg-espresso text-parchment px-6 py-2 rounded-sm text-sm uppercase tracking-widest hover:bg-bean transition-colors"
                  >
                    Seed Menu Data
                  </button>
              )}
            </div>
          )}
        </div>
    </div>
  );
};
export default Menu;
