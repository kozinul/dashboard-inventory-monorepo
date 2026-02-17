import express from 'express';
import { createLocation, deleteLocation, getLocationById, getLocations, updateLocation } from '../controllers/location.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getLocations);
router.get('/:id', getLocationById);
router.post('/', createLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

export const locationRoutes = router;
