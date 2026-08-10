import React, { useState, useEffect } from 'react';
import { ShoppingBag, Store, Trash2, Lock, ChefHat, CheckCircle2, XCircle } from 'lucide-react';
import { getAllOrders, voidPosOrder, updateOrderStatus } from '../../lib/api/orders';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Valid next steps per current status, for online orders only. Mirrors
// the transition rules enforced server-side in admin_update_order_status() —
// keep these two in sync if the flow ever changes.
const NEXT_STATUS_ACTIONS = {
  placed: [
    { status: 'preparing', label: 'Start Preparing', icon: ChefHat },
    { status: 'cancelled', label: 'Cancel', icon: XCircle, danger: true },
  ],
  preparing: [
    { status: 'completed', label: 'Mark Completed', icon: CheckCircle2 },
    { status: 'cancelled', label: 'Cancel', icon: XCircle, danger: true },
  ],
};

const VoidModal = ({ order, onClose, onVoided }) => {
    const { user } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [working, setWorking] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setWorking(true);
        setError('');
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password,
            });
            if (authError) throw new Error('Incorrect password');

            await voidPosOrder(order.id);
            onVoided();
        } catch (err) {
            setError(err.message || 'Void failed');
        } finally {
            setWorking(false);
        }
    };

    return (
        <div className="admin-console fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-md w-full max-w-sm overflow-hidden">
                <div className="bg-[var(--adm-danger)] text-[#1C1613] px-6 py-4 flex items-center gap-2">
                    <Lock size={18} />
                    <h3 className="font-display font-bold text-lg">Void Order #{order.id}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-[var(--adm-text-dim)]">
                        This permanently deletes this POS order. Enter your admin password to confirm.
                    </p>
                    <input
                        type="password"
                        autoFocus
                        placeholder="Admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 rounded bg-[var(--adm-bg)] border border-[var(--adm-border)] text-[var(--adm-text)] placeholder:text-[var(--adm-text-dim)] focus:outline-none focus:border-[var(--adm-copper)]"
                        required
                    />
                    {error && <p className="text-sm" style={{ color: 'var(--adm-danger)' }}>{error}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={working}
                            className="flex-1 bg-[var(--adm-danger)] text-[#1C1613] py-2 rounded font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {working ? 'Voiding...' : 'Void Order'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={working}
                            className="px-4 py-2 border border-[var(--adm-border)] text-[var(--adm-text)] rounded hover:bg-[var(--adm-surface-hi)] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Sales = () => {
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [voidingOrder, setVoidingOrder] = useState(null);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const fetchOrders = () => {
        setOrdersLoading(true);
        getAllOrders()
            .then(setOrders)
            .catch((error) => console.error('Error fetching orders:', error))
            .finally(() => setOrdersLoading(false));
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleVoided = () => {
        setVoidingOrder(null);
        fetchOrders();
    };

    const handleStatusChange = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            await updateOrderStatus(orderId, newStatus);
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    return (
        <div>
            <h2 className="font-display font-bold text-3xl mb-1">Sales</h2>
            <p className="text-sm text-[var(--adm-text-dim)] mb-8">Every ticket, online and at the counter.</p>
            <div className="max-w-3xl space-y-5">
                {ordersLoading ? (
                    <p className="text-[var(--adm-text-dim)] font-data text-sm">Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p className="text-[var(--adm-text-dim)] font-data text-sm">No orders yet.</p>
                ) : (
                    orders.map(order => (
                        <div
                            key={`${order.source}-${order.id}`}
                            className="bg-[var(--adm-surface)] rounded-md relative"
                            style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, var(--adm-border) 0 8px, transparent 8px 16px)',
                                backgroundSize: '100% 2px',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'top left',
                            }}
                        >
                            <div className="p-5 pt-6">
                                <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-dashed border-[var(--adm-border)]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-data font-semibold">#{String(order.id).padStart(4, '0')}</span>
                                        <span className={`flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ${order.source === 'pos' ? 'bg-[var(--adm-patina)]/15 text-[var(--adm-patina)]' : 'bg-[var(--adm-copper)]/15 text-[var(--adm-copper)]'}`}>
                                            {order.source === 'pos' ? <Store size={11} /> : <ShoppingBag size={11} />}
                                            {order.source === 'pos' ? 'POS' : 'Online'}
                                        </span>
                                        {order.status && (
                                            <span className="text-[10px] uppercase tracking-widest text-[var(--adm-text-dim)]">{order.status}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-data text-xs text-[var(--adm-text-dim)]">{new Date(order.created_at).toLocaleString()}</span>
                                        {order.source === 'pos' && (
                                            <button
                                                onClick={() => setVoidingOrder(order)}
                                                className="p-1.5 rounded hover:bg-[var(--adm-danger)]/15 transition-colors"
                                                style={{ color: 'var(--adm-danger)' }}
                                                aria-label="Void order"
                                                title="Void order"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {order.source === 'online' && NEXT_STATUS_ACTIONS[order.status] && (
                                    <div className="flex gap-2 mb-3 -mt-1">
                                        {NEXT_STATUS_ACTIONS[order.status].map(({ status, label, icon: Icon, danger }) => (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(order.id, status)}
                                                disabled={updatingOrderId === order.id}
                                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50"
                                                style={
                                                    danger
                                                        ? { borderColor: 'var(--adm-danger)', color: 'var(--adm-danger)' }
                                                        : { borderColor: 'var(--adm-copper)', color: 'var(--adm-copper)' }
                                                }
                                            >
                                                <Icon size={13} />
                                                {updatingOrderId === order.id ? 'Updating...' : label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <ul className="font-data text-sm space-y-1 mb-3 text-[var(--adm-text)]">
                                    {order.items.map(oi => (
                                        <li key={oi.id} className="flex justify-between">
                                            <span className="text-[var(--adm-text-dim)]">{oi.quantity}x {oi.name}</span>
                                            <span>${(oi.price * oi.quantity).toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between font-data font-semibold pt-2 border-t border-[var(--adm-border)]">
                                    <span>Total</span>
                                    <span style={{ color: 'var(--adm-copper)' }}>${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {voidingOrder && (
                <VoidModal
                    order={voidingOrder}
                    onClose={() => setVoidingOrder(null)}
                    onVoided={handleVoided}
                />
            )}
        </div>
    );
};

export default Sales;
