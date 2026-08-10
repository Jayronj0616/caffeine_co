import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMenu } from '../lib/api/menu';
import { placePosOrder } from '../lib/api/orders';

const TAX_RATE = 0.08; // duplicated from place_pos_order() SQL — see PROGRESS.md known gaps

const POS = () => {
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]); // [{ coffee_id, name, price, quantity }]
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const navigate = useNavigate();
    const { isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin) {
            navigate('/login');
            return;
        }
        getMenu()
            .then(setItems)
            .finally(() => setLoading(false));
    }, [isAdmin, authLoading]);

    const addToCart = (item) => {
        setCart((prev) => {
            const existing = prev.find((c) => c.coffee_id === item.id);
            if (existing) {
                return prev.map((c) =>
                    c.coffee_id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                );
            }
            return [...prev, { coffee_id: item.id, name: item.name, price: item.price, quantity: 1 }];
        });
    };

    const changeQuantity = (coffee_id, delta) => {
        setCart((prev) =>
            prev
                .map((c) => (c.coffee_id === coffee_id ? { ...c, quantity: c.quantity + delta } : c))
                .filter((c) => c.quantity > 0)
        );
    };

    const removeFromCart = (coffee_id) => {
        setCart((prev) => prev.filter((c) => c.coffee_id !== coffee_id));
    };

    const subtotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setPlacing(true);
        try {
            await placePosOrder(cart.map((c) => ({ coffee_id: c.coffee_id, quantity: c.quantity })));
            setCart([]);
            alert('Order placed.');
        } catch (error) {
            console.error('POS checkout error:', error);
            alert(error.message || 'Checkout failed');
        } finally {
            setPlacing(false);
        }
    };

    if (authLoading || loading) return <div className="pt-32 text-center text-espresso">Loading...</div>;

    return (
        <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-serif text-espresso">POS</h2>
                <Link to="/admin" className="text-sm uppercase tracking-widest text-bean hover:text-espresso">
                    Back to Admin
                </Link>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Menu grid */}
                <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="bg-white/50 p-4 rounded-lg border border-oatmeal flex items-center gap-4 text-left shadow-sm hover:border-bean transition-colors"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded object-cover bg-oatmeal/20"
                                onError={(e) => (e.target.src = '/images/latte.jpg')}
                            />
                            <div>
                                <h4 className="font-bold text-espresso">{item.name}</h4>
                                <p className="text-sm text-bean">${Number(item.price).toFixed(2)}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Cart / checkout */}
                <div className="bg-parchment p-6 rounded-lg shadow-md border border-oatmeal h-fit sticky top-32">
                    <h3 className="text-xl font-bold text-espresso mb-4">Current Order</h3>
                    {cart.length === 0 ? (
                        <p className="text-sm text-bean italic">Tap a menu item to add it.</p>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {cart.map((c) => (
                                <div key={c.coffee_id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="text-espresso font-semibold">{c.name}</p>
                                        <p className="text-bean">${Number(c.price).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => changeQuantity(c.coffee_id, -1)} className="p-1 border border-oatmeal rounded hover:bg-oatmeal/20">
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-5 text-center">{c.quantity}</span>
                                        <button onClick={() => changeQuantity(c.coffee_id, 1)} className="p-1 border border-oatmeal rounded hover:bg-oatmeal/20">
                                            <Plus size={14} />
                                        </button>
                                        <button onClick={() => removeFromCart(c.coffee_id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-oatmeal pt-3 space-y-1 text-sm text-espresso">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax (8%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-1">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={cart.length === 0 || placing}
                        className="w-full mt-4 bg-espresso text-parchment py-2 rounded hover:bg-bean transition-colors disabled:opacity-50"
                    >
                        {placing ? 'Placing...' : 'Charge & Place Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POS;
