import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCart, updateCartItem, removeCartItem } from '../lib/api/cart';
import { placeOrder } from '../lib/api/orders';
import ErrorState from '../components/ErrorState';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return; // wait for session to resolve before deciding

        if (!user) {
            navigate('/login');
            return;
        }

        fetchCart();
    }, [user, authLoading]);

    const fetchCart = async () => {
        setLoading(true);
        setLoadError(false);
        try {
            const data = await getCart(user.id);
            setCartItems(data);
        } catch (error) {
            console.error('Error fetching cart:', error);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id, newQuantity) => {
        try {
            const updated = await updateCartItem(id, newQuantity);
            if (!updated) {
                setCartItems(cartItems.filter(item => item.id !== id));
            } else {
                setCartItems(cartItems.map(item => item.id === id ? updated : item));
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    /* Common SweetAlert Styling */
    const swalOptions = {
      confirmButtonColor: '#4A3B32',
      cancelButtonColor: '#8B4513',
      background: '#F5F5DC',
      color: '#4A3B32',
      width: '24em',
      customClass: {
        popup: 'font-serif border-2 border-[#D2B48C]',
        title: 'text-xl',
        confirmButton: 'uppercase tracking-widest px-4 py-2 text-sm'
      }
    };

    const removeItem = async (id) => {
        try {
            const result = await Swal.fire({
                ...swalOptions,
                title: 'Remove Item?',
                text: "Do you want to remove this item from your cart?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Remove'
            });

            if (!result.isConfirmed) return;

            await removeCartItem(id);
            setCartItems(cartItems.filter(item => item.id !== id));
            Swal.fire({
                ...swalOptions,
                icon: 'success',
                title: 'Removed',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true,
                background: '#F5F5DC', 
                iconColor: '#4A3B32',
                customClass: { popup: 'border border-[#D2B48C]' }
            });
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            await placeOrder();
            setCartItems([]);
            Swal.fire({
                ...swalOptions,
                icon: 'success',
                title: 'Order Placed!',
                text: 'Thank you for your order. We are preparing it now!'
            });
        } catch (error) {
            console.error('Checkout failed:', error);
            Swal.fire({
                ...swalOptions,
                icon: 'error',
                title: 'Checkout Failed',
                text: error.message || 'Could not place your order. Please try again.'
            });
        } finally {
            setCheckingOut(false);
        }
    };

    const total = cartItems.reduce((sum, item) => sum + (Number(item.Coffee.price) * item.quantity), 0);

    if (loading || authLoading) return <div className="pt-32 text-center text-espresso">Loading cart...</div>;

    return (
        <div className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto min-h-screen animate-fade-in">
            <h2 className="text-4xl text-center mb-10 font-serif text-espresso underline decoration-oatmeal underline-offset-8">Your Cart</h2>

            {loadError ? (
                <ErrorState title="Couldn't load your cart" onRetry={fetchCart} />
            ) : cartItems.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-oatmeal rounded-lg bg-parchment/50">
                    <ShoppingBag size={48} className="mx-auto text-oatmeal mb-4" />
                    <p className="text-xl text-espresso italic">Your cart is empty.</p>
                    <button 
                        onClick={() => navigate('/menu')}
                        className="mt-6 bg-espresso text-parchment px-6 py-2 rounded uppercase tracking-widest hover:bg-bean transition-colors"
                    >
                        Browse Menu
                    </button>
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-12">
                    {/* Cart Items List */}
                    <div className="flex-grow space-y-6">
                        {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 md:gap-6 bg-parchment p-4 rounded-lg shadow-sm border border-oatmeal items-center">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-oatmeal/20 rounded overflow-hidden shrink-0">
                                    <img 
                                        src={item.Coffee.image || '/images/latte.jpg'} 
                                        alt={item.Coffee.name} 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => { e.target.onerror = null; e.target.src = '/images/latte.jpg'; }}
                                    />
                                </div>
                                
                                <div className="flex-grow">
                                    <h3 className="text-lg font-serif font-bold text-espresso">{item.Coffee.name}</h3>
                                    <p className="text-bean text-sm">${Number(item.Coffee.price).toFixed(2)}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                        className="p-1 text-espresso hover:bg-oatmeal/20 rounded transition-colors"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="font-semibold text-espresso w-4 text-center">{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                        className="p-1 text-espresso hover:bg-oatmeal/20 rounded transition-colors"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                <button 
                                    onClick={() => removeItem(item.id)}
                                    className="p-2 text-red-700 hover:bg-red-50 rounded transition-colors"
                                    title="Remove Item"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:w-80 shrink-0">
                        <div className="bg-parchment p-6 rounded-lg shadow-lg border border-oatmeal sticky top-32">
                            <h3 className="text-xl font-serif text-espresso mb-6 border-b border-oatmeal pb-2">Order Summary</h3>
                            
                            <div className="flex justify-between mb-4 text-espresso">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-bold text-espresso border-t border-oatmeal pt-4 mb-6">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>

                            <button 
                                onClick={handleCheckout}
                                disabled={checkingOut}
                                className="w-full bg-espresso text-parchment py-3 rounded uppercase tracking-widest hover:bg-bean transition-colors font-bold shadow-md hover:shadow-lg transform active:scale-95 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {checkingOut ? 'Placing Order...' : 'Checkout'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart;
