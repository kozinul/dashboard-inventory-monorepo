import { Router } from 'express';
import * as rentalController from '../controllers/rental.controller';

const router = Router();

router.post('/', rentalController.createRental);
router.get('/', rentalController.getRentals);
router.get('/:id', rentalController.getRentalById);
router.put('/:id', rentalController.updateRental);
router.delete('/:id', rentalController.deleteRental);

export default router;
