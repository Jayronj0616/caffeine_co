import React, { useState, useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { getMenu } from '../lib/api/menu';
import { addToCart } from '../lib/api/cart';
import ErrorState from '../components/ErrorState';

const Menu = () => {
  const [filter, setFilter] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const { user } = useAuth();

  const fetchMenu = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await getMenu();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const categories = ['All', 'Espresso', 'Pour Over', 'Cold Brew', 'Signature', 'Pastry'];
  
  const filteredItems = filter === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === filter);

  /* Common SweetAlert Styling */
  const swalOptions = {
      confirmButtonColor: '#4A3B32', // Espresso
      cancelButtonColor: '#8B4513', // SaddleBrown
      background: '#F5F5DC', // Beige/Parchment
      color: '#4A3B32',
      width: '24em', // Make it smaller
      customClass: {
        popup: 'font-serif border-2 border-[#D2B48C]', // Serif font + Tan border
        title: 'text-xl', // Smaller title
        confirmButton: 'uppercase tracking-widest px-4 py-2 text-sm'
      }
  };

  const handleAddToOrder = async (item) => {
    if (!user) {
        Swal.fire({
            ...swalOptions,
            icon: 'info',
            title: 'Please Log In',
            text: 'You need to be logged in to add items to your cart.',
            confirmButtonText: 'Log In',
            showCancelButton: true
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = '/login';
            }
        });
        return;
    }

    try {
        await addToCart(user.id, item.id, 1);

        Swal.fire({
            ...swalOptions,
            icon: 'success',
            title: 'Added to Cart',
            text: `1x ${item.name}`,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#F5F5DC', 
            iconColor: '#4A3B32',
            customClass: { popup: 'border border-[#D2B48C]' }
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        Swal.fire({
             ...swalOptions,
             icon: 'error', 
             title: 'Oops...', 
             text: error.message || 'Could not add to cart'
         });
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
                  <button onClick={() => handleAddToOrder(item)} className="self-start text-xs font-bold uppercase tracking-wider text-espresso flex items-center gap-1 hover:text-bean transition-colors">
                      Add to Order <ShoppingBag size={12}/>
                  </button>
                </div>
              </div>
            </div>
          )) : loadError ? (
            <ErrorState
              className="col-span-2"
              title="Couldn't load the menu"
              onRetry={fetchMenu}
            />
          ) : (
            <div className="col-span-2 text-center py-10 border border-dashed border-oatmeal rounded-lg flex flex-col items-center gap-4">
              <p className="italic text-bean">
                {loading ? 'Loading menu...' : 'No items found.'}
              </p>
            </div>
          )}
        </div>
    </div>
  );
};
export default Menu;
