import express from 'express';
import {
    createSupply,
    getAllSupplies,
    getSupplyById,
    updateSupply,
    deleteSupply,
    getSupplyHistory
} from '../controllers/supply.controller.js';

const router = express.Router();

router.post('/', createSupply);
router.get('/', getAllSupplies);
router.get('/:id', getSupplyById);
router.patch('/:id', updateSupply);
router.delete('/:id', deleteSupply);
router.get('/:id/history', getSupplyHistory);

export default router;
