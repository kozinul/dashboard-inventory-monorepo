import express from 'express';
import { createLocationType, deleteLocationType, getLocationTypes, updateLocationType } from '../controllers/locationType.controller.js';

const router = express.Router();

router.get('/', getLocationTypes);
router.post('/', createLocationType);
router.put('/:id', updateLocationType);
router.delete('/:id', deleteLocationType);

export const locationTypeRoutes = router;
