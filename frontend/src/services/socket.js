import { io } from 'socket.io-client';

// Auto-detect if we are running locally (in Anti-Gravity) or on the public web
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const URL = isLocal ? 'http://localhost:5004' : 'https://nodemaster-simulator.onrender.com';

export const socket = io(URL, {
    autoConnect: true,
});
