import { Request, Response, NextFunction } from 'express';
import { AssetTemplate } from '../models/assetTemplate.model.js';
import { Asset } from '../models/asset.model.js';

export const getAssetTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const templates = await AssetTemplate.find()
            .sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        next(error);
    }
};

export const getAssetTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const template = await AssetTemplate.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Asset template not found' });
        }
        res.json(template);
    } catch (error) {
        next(error);
    }
};

export const createAssetTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { code, name, model, category, defaultValue, technicalSpecifications, serialPrefix, images } = req.body;

        // Check for duplicate code
        const existingTemplate = await AssetTemplate.findOne({ code });
        if (existingTemplate) {
            res.status(400);
            throw new Error('Template with this code already exists');
        }

        const template = await AssetTemplate.create({
            code,
            name,
            model,
            category,
            defaultValue,
            technicalSpecifications,
            serialPrefix,
            images: images || []
        });

        res.status(201).json(template);
    } catch (error) {
        next(error);
    }
};

export const updateAssetTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const template = await AssetTemplate.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!template) {
            res.status(404);
            throw new Error('Asset template not found');
        }

        res.json(template);
    } catch (error) {
        next(error);
    }
};

export const deleteAssetTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const template = await AssetTemplate.findById(id);

        if (!template) {
            res.status(404);
            throw new Error('Asset template not found');
        }

        await template.deleteOne();
        res.json({ message: 'Asset template removed' });
    } catch (error) {
        next(error);
    }
};

export const generateAssetsFromTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { quantity, startingSerial, departmentId, department, locationId, location, status, purchaseDate } = req.body;

        const template = await AssetTemplate.findById(id);
        if (!template) {
            res.status(404);
            throw new Error('Asset template not found');
        }

        const createdAssets = [];
        let currentSerialNumber = template.lastSerialNumber || 0;

        for (let i = 0; i < quantity; i++) {
            currentSerialNumber++;
            const serialNumber = startingSerial
                ? `${startingSerial}-${String(i + 1).padStart(3, '0')}`
                : `${template.serialPrefix}${String(currentSerialNumber).padStart(4, '0')}`;

            const assetData = {
                name: template.name,
                model: template.model,
                category: template.category,
                serial: serialNumber,
                value: template.defaultValue,
                technicalSpecifications: template.technicalSpecifications,
                images: template.images || [],
                departmentId,
                department,
                locationId,
                location,
                branchId: req.body.branchId || (req.user as any).branchId,
                status: status || 'storage',
                purchaseDate: purchaseDate || new Date()
            };

            const asset = await Asset.create(assetData);
            createdAssets.push(asset);
        }

        // Update the lastSerialNumber on template
        template.lastSerialNumber = currentSerialNumber;
        await template.save();

        res.status(201).json({
            message: `Successfully created ${quantity} assets`,
            assets: createdAssets
        });
    } catch (error) {
        next(error);
    }
};

export const cloneAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { serial } = req.body;

        if (!serial) {
            res.status(400);
            throw new Error('Serial number is required for clone');
        }

        const originalAsset = await Asset.findById(id);
        if (!originalAsset) {
            res.status(404);
            throw new Error('Original asset not found');
        }

        // Check if serial already exists
        const existingAsset = await Asset.findOne({ serial });
        if (existingAsset) {
            res.status(400);
            throw new Error('An asset with this serial number already exists');
        }

        const clonedAsset = await Asset.create({
            name: originalAsset.name,
            model: originalAsset.model,
            category: originalAsset.category,
            serial,
            value: originalAsset.value,
            technicalSpecifications: originalAsset.technicalSpecifications,
            images: [], // Don't clone images
            status: 'active', // Cloned assets are set to active by default
            departmentId: originalAsset.departmentId,
            department: originalAsset.department,
            branchId: originalAsset.branchId,
            purchaseDate: new Date()
        });

        res.status(201).json(clonedAsset);
    } catch (error) {
        next(error);
    }
};

export const bulkCloneAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { serials } = req.body;

        if (!serials || !Array.isArray(serials) || serials.length === 0) {
            res.status(400);
            throw new Error('An array of serial numbers is required for bulk clone');
        }

        const originalAsset = await Asset.findById(id);
        if (!originalAsset) {
            res.status(404);
            throw new Error('Original asset not found');
        }

        // Check if any serial already exists
        const existingAssets = await Asset.find({ serial: { $in: serials } });
        if (existingAssets.length > 0) {
            const existingSerials = existingAssets.map(a => a.serial).join(', ');
            res.status(400);
            throw new Error(`The following serial numbers already exist: ${existingSerials}`);
        }

        const assetsToCreate = serials.map(serial => ({
            name: originalAsset.name,
            model: originalAsset.model,
            category: originalAsset.category,
            serial,
            value: originalAsset.value,
            technicalSpecifications: originalAsset.technicalSpecifications,
            images: [], // Don't clone images
            status: 'active', // Cloned assets are set to active by default
            departmentId: originalAsset.departmentId,
            department: originalAsset.department,
            branchId: originalAsset.branchId,
            purchaseDate: new Date()
        }));

        const clonedAssets = await Asset.insertMany(assetsToCreate);

        res.status(201).json({
            message: `Successfully cloned ${clonedAssets.length} assets`,
            assets: clonedAssets
        });
    } catch (error) {
        next(error);
    }
};
