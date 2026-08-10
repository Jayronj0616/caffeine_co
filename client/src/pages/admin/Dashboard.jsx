import React, { useState, useEffect } from 'react';
import { DollarSign, CalendarDays, Package } from 'lucide-react';
import { getAllOrders } from '../../lib/api/orders';

function isSameDay(date, ref) {
    return date.toDateString() === ref.toDateString();
}

function isWithinLastDays(date, ref, days) {
    const diffMs = ref.getTime() - date.getTime();
    return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
}

const GaugeCard = ({ label, value, sub, icon: Icon, accent }) => (
    <div className="bg-[var(--adm-surface)] border border-[var(--adm-border)] rounded-md p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--adm-text-dim)]">{label}</p>
            <Icon size={16} style={{ color: accent }} />
        </div>
        <p className="font-data text-4xl font-medium tabular-nums" style={{ color: 'var(--adm-text)' }}>{value}</p>
        {sub && <p className="font-data text-xs text-[var(--adm-text-dim)] mt-2">{sub}</p>}
        <div className="absolute bottom-0 left-0 h-[3px] w-full" style={{ background: accent, opacity: 0.5 }} />
    </div>
);

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllOrders()
            .then(setOrders)
            .catch((error) => console.error('Error fetching orders:', error))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="text-[var(--adm-text-dim)] font-data">Loading...</div>;

    const now = new Date();
    const todayOrders = orders.filter(o => isSameDay(new Date(o.created_at), now));
    // "Week" = rolling last 7 days, not calendar-week — simplest definition, no ISO week boundary edge cases.
    const weekOrders = orders.filter(o => isWithinLastDays(new Date(o.created_at), now, 7));

    const sum = (list) => list.reduce((s, o) => s + Number(o.total), 0);

    return (
        <div>
            <h2 className="font-display font-bold text-3xl mb-1">Dashboard</h2>
            <p className="text-sm text-[var(--adm-text-dim)] mb-8">Live readout from today's counter.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <GaugeCard
                    label="Today's Sales"
                    value={`$${sum(todayOrders).toFixed(2)}`}
                    sub={`${todayOrders.length} order${todayOrders.length === 1 ? '' : 's'}`}
                    icon={DollarSign}
                    accent="var(--adm-copper)"
                />
                <GaugeCard
                    label="Last 7 Days"
                    value={`$${sum(weekOrders).toFixed(2)}`}
                    sub={`${weekOrders.length} order${weekOrders.length === 1 ? '' : 's'}`}
                    icon={CalendarDays}
                    accent="var(--adm-patina)"
                />
                <GaugeCard
                    label="Total Orders"
                    value={orders.length}
                    sub="all time"
                    icon={Package}
                    accent="var(--adm-copper)"
                />
            </div>
        </div>
    );
};

export default Dashboard;
