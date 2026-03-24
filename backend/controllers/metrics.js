import { supabase } from '../config/supabase.js';
import si from 'systeminformation';

export const getMetrics = async (req, res) => {
    try {
        const { data: nodes } = await supabase.from('nodes').select('id');
        const { data: processes } = await supabase.from('processes').select('id, cpu_usage');

        const total_nodes = nodes ? nodes.length : 0;
        const total_processes = processes ? processes.length : 0;

        const totalCpuUsage = processes ? processes.reduce((sum, p) => sum + p.cpu_usage, 0) : 0;
        const cluster_cpu_load = total_nodes > 0 ? Math.round(totalCpuUsage / total_nodes) : 0;

        // Real host system metrics
        const cpuResponse = await si.currentLoad();
        const memResponse = await si.mem();
        const uptime = await si.time();

        const metrics = {
            total_nodes,
            total_processes,
            cluster_cpu_load,
            host_cpu: Math.round(cpuResponse.currentLoad),
            host_mem_used: Math.round((memResponse.active / memResponse.total) * 100),
            host_uptime: Math.round(uptime.uptime),
            timestamp: new Date()
        };

        // Optionally store into system_metrics
        // await supabase.from('system_metrics').insert([{ total_nodes, total_processes, cluster_cpu_load }]);

        res.json(metrics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMigrations = async (req, res) => {
    const { data, error } = await supabase.from('migrations').select(`
        *,
        processes(process_name),
        source:nodes!source_node(name),
        target:nodes!target_node(name)
    `).order('timestamp', { ascending: false }).limit(50);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
};
