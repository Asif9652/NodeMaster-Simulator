import { io } from 'socket.io-client';

// Use same host if running in production, or localhost:5004 in dev
const URL = 'http://localhost:5004';
export const socket = io(URL, {
    autoConnect: true,
});
