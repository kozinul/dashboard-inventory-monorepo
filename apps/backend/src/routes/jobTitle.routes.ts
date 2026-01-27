import express from 'express';
import {
    getJobTitles,
    createJobTitle,
    updateJobTitle,
    deleteJobTitle
} from '../controllers/jobTitle.controller.js';

const router = express.Router();

router.get('/', getJobTitles);
router.post('/', createJobTitle);
router.put('/:id', updateJobTitle);
router.delete('/:id', deleteJobTitle);

export default router;
