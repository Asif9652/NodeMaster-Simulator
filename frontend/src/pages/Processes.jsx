import React, { useEffect, useState } from 'react';
import { socket } from '../services/socket';

const Processes = () => {
    const [nodes, setNodes] = useState([]);
    const [processes, setProcesses] = useState([]);
    const [newProcess, setNewProcess] = useState({ name: '', cpu: 45 });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState(null);
    const [targetNodeId, setTargetNodeId] = useState('');

    const fetchData = async () => {
        try {
            const [nodesRes, procsRes] = await Promise.all([
                fetch('/api/nodes'),
                fetch('/api/processes')
            ]);
            const nData = await nodesRes.json();
            const pData = await procsRes.json();
            setNodes(nData);
            setProcesses(pData);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();

        socket.on('cluster_metrics_update', (nData) => {
            if (!Array.isArray(nData)) return;
            setNodes(nData);
            const allProcs = [];
            nData.forEach(n => {
                n.processes?.forEach(p => {
                    allProcs.push({ ...p, nodeName: n.name });
                });
            });
            setProcesses(allProcs);
        });

        socket.on('process_migrated', (event) => {
            fetchData();
        });

        socket.on('process_spawned', () => {
            fetchData();
        });

        return () => {
            socket.off('cluster_metrics_update');
            socket.off('process_migrated');
            socket.off('process_spawned');
        };
    }, []);

    // Setup timer to trigger UI updates for the progress bars
    useEffect(() => {
        const timer = setInterval(() => {
            setProcesses(p => [...p]); // Force minimal re-render every second to update age bars
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const totalCpu = nodes.reduce((sum, n) => sum + (n.load || 0), 0);
    const avgCpu = nodes.length > 0 ? Math.round(totalCpu / nodes.length) : 0;

    const handleSpawn = async () => {
        if (!newProcess.name) return alert('Enter process name');

        // Auto-select node with lowest load
        if (nodes.length === 0) return alert('No nodes available');
        const availableNodes = nodes.filter(n => (n.load || 0) + newProcess.cpu <= 100);
        if (availableNodes.length === 0) return alert('No device has enough capacity');
        const target = availableNodes.reduce((min, n) => (n.load || 0) < (min.load || 0) ? n : min, availableNodes[0]);

        await fetch('/api/processes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                process_name: newProcess.name,
                cpu_usage: newProcess.cpu,
                memory_usage: Math.round(newProcess.cpu * 2.5),
                node_id: target.id
            })
        });
        setNewProcess({ ...newProcess, name: '' });
        fetchData();
    };

    const handleMigrate = async () => {
        if (!selectedProcess || !targetNodeId) return;
        await fetch('/api/processes/migrate', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                process_id: selectedProcess.id,
                target_node_id: targetNodeId
            })
        });
        setIsModalOpen(false);
        fetchData();
    };

    const openMigrateModal = (proc) => {
        setSelectedProcess(proc);
        setTargetNodeId(proc.node_id);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* System Stats Summary */}
            <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
                <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 border border-primary/20 bg-primary/5">
                    <p className="text-slate-500 dark:text-primary/60 text-xs font-medium uppercase tracking-wider">Total CPU</p>
                    <p className="text-2xl font-bold">{avgCpu}%</p>
                    <div className="w-full bg-primary/10 h-1 rounded-full mt-2">
                        <div className="bg-primary h-1 rounded-full" style={{ width: `${Math.min(avgCpu, 100)}%` }}></div>
                    </div>
                </div>
                <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 border border-primary/20 bg-primary/5">
                    <p className="text-slate-500 dark:text-primary/60 text-xs font-medium uppercase tracking-wider">Active Nodes</p>
                    <p className="text-2xl font-bold">{nodes.length}</p>
                    <p className="text-[10px] text-primary/80 font-medium tracking-widest text-ellipsis overflow-hidden whitespace-nowrap">Auto-scale Active</p>
                </div>
                <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-xl p-4 border border-primary/20 bg-primary/5">
                    <p className="text-slate-500 dark:text-primary/60 text-xs font-medium uppercase tracking-wider">Processes</p>
                    <p className="text-2xl font-bold">{processes.length}</p>
                    <p className="text-[10px] text-primary/80 font-medium">Running instances</p>
                </div>
            </div>

            {/* Create Process Form */}
            <section className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-md">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">memory</span>
                    Deploy New Process
                </h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-xs uppercase font-bold text-slate-400 tracking-wider">Resource Intensity ({newProcess.cpu}%)</label>
                        </div>
                        <input
                            className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer accent-primary"
                            max="100" min="1" type="range"
                            value={newProcess.cpu} onChange={(e) => setNewProcess({ ...newProcess, cpu: parseInt(e.target.value) })}
                        />
                        <div className="flex justify-between text-[10px] mt-1 text-primary/60">
                            <span>MINIMAL</span>
                            <span>AVERAGE</span>
                            <span>CRITICAL</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <input
                            value={newProcess.name}
                            onChange={e => setNewProcess({ ...newProcess, name: e.target.value })}
                            className="w-full bg-background-dark/50 border border-primary/20 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-600"
                            placeholder="Process identifier..." type="text"
                        />
                        <button
                            onClick={handleSpawn}
                            className="px-6 rounded-xl bg-primary text-background-dark font-black tracking-wider uppercase hover:bg-primary/90 hover:scale-105 hover:shadow-[0_0_20px_rgba(19,236,91,0.4)] transition-all active:scale-95 whitespace-nowrap"
                        >
                            SPAWN
                        </button>
                    </div>
                </div>
            </section>

            {/* Active Processes List */}
            <div className="pb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold font-display">Running Instances</h2>
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                        <span className="text-xs font-medium text-slate-300">Auto-balancing:</span>
                        <span className="material-symbols-outlined text-[12px] animate-pulse">settings</span>
                    </div>
                </div>

                <div className="space-y-3">
                    {processes.map(proc => {
                        const isHighCpu = proc.cpu_usage > 60;
                        const nodeInfo = nodes.find(n => n.id === proc.node_id);
                        const parentName = nodeInfo?.name || proc.nodeName || 'Unknown';

                        return (
                            <div key={proc.id} className="relative flex flex-col gap-3 bg-white dark:bg-slate-800/40 p-4 rounded-xl border border-primary/10 shadow-sm transition-transform hover:-translate-y-1 duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`size-10 flex items-center justify-center rounded-lg ${isHighCpu ? 'bg-orange-500/20 text-orange-400' : 'bg-primary/20 text-primary'}`}>
                                            <span className="material-symbols-outlined text-2xl">{isHighCpu ? 'warning' : 'memory'}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{proc.process_name}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-primary/60">
                                                CPU: {proc.cpu_usage}% • Node: {parentName}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => openMigrateModal(proc)}
                                        className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full border border-primary/30 flex items-center gap-1 hover:bg-primary/30 transition-colors ml-4 shrink-0"
                                    >
                                        MIGRATE <span className="material-symbols-outlined text-xs">swap_horiz</span>
                                    </button>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div className={`${isHighCpu ? 'bg-orange-500' : 'bg-primary'} h-full transition-all duration-300`} style={{ width: `${proc.cpu_usage}%` }}></div>
                                </div>

                                {/* Lifecycle Progress Bar */}
                                {proc.created_at && (
                                    (() => {
                                        const ageMs = Date.now() - new Date(proc.created_at).getTime();
                                        const maxAgeMs = 300000; // 5 minutes to match backend
                                        const rawProgress = (ageMs / maxAgeMs) * 100;
                                        const progress = Math.max(0, Math.min(100, Math.round(rawProgress)));
                                        const remainingSec = Math.max(0, Math.round((maxAgeMs - ageMs) / 1000));

                                        return (
                                            <div className="flex items-center gap-2 mt-2 border-t border-primary/5 pt-2">
                                                <div className="text-[9px] font-mono text-slate-500 uppercase w-12 text-right">Age: {progress}%</div>
                                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden relative">
                                                    <div className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-1000 linear" style={{ width: `${progress}%` }}></div>
                                                </div>
                                                <div className="text-[9px] font-mono text-blue-400 uppercase w-10">{remainingSec}s left</div>
                                            </div>
                                        );
                                    })()
                                )}
                            </div>
                        );
                    })}

                    {processes.length === 0 && (
                        <div className="text-center py-10 opacity-60 italic">No active processes. Deploy one above.</div>
                    )}
                </div>
            </div>

            {/* Migration Modal */}
            {isModalOpen && selectedProcess && (
                <div className="fixed inset-0 bg-background-dark/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
                    <div className="w-full sm:max-w-md bg-background-dark sm:border border-t border-primary/20 rounded-t-3xl sm:rounded-3xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-6 sm:hidden"></div>
                        <h2 className="text-xl font-bold mb-4">Migrate Process</h2>
                        <p className="text-sm text-slate-400 mb-6">Select a destination node for <span className="text-primary font-bold">{selectedProcess.process_name}</span></p>

                        <div className="space-y-3 mb-8 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                            {nodes.map(node => {
                                const isCurrent = node.id === selectedProcess.node_id;
                                const isTarget = node.id === targetNodeId;
                                const nodeLoad = node.load || 0;

                                return (
                                    <div
                                        key={node.id}
                                        onClick={() => !isCurrent && setTargetNodeId(node.id)}
                                        className={`p-4 rounded-xl border ${isTarget ? 'border-primary/80 bg-primary/10' : isCurrent ? 'border-primary/20 bg-primary/5 opacity-50' : 'border-slate-700 bg-slate-800/40 cursor-pointer hover:bg-slate-700/50'} flex justify-between items-center transition-colors`}
                                    >
                                        <div>
                                            <p className="font-bold">{node.name}</p>
                                            <p className={`text-[10px] ${isCurrent ? 'text-primary/60' : 'text-slate-500'}`}>
                                                {isCurrent ? 'CURRENT LOCATION' : nodeLoad > 85 ? 'HEAVY LOAD' : 'OPTIMAL'} | {nodeLoad}% LOAD
                                            </p>
                                        </div>
                                        {isTarget ? (
                                            <span className="material-symbols-outlined text-primary">check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-600">circle</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleMigrate}
                            className="w-full bg-primary text-background-dark font-bold py-4 rounded-xl mb-2 hover:bg-primary/90 transition-colors"
                        >
                            INITIATE MIGRATION
                        </button>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="w-full py-4 text-slate-400 font-medium hover:text-slate-200 transition-colors"
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Processes;
