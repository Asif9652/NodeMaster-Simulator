import { supabase } from '../config/supabase.js';

export const getProcesses = async (req, res) => {
    const { data, error } = await supabase.from('processes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
};

export const spawnProcess = async (req, res) => {
    const { process_name, cpu_usage, memory_usage, node_id } = req.body;

    // Check if node has capacity before creating
    const { data: procs } = await supabase.from('processes').select('cpu_usage').eq('node_id', node_id);
    const currentLoad = procs ? procs.reduce((sum, p) => sum + p.cpu_usage, 0) : 0;

    if (currentLoad + cpu_usage > 100) {
        return res.status(400).json({ error: "Node capacity exceeded. Cannot spawn process here." });
    }

    const { data, error } = await supabase.from('processes').insert([{
        process_name,
        cpu_usage,
        memory_usage,
        node_id,
        status: 'Running'
    }]).select();

    if (error) return res.status(500).json({ error: error.message });

    const newProcess = data[0];
    req.io.emit('process_spawned', newProcess);

    // Broadcast updated node load
    const newLoad = currentLoad + cpu_usage;
    req.io.emit('node_load_updated', { node_id, load: newLoad });

    res.status(201).json(newProcess);
};

export const migrateProcess = async (req, res) => {
    const { process_id, target_node_id } = req.body;

    const { data: processData, error: processErr } = await supabase.from('processes').select('*').eq('id', process_id).single();
    if (processErr || !processData) return res.status(404).json({ error: 'Process not found' });

    const source_node_id = processData.node_id;
    if (source_node_id === target_node_id) {
        return res.status(400).json({ error: 'Process already on target node' });
    }

    // Measure latency
    const start = Date.now();

    // Update process assignment
    const { error: updateErr } = await supabase.from('processes').update({ node_id: target_node_id }).eq('id', process_id);
    if (updateErr) return res.status(500).json({ error: updateErr.message });

    const end = Date.now();
    const latency = end - start;

    // Record migration
    const { data: migrationData, error: migrationErr } = await supabase.from('migrations').insert([{
        process_id,
        source_node: source_node_id,
        target_node: target_node_id,
        latency
    }]).select();

    if (migrationErr) console.error("Migration log error:", migrationErr);

    const migrationEvent = migrationData ? migrationData[0] : { process_id, source_node: source_node_id, target_node: target_node_id, latency, timestamp: new Date() };

    req.io.emit('process_migrated', migrationEvent);

    res.json(migrationEvent);
};
