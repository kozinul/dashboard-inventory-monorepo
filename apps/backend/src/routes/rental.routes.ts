import { Router } from 'express';
import * as rentalController from '../controllers/rental.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', rentalController.createRental);
router.get('/', rentalController.getRentals);
router.get('/:id', rentalController.getRentalById);
router.put('/:id', rentalController.updateRental);
router.delete('/:id', rentalController.deleteRental);

export default router;
