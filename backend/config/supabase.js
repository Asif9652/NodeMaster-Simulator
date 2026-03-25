import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const n1 = uuidv4();
const n2 = uuidv4();
const n3 = uuidv4();
const n4 = uuidv4();

// IN-MEMORY DATABASE (MOCK)
const db = {
    nodes: [
        { id: n1, name: 'ALPHA-01', region: 'us-east-1', status: 'Operational', load: 0, created_at: new Date().toISOString() },
        { id: n2, name: 'BETA-02', region: 'eu-central-1', status: 'Operational', load: 0, created_at: new Date().toISOString() },
        { id: n3, name: 'GAMMA-03', region: 'ap-south-1', status: 'Operational', load: 0, created_at: new Date().toISOString() },
        { id: n4, name: 'DELTA-04', region: 'us-west-2', status: 'Operational', load: 0, created_at: new Date().toISOString() }
    ],
    processes: [
        { id: uuidv4(), process_name: 'Kernel_Daemon', cpu_usage: 15, memory_usage: 40, node_id: n1, status: 'Running', created_at: new Date().toISOString() },
        { id: uuidv4(), process_name: 'Database_Sync', cpu_usage: 25, memory_usage: 80, node_id: n2, status: 'Running', created_at: new Date().toISOString() },
        { id: uuidv4(), process_name: 'Load_Balancer', cpu_usage: 10, memory_usage: 20, node_id: n3, status: 'Running', created_at: new Date().toISOString() },
        { id: uuidv4(), process_name: 'Cache_Worker', cpu_usage: 20, memory_usage: 50, node_id: n4, status: 'Running', created_at: new Date().toISOString() }
    ],
    migrations: [],
    system_metrics: []
};

const createMockSupabase = () => {
    console.log('--- ☁️ PRESENTATION MODE ACTIVE (Mock Database) ☁️ ---');
    return {
        from: (table) => ({
            select: (query) => {
                let result = [...(db[table] || [])];
                return {
                    order: (col, { ascending }) => {
                        result.sort((a, b) => ascending 
                            ? new Date(a[col]).getTime() - new Date(b[col]).getTime() 
                            : new Date(b[col]).getTime() - new Date(a[col]).getTime()
                        );
                        return {
                            limit: (n) => Promise.resolve({ data: result.slice(0, n), error: null }),
                            then: (res) => res({ data: result, error: null })
                        };
                    },
                    eq: (col, val) => {
                        const filtered = result.filter(item => item[col] === val);
                        return {
                            single: () => Promise.resolve({ data: filtered[0], error: null }),
                            then: (res) => res({ data: filtered, error: null })
                        };
                    },
                    then: (res) => {
                        // For joined selects in metrics.js (simulating relationships)
                        if (query && query.includes('source')) {
                            result = result.map(m => ({
                                ...m,
                                process_name: db.processes.find(p => p.id === m.process_id)?.process_name || 'System Task',
                                source_name: db.nodes.find(n => n.id === m.source_node)?.name || 'Unknown Node',
                                target_name: db.nodes.find(n => n.id === m.target_node)?.name || 'Unknown Node'
                            }));
                        }
                        return res({ data: result, error: null });
                    }
                };
            },
            insert: (items) => {
                const newItems = items.map(item => ({
                    id: uuidv4(),
                    created_at: new Date().toISOString(),
                    ...item
                }));
                db[table].push(...newItems);
                return {
                    select: () => Promise.resolve({ data: newItems, error: null }),
                    then: (res) => res({ data: newItems, error: null })
                };
            },
            delete: () => ({
                eq: (col, val) => {
                    db[table] = db[table].filter(item => item[col] !== val);
                    return Promise.resolve({ data: null, error: null });
                }
            }),
            update: (updates) => ({
                eq: (col, val) => {
                    db[table] = db[table].map(item => {
                        if (item[col] === val) return { ...item, ...updates };
                        return item;
                    });
                    return Promise.resolve({ data: null, error: null });
                },
                in: (col, vals) => {
                    db[table] = db[table].map(item => {
                        if (vals.includes(item[col])) return { ...item, ...updates };
                        return item;
                    });
                    return Promise.resolve({ data: null, error: null });
                }
            })
        })
    };
};

// FORCE MOCK DATABASE FOR STABILITY DURING PRESENTATION
// Only use real Supabase if explicitly requested in ENV
const useRealSupabase = process.env.USE_REAL_SUPABASE === 'true';

export const supabase = (useRealSupabase && supabaseUrl) 
    ? createClient(supabaseUrl, supabaseKey) 
    : createMockSupabase();
