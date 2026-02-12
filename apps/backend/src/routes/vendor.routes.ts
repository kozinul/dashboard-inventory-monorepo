import express from 'express';
import { vendorController } from '../controllers/vendor.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getOne);
router.post('/', vendorController.create);
router.put('/:id', vendorController.update);
router.delete('/:id', vendorController.delete);

export default router;
