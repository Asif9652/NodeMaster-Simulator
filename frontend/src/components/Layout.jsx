import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
    const location = useLocation();

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 relative">
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-primary/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-3xl">hub</span>
                    <h1 className="text-lg font-bold tracking-tight">NodeMaster <span className="text-primary font-light text-sm opacity-70">v2.4</span></h1>
                </div>
                <div className="flex gap-2">
                    <button className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors border border-primary/20">
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                    </button>
                    <button className="bg-primary hover:bg-primary/90 text-background-dark p-2 rounded-lg transition-colors font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xl">settings_input_component</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 p-4 pb-24 overflow-y-auto relative z-10">
                <Outlet />
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-background-dark/95 backdrop-blur-xl border-t border-primary/10 px-4 pb-6 pt-3 flex justify-around items-center z-50">
                <NavItem to="/dashboard" icon="dashboard" label="Dashboard" />
                <NavItem to="/nodes" icon="account_tree" label="Nodes" />
                <NavItem to="/processes" icon="memory" label="Processes" />
                <NavItem to="/monitor" icon="insights" label="Monitor" />
            </nav>

            {/* Floating Background Elements */}
            <div className="fixed -bottom-20 -left-20 size-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
            <div className="fixed -top-20 -right-20 size-64 bg-red-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
        </div>
    );
};

const NavItem = ({ to, icon, label }) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 hover:text-primary'
                }`
            }
        >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
            <p className="text-[10px] font-medium uppercase tracking-tight">{label}</p>
        </NavLink>
    );
};

export default Layout;
