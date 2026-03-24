import { supabase } from '../config/supabase.js';

// ─── PRESENTATION TIMING SETTINGS ──────────────────────────────────────
const PROCESS_LIFESPAN_MS   = 5 * 60 * 1000;  // Processes live for 5 MINUTES
const ENGINE_INTERVAL_MS    = 3000;            // Engine checks every 3 seconds (fast migration)
const OVERLOAD_THRESHOLD    = 60;             // Node overloaded at 60% load (easy to trigger)
// ────────────────────────────────────────────────────────────────────────

export const startMigrationEngine = (io) => {
    setInterval(async () => {
        try {
            // Fetch all nodes and processes
            const { data: nodes } = await supabase.from('nodes').select('*');
            const { data: processes } = await supabase.from('processes').select('*');

            if (!nodes || !processes || nodes.length === 0) return;

            // Auto-complete processes older than PROCESS_LIFESPAN_MS
            const now = Date.now();
            const completedProcessIds = processes
                .filter(p => p.status !== 'Completed' && now - new Date(p.created_at).getTime() > PROCESS_LIFESPAN_MS)
                .map(p => p.id);

            if (completedProcessIds.length > 0) {
                console.log(`Auto-completing ${completedProcessIds.length} old process(es).`);
                await supabase.from('processes').update({ status: 'Completed' }).in('id', completedProcessIds);
            }

            // Only work with active (non-completed) processes
            const activeProcesses = processes.filter(
                p => p.status !== 'Completed' && !completedProcessIds.includes(p.id)
            );

            // Calculate load for each node based on active processes
            const nodeLoads = nodes.map(node => {
                const nodeProcs = activeProcesses.filter(p => p.node_id === node.id);
                const load = nodeProcs.reduce((sum, p) => sum + p.cpu_usage, 0);
                return { ...node, load, processes: nodeProcs };
            });

            // Emit live metrics to all connected frontends
            io.emit('cluster_metrics_update', nodeLoads);

            // Find overloaded nodes (above OVERLOAD_THRESHOLD)
            const overloadedNodes = nodeLoads.filter(n => n.load > OVERLOAD_THRESHOLD);

            for (const overloaded of overloadedNodes) {
                // Find the node with lowest load that is NOT overloaded
                const availableNodes = nodeLoads.filter(n => n.id !== overloaded.id);
                if (availableNodes.length === 0) continue;

                const targetNode = availableNodes.reduce(
                    (min, node) => (node.load < min.load ? node : min),
                    availableNodes[0]
                );

                if (overloaded.processes.length === 0) continue;

                // Pick any process from the overloaded node as long as target won't exceed 100%
                const movableProcesses = overloaded.processes.filter(
                    p => targetNode.load + p.cpu_usage <= 100
                );

                if (movableProcesses.length === 0) continue;

                // Pick the largest movable process for maximum visual impact
                const processToMove = movableProcesses.reduce(
                    (max, p) => (p.cpu_usage > max.cpu_usage ? p : max),
                    movableProcesses[0]
                );

                // --- Execute Migration ---
                const start = Date.now();

                // Brief delay to simulate network transfer
                await new Promise(res => setTimeout(res, 500));

                const { error: updateErr } = await supabase
                    .from('processes')
                    .update({ node_id: targetNode.id })
                    .eq('id', processToMove.id);

                if (!updateErr) {
                    const latency = Date.now() - start;
                    const migrationRecord = {
                        process_id: processToMove.id,
                        source_node: overloaded.id,
                        target_node: targetNode.id,
                        latency,
                    };

                    const { data: migrationResult } = await supabase
                        .from('migrations')
                        .insert([migrationRecord])
                        .select();

                    const event = migrationResult?.[0] || {
                        ...migrationRecord,
                        id: `local-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                    };

                    // Attach human-readable names for the frontend
                    event.process_name = processToMove.process_name;
                    event.source_name  = overloaded.name;
                    event.target_name  = targetNode.name;

                    console.log(`✅ Migrated "${processToMove.process_name}" from ${overloaded.name} → ${targetNode.name} (${latency}ms)`);
                    io.emit('process_migrated', event);
                }
            }
        } catch (error) {
            console.error('Migration Engine Error:', error.message);
        }
    }, ENGINE_INTERVAL_MS);
};
