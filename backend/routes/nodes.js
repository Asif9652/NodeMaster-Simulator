import express from 'express';
import { getNodes, createNode, deleteNode } from '../controllers/nodes.js';
const router = express.Router();

router.get('/', getNodes);
router.post('/', createNode);
router.delete('/:id', deleteNode);

export default router;
