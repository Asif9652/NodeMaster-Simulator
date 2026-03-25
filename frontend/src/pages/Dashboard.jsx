import React, { useEffect, useState } from 'react';
import { socket, URL } from '../services/socket';

const Dashboard = () => {
    const [nodes, setNodes] = useState([]);
    const [metrics, setMetrics] = useState({ activeNodes: 0, clusterLoad: 0 });

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch(`${URL}/api/nodes`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setNodes(data);
                    const load = data.length > 0 ? Math.round(data.reduce((sum, n) => sum + n.load, 0) / data.length) : 0;
                    setMetrics({ activeNodes: data.length, clusterLoad: load });
                }
            } catch (err) { console.error(err); }
        };
        fetchInitial();

        // Listen for cluster updates
        socket.on('cluster_metrics_update', (data) => {
            if (!Array.isArray(data)) return;
            setNodes(data);
            const load = data.length > 0 ? Math.round(data.reduce((sum, n) => sum + n.load, 0) / data.length) : 0;
            setMetrics({ activeNodes: data.length, clusterLoad: load });
        });

        return () => {
            socket.off('cluster_metrics_update');
        };
    }, []);

    return (
        <div className="relative z-10">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="glass p-4 rounded-xl border-primary/20">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Active Nodes</p>
                    <div className="flex items-end justify-between mt-1">
                        <span className="text-2xl font-bold">{metrics.activeNodes}</span>
                        <span className="text-primary text-xs flex items-center gap-1 font-medium"><span className="material-symbols-outlined text-sm">trending_up</span></span>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl border-primary/20">
                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">System Load</p>
                    <div className="flex items-end justify-between mt-1">
                        <span className="text-2xl font-bold">{metrics.clusterLoad}%</span>
                        <span className={`${metrics.clusterLoad > 60 ? 'text-red-400' : 'text-primary'} text-xs flex items-center gap-1 font-medium`}>
                            <span className="material-symbols-outlined text-sm">{metrics.clusterLoad > 60 ? 'warning' : 'check_circle'}</span>
                        </span>
                    </div>
                </div>
            </div>

            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 px-1 flex justify-between">
                <span>Cluster: Alpha-7</span>
            </h2>

            {/* Node Grid */}
            <div className="grid grid-cols-1 gap-4 relative z-10 pb-10">
                {nodes.map(node => (
                    <NodeCard key={node.id} node={node} />
                ))}
                {nodes.length === 0 && (
                    <div className="text-center p-8 text-primary/50 text-sm border border-dashed border-primary/20 rounded-xl">
                        No active nodes in cluster.<br />Go to Nodes to add one.
                    </div>
                )}
            </div>
        </div>
    );
};

const NodeCard = ({ node }) => {
    const isOverloaded = node.load > 60;

    return (
        <div className={`glass p-4 rounded-xl flex flex-col gap-4 border-l-4 shadow-lg transition-all ${isOverloaded ? 'border-l-red-500 node-glow-overload shadow-xl relative overflow-hidden' : 'border-l-primary'}`}>
            {isOverloaded && (
                <div className="absolute top-0 right-0 p-1">
                    <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">warning</span>
                </div>
            )}

            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-3xl ${isOverloaded ? 'text-red-400 animate-pulse' : 'text-primary'}`}>dns</span>
                    <div>
                        <h3 className="font-bold text-lg leading-none">{node.name}</h3>
                        <p className="text-xs text-slate-400 mt-1">Status: {isOverloaded ? 'High Pressure' : 'Operational'}</p>
                    </div>
                </div>
                <span className={`${isOverloaded ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase`}>
                    {isOverloaded ? 'Overload' : 'Stable'}
                </span>
            </div>

            <div>
                <div className="flex justify-between text-xs mb-1 font-medium">
                    <span>CPU Load</span>
                    <span className={isOverloaded ? 'text-red-400' : ''}>{node.load}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${isOverloaded ? 'bg-gradient-to-r from-yellow-400 to-red-500' : 'bg-gradient-to-r from-primary to-yellow-400'} transition-all duration-500`}
                        style={{ width: `${Math.min(node.load, 100)}%` }}
                    ></div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {node.processes?.map((proc) => (
                    <span key={proc.id} className={`text-[10px] px-2 py-1 rounded-md border ${isOverloaded ? 'bg-red-900/30 text-red-200 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                        {proc.process_name} ({proc.cpu_usage}%)
                    </span>
                ))}
                {!node.processes?.length && (
                    <span className="text-[10px] text-slate-500 italic">No processes active</span>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
