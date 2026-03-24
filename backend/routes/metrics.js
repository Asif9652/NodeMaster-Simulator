import express from 'express';
import { getMetrics, getMigrations } from '../controllers/metrics.js';

const router = express.Router();

router.get('/', getMetrics);
router.get('/migrations', getMigrations);

export default router;
