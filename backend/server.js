import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import si from 'systeminformation';
// routes
import nodeRoutes from './routes/nodes.js';
import processRoutes from './routes/processes.js';
import metricRoutes from './routes/metrics.js';

import { startMigrationEngine } from './services/migrationEngine.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
    }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/nodes', nodeRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/metrics', metricRoutes);

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = 5004;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startMigrationEngine(io);
});
