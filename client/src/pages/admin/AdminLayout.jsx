import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, Package, ShoppingCart, Users, Coffee } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
    { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
    { to: '/admin/sales', label: 'Sales', icon: Receipt },
    { to: '/admin/inventory', label: 'Inventory', icon: Package },
    { to: '/admin/pos', label: 'POS', icon: ShoppingCart },
    { to: '/admin/accounts', label: 'Accounts', icon: Users },
];

const AdminLayout = () => {
    const navigate = useNavigate();
    const { isAdmin, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return; // wait for profile/role to resolve
        if (!isAdmin) navigate('/login');
    }, [isAdmin, authLoading]);

    if (authLoading) return <div className="admin-console min-h-screen flex items-center justify-center bg-[var(--adm-bg)] text-[var(--adm-text-dim)] font-sans">Loading...</div>;
    if (!isAdmin) return null; // redirect in flight

    return (
        <div className="admin-console w-full min-h-screen bg-[var(--adm-bg)] text-[var(--adm-text)]">
            <div className="max-w-7xl mx-auto px-4 pt-8 pb-20 flex gap-8">
                <aside className="w-56 shrink-0 hidden md:block">
                    <div className="flex items-center gap-2.5 px-3 mb-10 pt-2">
                        <Coffee size={22} className="text-[var(--adm-copper)]" />
                        <span className="font-display font-bold text-xl tracking-wide">Console</span>
                    </div>
                    <nav className="sticky top-8 flex flex-col gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `relative flex items-center gap-3 pl-4 pr-3 py-2.5 text-xs uppercase tracking-[0.15em] transition-all ${
                                        isActive
                                            ? 'bg-[var(--adm-surface-hi)] text-[var(--adm-text)] font-semibold'
                                            : 'text-[var(--adm-text-dim)] hover:bg-[var(--adm-surface)] hover:text-[var(--adm-text)]'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {/* punched-ticket notch on the active item */}
                                        <span
                                            className={`absolute -left-[1px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                                                isActive ? 'bg-[var(--adm-copper)]' : 'bg-transparent'
                                            }`}
                                        />
                                        <item.icon size={16} className={isActive ? 'text-[var(--adm-copper)]' : ''} />
                                        {item.label}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </nav>
                </aside>

                {/* Mobile nav */}
                <nav className="md:hidden fixed top-0 left-0 right-0 z-40 flex gap-2 px-4 py-3 bg-[var(--adm-surface)]/95 backdrop-blur border-b border-[var(--adm-border)] overflow-x-auto">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest whitespace-nowrap rounded-full border transition-all ${
                                    isActive
                                        ? 'bg-[var(--adm-copper)] text-[var(--adm-bg)] border-[var(--adm-copper)] font-semibold'
                                        : 'bg-transparent text-[var(--adm-text-dim)] border-[var(--adm-border)]'
                                }`
                            }
                        >
                            <item.icon size={14} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <main className="flex-1 min-w-0 pt-14 md:pt-2">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
