import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div className="relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden text-slate-900 dark:text-slate-100 font-display">
            <header className="sticky top-0 z-50 flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl">hub</span>
                    </div>
                    <h2 className="text-lg font-bold leading-tight tracking-tight">NodeMaster Simulator</h2>
                </div>
                <div className="flex items-center gap-4">
                    <button className="flex items-center justify-center rounded-full w-10 h-10 bg-slate-200 dark:bg-slate-800">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>
            </header>

            <main className="flex-1">
                <div className="relative hero-gradient overflow-hidden">
                    <div className="px-4 py-12 flex flex-col items-center text-center gap-8">
                        <div className="relative w-full aspect-square max-w-[320px] mx-auto rounded-full flex items-center justify-center">
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10 w-full h-full glass-card rounded-full flex items-center justify-center p-8 border-primary/20">
                                <div className="grid grid-cols-3 gap-4">
                                    <span className="material-symbols-outlined text-accent-cyan text-4xl animate-pulse">settings_input_component</span>
                                    <span className="material-symbols-outlined text-primary text-4xl">dynamic_form</span>
                                    <span className="material-symbols-outlined text-accent-purple text-4xl">cloud_sync</span>
                                    <span className="material-symbols-outlined text-primary text-4xl">memory</span>
                                    <span className="material-symbols-outlined text-accent-cyan text-5xl">scatter_plot</span>
                                    <span className="material-symbols-outlined text-accent-purple text-4xl">lan</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 max-w-md mx-auto relative z-20">
                            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight">
                                Master <span className="text-primary">Distributed</span> Process Migration
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
                                Visualize real-time load balancing, fault tolerance, and system optimization with our high-tech cloud simulator.
                            </p>
                        </div>

                        <div className="w-full flex flex-col gap-3 px-4 relative z-20">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="w-full flex items-center justify-center rounded-xl h-14 bg-primary text-background-dark text-lg font-bold shadow-[0_0_20px_rgba(19,236,91,0.3)] hover:scale-105 transition-transform"
                            >
                                Start Simulation
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="p-8 border-t border-slate-200 dark:border-slate-800 text-center">
                <div className="flex justify-center gap-6 mb-4 text-slate-400">
                    <span className="material-symbols-outlined">terminal</span>
                    <span className="material-symbols-outlined">database</span>
                    <span className="material-symbols-outlined">security</span>
                </div>
                <p className="text-slate-500 dark:text-slate-600 text-xs uppercase tracking-widest font-semibold">
                    © 2026 NodeMaster Systems Inc.
                </p>
            </footer>
        </div>
    );
};

export default LandingPage;
