import express from 'express';
import { getProcesses, spawnProcess, migrateProcess } from '../controllers/processes.js';

const router = express.Router();

router.get('/', getProcesses);
router.post('/', spawnProcess);
router.put('/migrate', migrateProcess);

export default router;
