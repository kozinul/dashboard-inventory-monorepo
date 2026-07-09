import { Request, Response, NextFunction } from 'express';
import { StockOpname } from '../models/stockOpname.model.js';
import { StockOpnameItem } from '../models/stockOpnameItem.model.js';
import { Supply } from '../models/supply.model.js';
import { Asset } from '../models/asset.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Assignment } from '../models/assignment.model.js';
import { recordAuditLog } from '../utils/logger.js';
import * as XLSX from 'xlsx';

// 1. Create SO Campaign
export const createStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, locationId, departmentId, type, notes } = req.body;
        const branchId = (req.user as any).branchId || req.body.branchId;

        const so = new StockOpname({
            title,
            branchId,
            locationId,
            departmentId,
            type: type || 'SUPPLY',
            status: 'DRAFT',
            notes,
            createdBy: req.user._id
        });

        await so.save();

        await recordAuditLog({
            userId: req.user._id,
            action: 'create',
            resourceType: 'StockOpname',
            resourceId: so._id.toString(),
            resourceName: title,
            details: `Created Draft Stock Opname: ${title}`,
            branchId: branchId?.toString()
        });

        res.status(201).json(so);
    } catch (error) {
        next(error);
    }
};

// 2. Get List of SO
export const getStockOpnames = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const branchId = (req.user as any).branchId;
        const query: any = {};
        
        if (req.user && req.user.role !== 'superuser') {
            query.branchId = branchId;
            // system_admin sees all departments, others restricted
            if (req.user.role !== 'system_admin') {
                if (req.user.departmentId) {
                    query.departmentId = req.user.departmentId;
                }
            }
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            query.branchId = req.query.branchId;
        }

        const list = await StockOpname.find({ ...query, status: { $ne: 'CANCELLED' } })
            .sort({ createdAt: -1 })
            .populate('locationId', 'name')
            .populate('departmentId', 'name')
            .populate('createdBy', 'name');

        res.json(list);
    } catch (error) {
        next(error);
    }
};

// 3. Get Detail SO & its items
export const getStockOpnameDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id)
            .populate('locationId', 'name')
            .populate('departmentId', 'name')
            .populate('createdBy', 'name');

        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });

        const items = await StockOpnameItem.find({ stockOpnameId: so._id })
            .populate({
                path: 'supplyId',
                select: 'name partNumber category quantity locationId',
                populate: { path: 'locationId', select: 'name' }
            })
            .populate({
                path: 'assetId',
                select: 'name serial model category status locationId',
                populate: { path: 'locationId', select: 'name' }
            })
            .populate('checkedBy', 'name')
            .lean();

        const assetIds: string[] = [];
        for (const item of items) {
            if (item.assetId && typeof item.assetId === 'object' && item.assetId._id) {
                assetIds.push(item.assetId._id.toString());
            }
        }

        const assignments = assetIds.length > 0
            ? await Assignment.find({ assetId: { $in: assetIds }, status: 'assigned', isDeleted: { $ne: true } })
                .populate('userId', 'name username')
                .lean()
            : [];

        const itemsWithMeta = items.map((item: any) => {
            if (item.assetId && item.assetId._id) {
                const assetIdStr = item.assetId._id.toString();
                const assignment = assignments.find((a: any) => a.assetId?.toString() === assetIdStr);
                if (assignment) {
                    item.assignedUser = assignment.userId || { name: assignment.assignedTo };
                }
            }
            return item;
        });

        res.json({ so, items: itemsWithMeta });
    } catch (error) {
        next(error);
    }
};

// 4. Start SO (Lock System Qty)
export const startStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });
        if (so.status !== 'DRAFT') return res.status(400).json({ message: 'Can only start Draft SO' });

        // Generate snapshot based on scope
        const queryScope: any = { branchId: so.branchId };
        if (so.departmentId) queryScope.departmentId = so.departmentId;
        if (so.locationId) queryScope.locationId = so.locationId;

        const itemsToInsert = [];

        if (so.type === 'SUPPLY' || so.type === 'BOTH') {
            const supplies = await Supply.find({ ...queryScope });
            for (const supply of supplies) {
                itemsToInsert.push({
                    stockOpnameId: so._id,
                    supplyId: supply._id,
                    systemQuantity: supply.quantity || 0,
                    physicalQuantity: 0,
                    difference: -(supply.quantity || 0),
                    status: 'PENDING'
                });
            }
        }

        if (so.type === 'ASSET' || so.type === 'BOTH') {
            // Include active and storage assets
            const assets = await Asset.find({ ...queryScope, status: { $in: ['active', 'storage', 'in_use'] } });
            for (const asset of assets) {
                itemsToInsert.push({
                    stockOpnameId: so._id,
                    assetId: asset._id,
                    systemQuantity: 1,
                    physicalQuantity: 0, // 0 = Missing, 1 = Found
                    isAssetFound: false,
                    status: 'PENDING'
                });
            }
        }

        if (itemsToInsert.length > 0) {
            await StockOpnameItem.insertMany(itemsToInsert);
        }

        so.status = 'ONGOING';
        so.startDate = new Date();
        await so.save();

        res.json({ message: 'Stock Opname Started', so });
    } catch (error) {
        next(error);
    }
};

// 5. Update Item (Auditor Input)
export const verifyStockOpnameItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { physicalQuantity, isAssetFound, notes } = req.body;
        const item = await StockOpnameItem.findById(req.params.itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const so = await StockOpname.findById(item.stockOpnameId);
        if (!so || so.status !== 'ONGOING') return res.status(400).json({ message: 'Stock Opname is not ongoing' });

        if (item.supplyId) {
            item.physicalQuantity = physicalQuantity;
            item.difference = physicalQuantity - item.systemQuantity;
            item.status = item.difference === 0 ? 'MATCH' : 'DISCREPANCY';
        } else if (item.assetId) {
            item.isAssetFound = isAssetFound;
            item.physicalQuantity = isAssetFound ? 1 : 0;
            item.difference = item.physicalQuantity - item.systemQuantity;
            item.status = isAssetFound ? 'MATCH' : 'MISSING';
        }

        item.notes = notes !== undefined ? notes : item.notes;
        item.checkedBy = req.user._id as any;
        await item.save();

        res.json(item);
    } catch (error) {
        next(error);
    }
};

// 6. Request Review
export const setOpnameToReview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'SO not found' });
        if (so.status !== 'ONGOING') return res.status(400).json({ message: 'Only ONGOING SO can be reviewed' });

        so.status = 'REVIEW';
        await so.save();

        res.json({ message: 'Stock Opname moved to REVIEW status', so });
    } catch (error) {
        next(error);
    }
};

// 6b. Reopen (REVIEW → ONGOING)
export const reopenStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'SO not found' });
        if (so.status !== 'REVIEW') return res.status(400).json({ message: 'Only REVIEW SO can be reopened' });

        so.status = 'ONGOING';
        await so.save();

        res.json({ message: 'Stock Opname returned to ONGOING status', so });
    } catch (error) {
        next(error);
    }
};

// 7. Complete & Auto-Adjust
export const completeStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });
        if (so.status !== 'REVIEW') return res.status(400).json({ message: 'Only SO under REVIEW can be completed' });

        if (req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
            return res.status(403).json({ message: 'Not authorized to complete and adjust Stock Opname' });
        }

        const items = await StockOpnameItem.find({ stockOpnameId: so._id, status: { $in: ['DISCREPANCY', 'MISSING'] } });

        for (const item of items) {
            if (item.supplyId && item.difference !== 0) {
                const supply = await Supply.findById(item.supplyId);
                if (supply) {
                    const previous = supply.quantity;
                    supply.quantity = item.physicalQuantity;
                    await supply.save();

                    await SupplyHistory.create({
                        supplyId: supply._id,
                        action: 'ADJUST',
                        quantityChange: item.difference,
                        previousStock: previous,
                        newStock: supply.quantity,
                        userId: req.user._id,
                        notes: `SO Adjustment: ${so.title} (${item.notes || 'No note'})`
                    });
                }
            } else if (item.assetId && !item.isAssetFound) {
                const asset = await Asset.findById(item.assetId);
                if (asset) {
                    asset.activityLog.push({
                        action: 'audit',
                        details: `Asset marked missing during SO: ${so.title}. Notes: ${item.notes}`,
                        performedBy: req.user._id,
                        date: new Date()
                    });
                    await asset.save();
                }
            }
        }

        so.status = 'COMPLETED';
        so.endDate = new Date();
        so.approvedBy = req.user._id as any;
        await so.save();

        res.json({ message: 'Stock Opname Completed and Master Data Adjusted', so });
    } catch (error: any) {
        next(error);
    }
};

// 8. Delete SO (only superuser & admin)
export const deleteStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });

        if (so.status === 'ONGOING' || so.status === 'COMPLETED') {
            return res.status(400).json({ message: 'Cannot delete an ongoing or completed Stock Opname' });
        }

        await StockOpnameItem.deleteMany({ stockOpnameId: so._id });
        await StockOpname.findByIdAndDelete(req.params.id);

        await recordAuditLog({
            userId: req.user._id,
            action: 'delete',
            resourceType: 'StockOpname',
            resourceId: so._id.toString(),
            resourceName: so.title,
            details: `Deleted Stock Opname: ${so.title}`,
            branchId: so.branchId?.toString()
        });

        res.json({ message: 'Stock Opname deleted successfully' });
    } catch (error: any) {
        next(error);
    }
};

// 9. Export SO Items to Excel
export const exportStockOpnameExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });

        const items = await StockOpnameItem.find({ stockOpnameId: so._id })
            .populate({ path: 'supplyId', select: 'name partNumber category' })
            .populate({ path: 'assetId', select: 'name serial model' })
            .lean();

        const rows = items.map((item: any, i) => {
            const isSupply = !!item.supplyId;
            return {
                No: i + 1,
                'Item Name': item.supplyId?.name || item.assetId?.name || 'Unknown',
                Type: isSupply ? 'Supply' : 'Asset',
                'Part Number / Serial': isSupply ? (item.supplyId?.partNumber || '') : (item.assetId?.serial || ''),
                'System Quantity': item.systemQuantity,
                'Physical Quantity': isSupply ? item.physicalQuantity : (item.isAssetFound ? 1 : 0),
                'Found / Missing': isSupply ? '' : (item.isAssetFound ? 'Found' : 'Missing'),
                Difference: isSupply ? (item.physicalQuantity - item.systemQuantity) : (item.physicalQuantity - item.systemQuantity),
                Status: item.status,
                Notes: item.notes || ''
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        ws['!cols'] = [
            { wch: 4 }, { wch: 30 }, { wch: 8 }, { wch: 20 },
            { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 10 },
            { wch: 14 }, { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, ws, 'Stock Opname');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=SO_${so.title.replace(/\s+/g, '_')}_${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

// 11. Cleanup Stock Opname — force delete (for training/maintenance)
export const cleanupStockOpname = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { ids } = req.body;

        if (ids && Array.isArray(ids) && ids.length > 0) {
            await StockOpnameItem.deleteMany({ stockOpnameId: { $in: ids } });
            const result = await StockOpname.deleteMany({ _id: { $in: ids } });
            return res.json({
                message: `Deleted ${result.deletedCount} Stock Opname(s)`,
                deletedCount: result.deletedCount
            });
        }

        // Delete all
        const itemsResult = await StockOpnameItem.deleteMany({});
        const soResult = await StockOpname.deleteMany({});
        res.json({
            message: `Deleted ${soResult.deletedCount} Stock Opname(s) and ${itemsResult.deletedCount} item(s)`,
            deletedCount: soResult.deletedCount,
            itemsDeleted: itemsResult.deletedCount
        });
    } catch (error) {
        next(error);
    }
};

// 10. Import SO Items from Excel
export const importStockOpnameExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const so = await StockOpname.findById(req.params.id);
        if (!so) return res.status(404).json({ message: 'Stock Opname not found' });
        if (so.status !== 'ONGOING') return res.status(400).json({ message: 'Can only import for ONGOING Stock Opname' });

        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const dbItems = await StockOpnameItem.find({ stockOpnameId: so._id })
            .populate({ path: 'supplyId', select: 'name partNumber' })
            .populate({ path: 'assetId', select: 'name serial' });

        let updated = 0;
        let failed = 0;

        for (const row of rows) {
            const itemName = row['Item Name']?.toString().trim();
            const partNumber = row['Part Number / Serial']?.toString().trim();
            const physicalQty = parseInt(row['Physical Quantity']) || 0;
            const foundStr = row['Found / Missing']?.toString().trim().toLowerCase();
            const notes = row['Notes']?.toString().trim() || '';

            if (!itemName) { failed++; continue; }

            const item = dbItems.find((i: any) => {
                const name = i.supplyId?.name || i.assetId?.name || '';
                const code = i.supplyId?.partNumber || i.assetId?.serial || '';
                return name === itemName && (!partNumber || code === partNumber);
            });

            if (!item) { failed++; continue; }

            const isSupply = !!item.supplyId;

            if (isSupply) {
                item.physicalQuantity = physicalQty;
                item.difference = physicalQty - item.systemQuantity;
                item.status = item.difference === 0 ? 'MATCH' : 'DISCREPANCY';
            } else {
                const isFound = foundStr === 'found' || foundStr === 'yes' || physicalQty > 0;
                item.isAssetFound = isFound;
                item.physicalQuantity = isFound ? 1 : 0;
                item.difference = item.physicalQuantity - item.systemQuantity;
                item.status = isFound ? 'MATCH' : 'MISSING';
            }

            item.notes = notes || item.notes;
            item.checkedBy = req.user._id as any;
            await item.save();
            updated++;
        }

        res.json({ message: `Import completed: ${updated} updated, ${failed} failed`, updated, failed });
    } catch (error) {
        next(error);
    }
};
