import React, { useEffect, useState, useMemo } from 'react';
import { socket, URL } from '../services/socket';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

// Global variable to hold history so it doesn't wipe when changing tabs
let globalMetricsHistory = [];

const Monitor = () => {
    const [metrics, setMetrics] = useState({ clusterLoad: 0, activeNodes: 0 });
    const [history, setHistory] = useState(globalMetricsHistory);
    const [migrations, setMigrations] = useState([]);
    const [latestMigration, setLatestMigration] = useState(null);

    const fetchMigrations = async () => {
        try {
            const res = await fetch(`${URL}/api/metrics/migrations`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setMigrations(data);
            } else {
                setMigrations([]);
            }
        } catch (err) {
            console.error(err);
            setMigrations([]);
        }
    };

    useEffect(() => {
        fetchMigrations();

        socket.on('cluster_metrics_update', (nData) => {
            if (!Array.isArray(nData)) return;
            const activeNodes = nData.length;
            const clusterLoad = activeNodes > 0 ? Math.round(nData.reduce((sum, n) => sum + n.load, 0) / activeNodes) : 0;
            setMetrics({ activeNodes, clusterLoad });

            setHistory(prev => {
                const newHist = [...prev, { time: Date.now(), load: clusterLoad }];
                if (newHist.length > 120) newHist.shift(); // Keep last 120 data points (2 minutes)
                globalMetricsHistory = newHist;
                return newHist;
            });
        });

        socket.on('process_migrated', (event) => {
            setMigrations(prev => [event, ...prev]);
            setLatestMigration(event);
            setTimeout(() => setLatestMigration(null), 5000);
        });

        return () => {
            socket.off('cluster_metrics_update');
            socket.off('process_migrated');
        };
    }, []);

    const peakLoad = useMemo(() => {
        if (history.length === 0) return metrics.clusterLoad;
        return Math.max(...history.map(h => h.load));
    }, [history, metrics.clusterLoad]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* Live CPU Chart Section */}
            <section className="p-4">
                <div className="glass p-5 rounded-xl border border-primary/20 bg-primary/5 shadow-md">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cluster CPU Load</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-4xl font-bold text-primary">{metrics.clusterLoad}%</span>
                                <span className="text-primary/70 text-sm font-medium animate-pulse">Live</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-medium text-slate-400 block">Peak Today</span>
                            <span className="text-lg font-bold text-slate-200">{peakLoad}%</span>
                        </div>
                    </div>

                    {/* Recharts SVG Graph */}
                    <div className="relative h-32 w-full mt-2 -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#13ec5b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <YAxis domain={[0, 100]} hide />
                                <Area
                                    type="monotone"
                                    dataKey="load"
                                    stroke="#13ec5b"
                                    fillOpacity={1}
                                    fill="url(#colorLoad)"
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
                            <div className="border-t border-primary/30 w-full h-px"></div>
                            <div className="border-t border-primary/30 w-full h-px"></div>
                            <div className="border-t border-primary/30 w-full h-px"></div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4">
                        <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full bg-primary animate-pulse"></span>
                            <span className="text-[10px] font-bold text-primary uppercase">Nodes: {metrics.activeNodes} Active</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium tracking-wider">REFRESH: 1000MS</span>
                    </div>
                </div>
            </section>

            {/* Migration History Timeline */}
            <section className="px-4 py-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Migration Events
                </h3>
                <div className="space-y-0 relative">

                    {migrations.map((mig, index) => {
                        const isFirst = index === 0;
                        const timeStr = new Date(mig.timestamp).toLocaleTimeString();

                        return (
                            <div key={mig.id || index} className="relative flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className={`size-3 rounded-full ${isFirst ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-700'} z-10`}></div>
                                    {index !== migrations.length - 1 && <div className="w-0.5 h-full bg-primary/10 mt-2"></div>}
                                </div>

                                <div className={`flex-1 ${index !== migrations.length - 1 ? 'pb-4' : 'pb-0'}`}>
                                    <div className={`glass p-3 rounded-lg border-l-4 ${isFirst ? 'border-l-primary' : 'border-l-slate-700 opacity-80'} transition-colors`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold uppercase ${isFirst ? 'text-primary' : 'text-slate-500'}`}>
                                                {isFirst ? 'Success' : 'Archived'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-mono">{timeStr}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 w-0">
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Source Node</div>
                                                <div className="text-sm font-bold truncate">{mig.source?.name || mig.source_name}</div>
                                            </div>
                                            <span className={`material-symbols-outlined ${isFirst ? 'text-primary' : 'text-slate-600'}`}>arrow_forward</span>
                                            <div className="flex-1 w-0 text-right">
                                                <div className="text-[10px] text-slate-400 uppercase font-medium">Target Node</div>
                                                <div className="text-sm font-bold truncate">{mig.target?.name || mig.target_name}</div>
                                            </div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-primary/5 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-300 truncate mr-2">Process: {mig.processes?.process_name || mig.process_name || mig.process_id}</span>
                                            <span className={`text-[11px] font-bold ${isFirst ? 'text-primary' : 'text-slate-500'}`}>{mig.latency}ms</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {migrations.length === 0 && (
                        <div className="text-slate-500 text-sm italic ml-8 py-2">No migrations recorded yet.</div>
                    )}
                </div>
            </section>

            {/* Toast Notification Simulation */}
            {latestMigration && (
                <div className="fixed bottom-24 right-4 z-40 max-w-[280px] animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-primary text-background-dark p-3 rounded-xl shadow-2xl shadow-primary/30 flex items-center gap-3 ring-4 ring-background-dark">
                        <div className="bg-background-dark text-primary p-1 rounded-full">
                            <span className="material-symbols-outlined text-base leading-none">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold leading-none">Migration Successful</p>
                            <p className="text-[10px] font-medium opacity-80 mt-1 truncate max-w-[200px]">
                                {latestMigration.process_name} moved to {latestMigration.target_name}
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Monitor;
