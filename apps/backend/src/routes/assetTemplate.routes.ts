import express from 'express';
import {
    getAssetTemplates,
    getAssetTemplateById,
    createAssetTemplate,
    updateAssetTemplate,
    deleteAssetTemplate,
    generateAssetsFromTemplate
} from '../controllers/assetTemplate.controller.js';

const router = express.Router();

router.route('/')
    .get(getAssetTemplates)
    .post(createAssetTemplate);

router.route('/:id')
    .get(getAssetTemplateById)
    .put(updateAssetTemplate)
    .delete(deleteAssetTemplate);

router.route('/:id/generate')
    .post(generateAssetsFromTemplate);

export default router;
