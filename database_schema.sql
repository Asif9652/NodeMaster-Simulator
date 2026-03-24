-- Create nodes table
CREATE TABLE IF NOT EXISTS public.nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    region TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Operational',
    cpu_load INTEGER DEFAULT 0,
    uptime TEXT DEFAULT '0s',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processes table
CREATE TABLE IF NOT EXISTS public.processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_name TEXT NOT NULL,
    cpu_usage INTEGER NOT NULL,
    memory_usage INTEGER NOT NULL,
    node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'Running',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create migrations table
CREATE TABLE IF NOT EXISTS public.migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_id UUID REFERENCES public.processes(id) ON DELETE CASCADE,
    source_node UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    target_node UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
    latency INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
    id SERIAL PRIMARY KEY,
    total_nodes INTEGER DEFAULT 0,
    total_processes INTEGER DEFAULT 0,
    cluster_cpu_load INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
