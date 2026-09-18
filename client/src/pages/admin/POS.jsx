import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, Coffee } from 'lucide-react';
import { getMenu } from '../../lib/api/menu';
import { placePosOrder } from '../../lib/api/orders';
import ErrorState from '../../components/ErrorState';

const ConfirmModal = ({ cart, subtotal, total, placing, onConfirm, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
        <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-md w-full max-w-sm overflow-hidden">
            <div className="bg-[var(--adm-copper)] text-[#1C1613] px-6 py-4 flex items-center gap-2">
                <ShoppingCart size={18} />
                <h3 className="font-display font-bold text-lg">Confirm Order</h3>
            </div>
            <div className="p-6">
                <ul className="font-data text-sm space-y-2 mb-4 max-h-56 overflow-y-auto">
                    {cart.map((c) => (
                        <li key={c.coffee_id} className="flex justify-between">
                            <span className="text-[var(--adm-text-dim)]">{c.quantity}x {c.name}</span>
                            <span className="text-[var(--adm-text)]">${(c.price * c.quantity).toFixed(2)}</span>
                        </li>
                    ))}
                </ul>
                <div className="border-t border-dashed border-[var(--adm-border)] pt-3 space-y-1 font-data text-sm">
                    <div className="flex justify-between text-[var(--adm-text-dim)]">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-1" style={{ color: 'var(--adm-copper)' }}>
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={onConfirm}
                        disabled={placing}
                        className="flex-1 bg-[var(--adm-copper)] text-[#1C1613] py-2.5 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {placing ? 'Charging...' : 'Confirm & Charge'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={placing}
                        className="px-4 py-2.5 border border-[var(--adm-border)] text-[var(--adm-text)] rounded hover:bg-[var(--adm-surface-hi)] disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const POS = () => {
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]); // [{ coffee_id, name, price, quantity }]
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loadError, setLoadError] = useState(false);

    // Had no .catch(): a failed menu load was an unhandled rejection and
    // the till rendered as an empty grid, so the cashier could not ring
    // anything up and had nothing telling them why.
    const fetchMenu = () => {
        setLoading(true);
        setLoadError(false);
        getMenu()
            .then(setItems)
            .catch((error) => {
                console.error('Error fetching menu:', error);
                setLoadError(true);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchMenu();
    }, []);

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
    const total = subtotal;

    const handleConfirmCheckout = async () => {
        setPlacing(true);
        try {
            await placePosOrder(cart.map((c) => ({ coffee_id: c.coffee_id, quantity: c.quantity })));
            setCart([]);
            setShowConfirm(false);
        } catch (error) {
            console.error('POS checkout error:', error);
            alert(error.message || 'Checkout failed');
        } finally {
            setPlacing(false);
        }
    };

    if (loading) return <div className="text-[var(--adm-text-dim)] font-data">Loading...</div>;

    return (
        <div>
            <h2 className="font-display font-bold text-3xl mb-1 flex items-center gap-3">
                <Coffee size={26} style={{ color: 'var(--adm-copper)' }} /> Point of Sale
            </h2>
            <p className="text-sm text-[var(--adm-text-dim)] mb-8">Tap an item to ring it up.</p>
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Menu grid */}
                <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
                    {loading && (
                        <p className="sm:col-span-2 text-[var(--adm-text-dim)] font-data text-sm">Loading menu...</p>
                    )}
                    {loadError && (
                        <ErrorState
                            className="sm:col-span-2"
                            title="Couldn't load the till"
                            message="The menu didn't load, so nothing can be rung up. Check the connection and try again."
                            onRetry={fetchMenu}
                        />
                    )}
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="group bg-[var(--adm-surface)] border border-[var(--adm-border)] p-4 rounded-md flex items-center gap-4 text-left hover:border-[var(--adm-copper)] transition-colors"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 rounded object-cover bg-[var(--adm-surface-hi)] shrink-0"
                                onError={(e) => (e.target.src = '/images/latte.jpg')}
                            />
                            <div className="min-w-0">
                                <h4 className="font-semibold truncate">{item.name}</h4>
                                <p className="font-data text-sm text-[var(--adm-text-dim)]">${Number(item.price).toFixed(2)}</p>
                            </div>
                            <Plus size={16} className="ml-auto text-[var(--adm-border)] group-hover:text-[var(--adm-copper)] transition-colors shrink-0" />
                        </button>
                    ))}
                </div>

                {/* Cart / checkout */}
                <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] p-6 rounded-md h-fit sticky top-8">
                    <h3 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
                        <ShoppingCart size={18} style={{ color: 'var(--adm-copper)' }} /> Current Order
                    </h3>
                    {cart.length === 0 ? (
                        <p className="text-sm text-[var(--adm-text-dim)] italic">Tap a menu item to add it.</p>
                    ) : (
                        <div className="space-y-3 mb-4">
                            {cart.map((c) => (
                                <div key={c.coffee_id} className="flex items-center justify-between font-data text-sm">
                                    <div>
                                        <p className="font-sans font-semibold text-[var(--adm-text)]">{c.name}</p>
                                        <p className="text-[var(--adm-text-dim)]">${Number(c.price).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => changeQuantity(c.coffee_id, -1)} className="p-1 border border-[var(--adm-border)] rounded hover:bg-[var(--adm-surface-hi)]">
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-5 text-center">{c.quantity}</span>
                                        <button onClick={() => changeQuantity(c.coffee_id, 1)} className="p-1 border border-[var(--adm-border)] rounded hover:bg-[var(--adm-surface-hi)]">
                                            <Plus size={14} />
                                        </button>
                                        <button onClick={() => removeFromCart(c.coffee_id)} className="p-1 rounded hover:bg-[var(--adm-danger)]/15" style={{ color: 'var(--adm-danger)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="border-t border-dashed border-[var(--adm-border)] pt-3 space-y-1 font-data text-sm">
                        <div className="flex justify-between text-[var(--adm-text-dim)]">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-base pt-1" style={{ color: 'var(--adm-copper)' }}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowConfirm(true)}
                        disabled={cart.length === 0 || placing}
                        className="w-full mt-4 bg-[var(--adm-copper)] text-[#1C1613] py-2.5 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        Charge & Place Order
                    </button>
                </div>
            </div>

            {showConfirm && (
                <ConfirmModal
                    cart={cart}
                    subtotal={subtotal}
                    total={total}
                    placing={placing}
                    onConfirm={handleConfirmCheckout}
                    onClose={() => setShowConfirm(false)}
                />
            )}
        </div>
    );
};

export default POS;
