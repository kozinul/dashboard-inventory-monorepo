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
        if (req.user.role !== 'superuser') {
            baseFilter.branchId = req.user.branchId;
        }

        // 1. Search Assets
        const assetFilter = {
            ...baseFilter,
            $or: [
                { name: searchRegex },
                { assetTag: searchRegex },
                { serialNumber: searchRegex }
            ]
        };
        const assets = await Asset.find(assetFilter).limit(limit).select('name assetTag serialNumber');

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

        // 4. Search Supplies
        const supplyFilter = {
            ...baseFilter,
            $or: [
                { name: searchRegex }
            ]
        };
        const supplies = await Supply.find(supplyFilter).limit(limit).select('name code');

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
