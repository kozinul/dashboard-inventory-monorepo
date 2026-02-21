import { Request, Response, NextFunction } from 'express';
import Rental from '../models/rental.model.js';
import { Asset } from '../models/asset.model.js';

export const createRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // RBAC: Check if user can rent this asset (department check)
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const asset = await Asset.findById(req.body.assetId);
            const deptIds: string[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId.toString());
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments.map((id: any) => id.toString()));
            }
            if (!asset || !deptIds.includes(asset.departmentId?.toString() || '')) {
                return res.status(403).json({ message: 'You can only rent assets from your department' });
            }
        }

        const rental = new Rental({
            ...req.body,
            // Set branchId based on user role
            branchId: req.user.role === 'superuser'
                ? (req.body.branchId || (req.user as any).branchId)
                : (req.user as any).branchId
        });
        await rental.save();
        // Populate references for the response
        await rental.populate(['assetId', 'userId', 'eventId']);
        res.status(201).json(rental);
    } catch (error) {
        next(error);
    }
};

export const getRentals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let rentals = await Rental.find()
            .populate('assetId')
            .populate('userId')
            .populate('eventId')
            .sort({ rentalDate: -1 });

        // Filter by branch
        if (req.user.role !== 'superuser') {
            rentals = rentals.filter((r: any) => r.branchId?.toString() === (req.user as any).branchId?.toString());
        } else if (req.query.branchId && req.query.branchId !== 'ALL') {
            rentals = rentals.filter((r: any) => r.branchId?.toString() === req.query.branchId);
        }

        // RBAC: Filter by department for non-admin users
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const deptIds: string[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId.toString());
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments.map((id: any) => id.toString()));
            }
            if (deptIds.length > 0) {
                rentals = rentals.filter((rental: any) => {
                    const asset = rental.assetId as any;
                    return deptIds.includes(asset?.departmentId?.toString() || '');
                });
            } else {
                return res.json([]);
            }
        }

        res.status(200).json(rentals);
    } catch (error) {
        next(error);
    }
};

export const getRentalById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findById(id)
            .populate('assetId')
            .populate('userId')
            .populate('eventId');

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }

        // RBAC: Check if user can access this rental
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            const asset = rental.assetId as any;
            const deptIds: string[] = [];
            if (req.user.departmentId) deptIds.push(req.user.departmentId.toString());
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                deptIds.push(...(req.user as any).managedDepartments.map((id: any) => id.toString()));
            }
            if (!deptIds.includes(asset?.departmentId?.toString() || '')) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.status(200).json(rental);
    } catch (error) {
        next(error);
    }
};

export const updateRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findByIdAndUpdate(id, req.body, { new: true })
            .populate('assetId')
            .populate('userId')
            .populate('eventId');

        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }
        res.status(200).json(rental);
    } catch (error) {
        next(error);
    }
};

export const deleteRental = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const rental = await Rental.findByIdAndDelete(id);
        if (!rental) {
            return res.status(404).json({ message: 'Rental not found' });
        }
        res.status(200).json({ message: 'Rental deleted successfully' });
    } catch (error) {
        next(error);
    }
};
