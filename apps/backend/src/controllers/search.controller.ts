import { Request, Response, NextFunction } from 'express';
import { Asset } from '../models/asset.model.js';
import { User } from '../models/user.model.js';
import { Location } from '../models/location.model.js';
import { Supply } from '../models/supply.model.js';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.json({ assets: [], users: [], locations: [], supplies: [] });
        }

        const searchRegex = new RegExp(q, 'i');
        const limit = 5;

        // RBAC Base Filters
        const baseFilter: any = {};
        if (req.user && req.user.role !== 'superuser') {
            baseFilter.branchId = req.user.branchId;
        }

        // Department filtering: system_admin sees all departments
        if (req.user && req.user.role !== 'superuser' && req.user.role !== 'system_admin') {
            const deptIds: any[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId);
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments);
            }
            if (deptIds.length > 0) {
                baseFilter.departmentId = { $in: deptIds };
            }
        }

        // 1. Search Assets
        const assetFilter = {
            ...baseFilter,
            $or: [
                { name: searchRegex },
                { alias: searchRegex },
                { serial: searchRegex },
                { model: searchRegex }
            ]
        };
        const assets = await Asset.find(assetFilter).limit(limit).select('name alias serial model');

        // 2. Search Users
        const userFilter = {
            ...baseFilter,
            $or: [
                { name: searchRegex },
                { username: searchRegex },
                { email: searchRegex }
            ]
        };
        const users = await User.find(userFilter).limit(limit).select('name username avatarUrl');

        // 3. Search Locations
        const locationFilter = {
            ...baseFilter,
            $or: [
                { name: searchRegex },
                { code: searchRegex }
            ]
        };
        const locations = await Location.find(locationFilter).limit(limit).select('name code type');

        // 4. Search Supplies (handle null branchId separately)
        const supplyFilter: any = {
            $or: [
                { name: searchRegex },
                { partNumber: searchRegex }
            ]
        };
        if (req.user && req.user.role !== 'superuser') {
            supplyFilter.$and = [
                { $or: [
                    { branchId: req.user.branchId },
                    { branchId: null },
                    { branchId: { $exists: false } }
                ]}
            ];
        }
        const supplies = await Supply.find(supplyFilter).limit(limit).select('name partNumber');

        res.json({
            assets,
            users,
            locations,
            supplies
        });
    } catch (error) {
        next(error);
    }
};
