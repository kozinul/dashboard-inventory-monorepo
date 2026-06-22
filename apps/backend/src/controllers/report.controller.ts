import { Request, Response, NextFunction } from 'express';
import { SupplyHistory } from '../models/supplyHistory.model.js';
import { Supply } from '../models/supply.model.js';
import { Assignment } from '../models/assignment.model.js';
import { Transfer } from '../models/transfer.model.js';
import { Asset } from '../models/asset.model.js';
import { AuditLog } from '../models/auditLog.model.js';
import * as XLSX from 'xlsx';

const fmtDate = (d: Date) => {
    const dt = new Date(d);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const getBranchFilter = (req: Request) => {
    const { branchId } = req.query;
    if (req.user.role !== 'superuser') {
        return (req.user as any).branchId;
    }
    return branchId && branchId !== 'ALL' ? branchId : null;
};

export const getSupplyMutationReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, departmentId, itemType } = req.query;
        const branchFilter = getBranchFilter(req);

        const dateMatch: any = {};
        if (startDate && endDate) {
            const end = new Date(endDate as string);
            end.setDate(end.getDate() + 1);
            dateMatch.createdAt = {
                $gte: new Date(startDate as string),
                $lt: end
            };
        }

        // ── 1. Supply History ──
        const supplyQuery: any = {};
        if (req.user.role !== 'superuser') {
            supplyQuery.branchId = (req.user as any).branchId;
            if (!['admin', 'system_admin'].includes(req.user.role) && req.user.departmentId) {
                supplyQuery.departmentId = req.user.departmentId;
            }
        } else if (branchFilter) {
            supplyQuery.branchId = branchFilter;
        }
        if (departmentId) supplyQuery.departmentId = departmentId;

        const suppliesScope = await Supply.find(supplyQuery).select('_id');
        const supplyIds = suppliesScope.map(s => s._id);

        const supplyHistory = supplyIds.length > 0
            ? await SupplyHistory.find({ ...dateMatch, supplyId: { $in: supplyIds } })
                .sort({ createdAt: -1 })
                .populate('supplyId', 'name partNumber category')
                .populate('userId', 'name')
                .populate('fromLocation', 'name')
                .populate('toLocation', 'name')
            : [];

        const supplyRows = supplyHistory.map(h => {
            const supply = h.supplyId as any;
            const user = h.userId as any;
            const fromLoc = h.fromLocation as any;
            const toLoc = h.toLocation as any;
            return {
                _id: h._id,
                createdAt: h.createdAt,
                itemName: supply?.name || 'Unknown',
                itemType: 'Supply',
                partNumber: supply?.partNumber || '-',
                action: h.action,
                fromLocation: fromLoc?.name || null,
                toLocation: toLoc?.name || null,
                userName: user?.name || 'System',
                userId: h.userId?._id || null,
                notes: h.notes || '',
                previousStock: h.previousStock,
                quantityChange: h.quantityChange,
                newStock: h.newStock
            };
        });

        // ── 2. Asset Activities (Assignments, Transfers, AuditLog) ──
        const assetFilter: any = {};
        if (req.user.role !== 'superuser') {
            assetFilter.branchId = (req.user as any).branchId;
            if (!['admin', 'system_admin'].includes(req.user.role) && req.user.departmentId) {
                assetFilter.departmentId = req.user.departmentId;
            }
        } else if (branchFilter) {
            assetFilter.branchId = branchFilter;
        }
        if (departmentId) assetFilter.departmentId = departmentId;

        const assetsScope = await Asset.find(assetFilter).select('_id name serial');
        const assetIds = assetsScope.map(a => a._id);
        const assetRows: any[] = [];
        const seenKeys = new Set<string>();

        if (assetIds.length > 0) {
            const assetIdStrs = assetIds.map(id => id.toString());

            // ── 2a. Assignments ──
            const assignments = await Assignment.find({
                ...dateMatch,
                assetId: { $in: assetIds },
                isDeleted: { $ne: true }
            })
                .sort({ createdAt: -1 })
                .populate('assetId', 'name serial')
                .populate('userId', 'name')
                .populate('locationId', 'name');

            for (const a of assignments) {
                const ass = a.assetId as any;
                const key = `assign_${a._id}`;
                seenKeys.add(key);
                const loc = a.locationId as any;
                assetRows.push({
                    _id: key,
                    createdAt: a.createdAt,
                    itemName: ass?.name || 'Unknown Asset',
                    itemType: 'Asset',
                    serial: ass?.serial || '-',
                    action: a.status === 'returned' ? 'RETURN' : 'ASSIGN',
                    fromLocation: null,
                    toLocation: loc?.name || null,
                    userName: (a.userId as any)?.name || a.assignedTo || 'System',
                    notes: a.notes || `Assigned to ${a.assignedTo || (a.userId as any)?.name || 'user'}`,
                    previousStock: null, quantityChange: null, newStock: null
                });
            }

            // ── 2b. Transfers ──
            const transfers = await Transfer.find({
                ...dateMatch,
                assetId: { $in: assetIds }
            })
                .sort({ createdAt: -1 })
                .populate('assetId', 'name serial')
                .populate('requestedBy', 'name')
                .populate('fromDepartmentId', 'name')
                .populate('toDepartmentId', 'name')
                .populate('fromBranchId', 'name')
                .populate('toBranchId', 'name');

            for (const t of transfers) {
                const ass = t.assetId as any;
                const key = `transfer_${t._id}`;
                seenKeys.add(key);
                const from = (t.fromDepartmentId as any)?.name || (t.fromBranchId as any)?.name || 'Unknown';
                const to = (t.toDepartmentId as any)?.name || (t.toBranchId as any)?.name || 'Unknown';
                assetRows.push({
                    _id: key,
                    createdAt: t.createdAt || t.transferDate,
                    itemName: ass?.name || 'Unknown Asset',
                    itemType: 'Asset',
                    serial: ass?.serial || '-',
                    action: 'TRANSFER',
                    fromLocation: from,
                    toLocation: to,
                    userName: (t.requestedBy as any)?.name || 'System',
                    notes: t.notes || `Transfer from ${from} to ${to}`,
                    previousStock: null, quantityChange: null, newStock: null
                });
            }

            // ── 2c. AuditLog for other Asset activities ──
            const auditActions = ['create', 'update', 'delete'];
            const auditLogs = await AuditLog.find({
                ...dateMatch,
                resourceType: 'Asset',
                resourceId: { $in: assetIdStrs },
                action: { $in: auditActions }
            })
                .sort({ createdAt: -1 })
                .populate('userId', 'name');

            for (const log of auditLogs) {
                const key = `audit_${log._id}`;
                if (seenKeys.has(key)) continue;
                seenKeys.add(key);

                const asset = assetsScope.find(a => a._id.toString() === log.resourceId);
                const user = log.userId as any;

                let action = 'UPDATE';
                if (log.action === 'create') action = 'CREATE';
                else if (log.action === 'delete') action = 'DELETE';

                assetRows.push({
                    _id: key,
                    createdAt: log.createdAt,
                    itemName: log.resourceName || asset?.name || 'Unknown Asset',
                    itemType: 'Asset',
                    serial: (asset as any)?.serial || '-',
                    action,
                    fromLocation: null,
                    toLocation: null,
                    userName: user?.name || 'System',
                    notes: log.details || '',
                    previousStock: null, quantityChange: null, newStock: null
                });
            }
        }

        // ── 3. Combine & Sort ──
        const combined = [...supplyRows, ...assetRows].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (itemType && itemType !== 'ALL') {
            return res.json(combined.filter(c => c.itemType === itemType));
        }

        res.json(combined);
    } catch (error) {
        next(error);
    }
};

export const exportSupplyMutationExcel = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { startDate, endDate, departmentId } = req.query;
        const branchFilter = getBranchFilter(req);

        const dateMatch: any = {};
        if (startDate && endDate) {
            const end = new Date(endDate as string);
            end.setDate(end.getDate() + 1);
            dateMatch.createdAt = {
                $gte: new Date(startDate as string),
                $lt: end
            };
        }

        const supplyQuery: any = {};
        if (req.user.role !== 'superuser') {
            supplyQuery.branchId = (req.user as any).branchId;
            if (!['admin', 'system_admin'].includes(req.user.role) && req.user.departmentId) {
                supplyQuery.departmentId = req.user.departmentId;
            }
        } else if (branchFilter) {
            supplyQuery.branchId = branchFilter;
        }
        if (departmentId) supplyQuery.departmentId = departmentId;

        const suppliesScope = await Supply.find(supplyQuery).select('_id');
        const supplyIds = suppliesScope.map(s => s._id);

        const supplyHistory = supplyIds.length > 0
            ? await SupplyHistory.find({ ...dateMatch, supplyId: { $in: supplyIds } })
                .sort({ createdAt: -1 })
                .populate('supplyId', 'name partNumber category')
                .populate('userId', 'name')
                .populate('fromLocation', 'name')
                .populate('toLocation', 'name')
            : [];

        const rows = supplyHistory.map(h => {
            const supply = h.supplyId as any;
            const user = h.userId as any;
            const fromLoc = h.fromLocation as any;
            const toLoc = h.toLocation as any;
            return {
                Date: fmtDate(h.createdAt),
                'Item Name': supply?.name || 'Unknown',
                'Part Number': supply?.partNumber || '-',
                Type: 'Supply',
                Action: h.action,
                'From Location': fromLoc?.name || '-',
                'To Location': toLoc?.name || '-',
                User: user?.name || 'System',
                'Previous Stock': h.previousStock ?? '-',
                Change: h.quantityChange ?? '-',
                'New Stock': h.newStock ?? '-',
                Notes: h.notes || ''
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Mutation Report');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Item_Mutation_Report_${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};