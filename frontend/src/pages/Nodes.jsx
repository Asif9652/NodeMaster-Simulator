import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';

const Nodes = () => {
    const [nodes, setNodes] = useState([]);
    const [stats, setStats] = useState({ active: 0, load: 0 });
    const [migrations, setMigrations] = useState([]); // Track recent migrations for animation

    const fetchNodes = async () => {
        try {
            const res = await fetch('/api/nodes');
            const data = await res.json();
            if (Array.isArray(data)) {
                setNodes(data);
            } else {
                setNodes([]);
            }
        } catch (err) {
            console.error(err);
            setNodes([]);
        }
    };

    useEffect(() => {
        fetchNodes();

        // We update real-time via the migration engine event 'cluster_metrics_update'
        socket.on('cluster_metrics_update', (data) => {
            if (!Array.isArray(data)) return;
            setNodes(data);
            const active = data.length;
            const load = active > 0 ? Math.round(data.reduce((sum, n) => sum + n.load, 0) / active) : 0;
            setStats({ active, load });
        });

        socket.on('process_migrated', (event) => {
            // Add to migration animation queue
            const newMig = { id: Date.now(), ...event };
            setMigrations(prev => [...prev.slice(-4), newMig]);

            // Remove the animation after 30 seconds to give user time to point it out
            setTimeout(() => {
                setMigrations(prev => prev.filter(m => m.id !== newMig.id));
            }, 30000);
        });

        return () => {
            socket.off('cluster_metrics_update');
            socket.off('process_migrated');
        };
    }, []);

    const handleCreateNode = async () => {
        await fetch('/api/nodes', { method: 'POST' });
        fetchNodes();
    };

    const handleDeleteNode = async (id) => {
        await fetch(`/api/nodes/${id}`, { method: 'DELETE' });
        fetchNodes();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Search and Global Stats */}
            <div className="pb-4">
                <div className="relative group flex gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary/60 group-focus-within:text-primary">search</span>
                        <input
                            className="w-full bg-primary/5 border border-primary/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none text-slate-100"
                            placeholder="Search system nodes..." type="text"
                        />
                    </div>
                    <button
                        onClick={handleCreateNode}
                        className="flex items-center justify-center rounded-xl px-4 bg-primary text-background-dark font-bold hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined">add</span>
                        <span className="ml-1 text-sm hidden sm:inline">Add Node</span>
                    </button>
                </div>
            </div>

            {/* Dashboard Summary Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-primary/60 font-semibold mb-1">Active Nodes</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold">{stats.active}</span>
                    </div>
                </div>
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                    <p className="text-xs uppercase tracking-wider text-primary/60 font-semibold mb-1">Total Load</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold">{stats.load}%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary/40 flex items-center gap-2">
                    <span className="h-[1px] flex-1 bg-primary/20"></span>
                    Live Cluster Map
                    <span className="h-[1px] flex-1 bg-primary/20"></span>
                </h2>

                {/* Visual Node Cluster */}
                <div className="relative p-6 bg-primary/5 border border-primary/20 rounded-2xl overflow-hidden min-h-[250px] flex items-center justify-center">

                    {/* Background Grid & Central Hub Line */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(19,236,91,0.05)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                    {nodes.length > 0 && <div className="absolute top-1/2 left-10 right-10 h-1 bg-primary/20 rounded-full shadow-[0_0_10px_rgba(19,236,91,0.2)]"></div>}

                    {/* Animated Migration Pulses */}
                    {migrations.map(m => (
                        <div key={m.id} className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 overflow-hidden pointer-events-none">
                            <div className="absolute left-0 right-0 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-full opacity-70 animate-[slide_1s_ease-in-out_infinite]"></div>
                        </div>
                    ))}

                    <div className="relative z-10 flex flex-wrap justify-center items-center gap-6 sm:gap-10 w-full pt-4 pb-10">
                        {nodes.map((node, i) => {
                            const isOverloaded = node.load > 85;
                            const isMigrating = migrations.some(m => m.source_node === node.id || m.target_node === node.id);

                            return (
                                <div key={node.id} className="relative flex flex-col items-center">
                                    {/* Connection Line to Main Hub */}
                                    <div className={`absolute -top-6 w-[2px] h-6 ${isOverloaded ? 'bg-red-500 box-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : isMigrating ? 'bg-cyan-400 box-shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse' : 'bg-primary/40'}`}></div>

                                    {/* Computer Icon */}
                                    <div className={`relative w-16 h-16 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${isOverloaded ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-bounce' : 'bg-background-dark border-primary shadow-[0_0_15px_rgba(19,236,91,0.2)]'}`}>
                                        <span className={`material-symbols-outlined text-4xl ${isOverloaded ? 'text-red-500' : 'text-primary'}`}>dns</span>

                                        {/* Load Badge overlapping the icon */}
                                        <div className={`absolute -bottom-3 px-2 py-0.5 rounded text-[10px] font-bold border ${isOverloaded ? 'bg-red-900 border-red-500 text-red-100' : 'bg-primary/20 border-primary text-primary'}`}>
                                            {node.load || 0}%
                                        </div>

                                        {/* Migrating Badge */}
                                        {isMigrating && (
                                            <div className="absolute -top-3 px-2 py-0.5 rounded text-[8px] font-bold border bg-cyan-900 border-cyan-400 text-cyan-200 animate-pulse uppercase tracking-widest whitespace-nowrap">
                                                Sharing Load <span className="material-symbols-outlined text-[10px] align-middle">sync</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Computer Information Underneath */}
                                    <div className="mt-4 text-center">
                                        <p className="text-sm font-bold text-slate-200">{node.name}</p>
                                        <p className={`text-[10px] font-mono tracking-widest uppercase mt-0.5 ${isOverloaded ? 'text-red-400' : 'text-primary/70'}`}>
                                            {isOverloaded ? 'OVERLOADED' : 'STABLE'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {nodes.length === 0 && (
                            <div className="text-center text-primary/40 italic flex flex-col items-center">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">power_off</span>
                                No computers connected to map
                            </div>
                        )}
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                @keyframes slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}} />
            </div>

            <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-widest text-primary/40 flex items-center gap-2">
                    <span className="h-[1px] flex-1 bg-primary/20"></span>
                    Detailed Node List
                    <span className="h-[1px] flex-1 bg-primary/20"></span>
                </h2>

                {nodes.map(node => (
                    <div key={node.id} className={`bg-primary/5 border-l-4 ${node.load > 85 ? 'border-l-red-500' : 'border-l-primary'} border-y border-r border-primary/10 rounded-lg p-4 relative overflow-hidden transition-all duration-300 hover:bg-primary/10`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-2xl">dns</span>
                                    <h3 className="font-bold text-lg">{node.name}</h3>
                                </div>
                                <p className="text-xs text-primary/60 font-mono uppercase mt-1">REGION: {node.region}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteNode(node.id)} className="p-1.5 text-red-400/60 hover:text-red-400 transition-colors">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 rounded bg-background-dark/50">
                                <p className="text-[10px] uppercase text-primary/40 font-bold">Status</p>
                                <p className="text-sm font-medium">{node.status}</p>
                            </div>
                            <div className="text-center p-2 rounded bg-background-dark/50 border border-primary/20">
                                <p className="text-[10px] uppercase text-primary/40 font-bold">Avg Load</p>
                                <p className={`text-sm font-bold ${node.load > 85 ? 'text-red-500' : 'text-primary'}`}>{node.load || 0}%</p>
                            </div>
                            <div className="text-center p-2 rounded bg-background-dark/50">
                                <p className="text-[10px] uppercase text-primary/40 font-bold">Processes</p>
                                <p className="text-sm font-medium">{node.processes?.length || 0}</p>
                            </div>
                        </div>

                        <div className="mt-3 w-full bg-primary/10 h-1 rounded-full overflow-hidden">
                            <div
                                className={`${node.load > 85 ? 'bg-red-500' : 'bg-primary'} h-full transition-all duration-500`}
                                style={{ width: `${Math.min(node.load || 0, 100)}%` }}>
                            </div>
                        </div>
                    </div>
                ))}

                {nodes.length === 0 && (
                    <div className="text-center py-10 opacity-60 italic">No node available. Add a node above.</div>
                )}
            </div>
        </div>
    );
};

export default Nodes;
