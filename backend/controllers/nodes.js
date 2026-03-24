import { supabase } from '../config/supabase.js';

export const getNodes = async (req, res) => {
    const { data: nodes, error } = await supabase.from('nodes').select('*').order('created_at', { ascending: false });
    if (error) {
        // Mock fallback if disconnected
        return res.status(500).json({ error: error.message });
    }

    // Calculate current CPU load from processes
    const { data: processes } = await supabase.from('processes').select('node_id, cpu_usage');
    if (processes && nodes) {
        nodes.forEach(node => {
            const nodeProcs = processes.filter(p => p.node_id === node.id);
            node.cpu_load = Math.min(100, nodeProcs.reduce((sum, p) => sum + p.cpu_usage, 0));
        });
    }

    res.json(nodes || []);
};

export const createNode = async (req, res) => {
    const regions = ['us-east-1', 'eu-central-1', 'ap-south-1', 'us-west-2'];
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    const nodeName = `NODE-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data, error } = await supabase.from('nodes').insert([{ name: nodeName, region: randomRegion, cpu_load: 0, status: 'Operational' }]).select();
    if (error) return res.status(500).json({ error: error.message });

    req.io.emit('node_created', data[0]);
    res.status(201).json(data[0]);
};

export const deleteNode = async (req, res) => {
    const { id } = req.params;

    // Auto-delete any orphaned processes running on this node
    await supabase.from('processes').delete().eq('node_id', id);

    // Delete the node itself
    const { error } = await supabase.from('nodes').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });

    req.io.emit('node_deleted', id);
    res.status(200).json({ message: 'Node deleted successfully' });
};
