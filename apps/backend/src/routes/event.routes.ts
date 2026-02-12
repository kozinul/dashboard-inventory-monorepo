import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';

import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.get('/asset/:assetId', eventController.getEventsByAsset);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

export default router;
