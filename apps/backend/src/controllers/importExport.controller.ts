import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import { Asset } from '../models/asset.model.js';
import { Supply } from '../models/supply.model.js';
import { Branch } from '../models/branch.model.js';
import { Department } from '../models/department.model.js';
import { Location } from '../models/location.model.js';
import { Category } from '../models/category.model.js';
import { Unit } from '../models/unit.model.js';
import { Vendor } from '../models/vendor.model.js';
import { SupplyHistory } from '../models/supplyHistory.model.js';

// --- Templates ---

export const downloadTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.query; // 'asset' or 'supply'
        const customColumns = req.query.columns ? String(req.query.columns).split(',') : [];
        let headers: string[] = [];
        let filename = '';

        if (type === 'asset') {
            const allAssetHeaders: Record<string, string> = {
                name: 'Nama',
                model: 'Model',
                category: 'Kategori',
                serial: 'Serial',
                department: 'Departemen',
                branch: 'Cabang',
                location: 'Lokasi',
                status: 'Status',
                value: 'Nilai (Purchase Value)',
                purchaseDate: 'Tanggal Pembelian (YYYY-MM-DD)',
                warrantyDate: 'Kedaluwarsa Garansi (YYYY-MM-DD)'
            };

            if (customColumns.length > 0) {
                headers = customColumns.map(col => allAssetHeaders[col]).filter(Boolean);
            } else {
                headers = Object.values(allAssetHeaders);
            }
            filename = 'template_asset.xlsx';
        } else if (type === 'supply') {
            const allSupplyHeaders: Record<string, string> = {
                name: 'Nama',
                partNumber: 'Part Number',
                category: 'Kategori',
                unit: 'Satuan (Unit)',
                quantity: 'Jumlah',
                minimumStock: 'Stok Minimum',
                location: 'Lokasi',
                cost: 'Biaya',
                compatibleModels: 'Model Kompatibel'
            };

            if (customColumns.length > 0) {
                headers = customColumns.map(col => allSupplyHeaders[col]).filter(Boolean);
            } else {
                headers = Object.values(allSupplyHeaders);
            }
            filename = 'template_supply.xlsx';
        } else {
            return res.status(400).json({ message: 'Invalid template type' });
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(wb, ws, 'Template');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

// --- Export ---

export const exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.query;
        const customColumns = req.query.columns ? String(req.query.columns).split(',') : [];
        let data: any[] = [];
        let filename = '';

        const query: any = {};
        // RBAC: Scoping logic
        if (req.user && !['superuser', 'admin'].includes(req.user.role)) {
            if (req.user.departmentId) {
                query.departmentId = req.user.departmentId;
            } else {
                return res.status(403).json({ message: 'No department assigned' });
            }
        }

        if (req.user.role !== 'superuser') {
            query.branchId = (req.user as any).branchId;
        }

        if (type === 'asset') {
            const assets = await Asset.find(query)
                .populate('departmentId', 'name')
                .populate('branchId', 'name')
                .populate('locationId', 'name');

            data = assets.map(a => {
                const row: any = {};
                const map: Record<string, any> = {
                    name: a.name,
                    model: a.model,
                    category: a.category,
                    serial: a.serial,
                    department: (a.departmentId as any)?.name || a.department,
                    branch: (a.branchId as any)?.name,
                    location: (a.locationId as any)?.name || a.location,
                    status: a.status,
                    value: a.value,
                    purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split('T')[0] : '',
                    warrantyDate: a.warranty?.expirationDate ? a.warranty.expirationDate.toISOString().split('T')[0] : ''
                };

                const headerMap: Record<string, string> = {
                    name: 'Nama', model: 'Model', category: 'Kategori', serial: 'Serial',
                    department: 'Departemen', branch: 'Cabang', location: 'Lokasi',
                    status: 'Status', value: 'Nilai (Purchase Value)',
                    purchaseDate: 'Tanggal Pembelian', warrantyDate: 'Kedaluwarsa Garansi'
                };

                if (customColumns.length > 0) {
                    customColumns.forEach(col => {
                        if (headerMap[col]) row[headerMap[col]] = map[col];
                    });
                } else {
                    Object.keys(headerMap).forEach(col => {
                        row[headerMap[col]] = map[col];
                    });
                }
                return row;
            });
            filename = 'export_assets.xlsx';
        } else if (type === 'supply') {
            const supplies = await Supply.find(query)
                .populate('locationId', 'name')
                .populate('unitId', 'name');

            data = supplies.map(s => {
                const row: any = {};
                const map: Record<string, any> = {
                    name: s.name,
                    partNumber: s.partNumber,
                    category: s.category,
                    unit: (s.unitId as any)?.name || s.unit,
                    quantity: s.quantity,
                    minimumStock: s.minimumStock,
                    location: (s.locationId as any)?.name || s.location,
                    cost: s.cost,
                    compatibleModels: s.compatibleModels?.join(', ')
                };

                const headerMap: Record<string, string> = {
                    name: 'Nama', partNumber: 'Part Number', category: 'Kategori',
                    unit: 'Satuan (Unit)', quantity: 'Jumlah', minimumStock: 'Stok Minimum',
                    location: 'Lokasi', cost: 'Biaya', compatibleModels: 'Model Kompatibel'
                };

                if (customColumns.length > 0) {
                    customColumns.forEach(col => {
                        if (headerMap[col]) row[headerMap[col]] = map[col];
                    });
                } else {
                    Object.keys(headerMap).forEach(col => {
                        row[headerMap[col]] = map[col];
                    });
                }
                return row;
            });
            filename = 'export_supplies.xlsx';
        }

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, 'Data');

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

// --- Import ---

export const importData = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type } = req.query;
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
            return res.status(400).json({ message: 'Excel file is empty' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        // Cache for resolving names to IDs
        const cache = {
            departments: new Map<string, string>(),
            branches: new Map<string, string>(),
            locations: new Map<string, string>(),
            categories: new Map<string, string>(),
            units: new Map<string, string>()
        };

        const branchId = (req.user as any).branchId;
        const userDeptId = req.user.departmentId;

        if (type === 'asset') {
            for (const row of rows) {
                try {
                    // Resolve Relations
                    let deptId = userDeptId;
                    if (['superuser', 'admin'].includes(req.user.role) && row['Departemen']) {
                        const name = row['Departemen'].trim();
                        if (!cache.departments.has(name)) {
                            const d = await Department.findOne({ name: new RegExp(`^${name}$`, 'i') });
                            if (d) cache.departments.set(name, d._id.toString());
                        }
                        if (cache.departments.has(name)) deptId = cache.departments.get(name);
                    }

                    let bId = branchId;
                    if (req.user.role === 'superuser' && row['Cabang']) {
                        const name = row['Cabang'].trim();
                        if (!cache.branches.has(name)) {
                            const b = await Branch.findOne({ name: new RegExp(`^${name}$`, 'i') });
                            if (b) cache.branches.set(name, b._id.toString());
                        }
                        if (cache.branches.has(name)) bId = cache.branches.get(name);
                    }

                    let locId = undefined;
                    if (row['Lokasi']) {
                        const name = row['Lokasi'].trim();
                        if (!cache.locations.has(name)) {
                            const l = await Location.findOne({ name: new RegExp(`^${name}$`, 'i') });
                            if (l) cache.locations.set(name, l._id.toString());
                        }
                        if (cache.locations.has(name)) locId = cache.locations.get(name);
                    }

                    const assetData = {
                        name: row['Nama'],
                        model: row['Model'],
                        category: row['Kategori'],
                        serial: row['Serial'],
                        departmentId: deptId,
                        branchId: bId,
                        locationId: locId,
                        location: row['Lokasi'],
                        status: row['Status']?.toLowerCase() || 'active',
                        value: Number(row['Nilai (Purchase Value)']) || 0,
                        purchaseDate: row['Tanggal Pembelian (YYYY-MM-DD)'] ? new Date(row['Tanggal Pembelian (YYYY-MM-DD)']) : undefined,
                        warranty: {
                            expirationDate: row['Kedaluwarsa Garansi (YYYY-MM-DD)'] ? new Date(row['Kedaluwarsa Garansi (YYYY-MM-DD)']) : undefined
                        }
                    };

                    const asset = new Asset(assetData);
                    await asset.save();
                    results.success++;
                } catch (err: any) {
                    results.failed++;
                    results.errors.push(`Row ${rows.indexOf(row) + 2}: ${err.message}`);
                }
            }
        } else if (type === 'supply') {
            for (const row of rows) {
                try {
                    let locId = undefined;
                    if (row['Lokasi']) {
                        const name = row['Lokasi'].trim();
                        if (!cache.locations.has(name)) {
                            const l = await Location.findOne({ name: new RegExp(`^${name}$`, 'i') });
                            if (l) cache.locations.set(name, l._id.toString());
                        }
                        if (cache.locations.has(name)) locId = cache.locations.get(name);
                    }

                    let unitId = undefined;
                    if (row['Satuan (Unit)']) {
                        const name = row['Satuan (Unit)'].trim();
                        if (!cache.units.has(name)) {
                            const u = await Unit.findOne({ name: new RegExp(`^${name}$`, 'i') });
                            if (u) cache.units.set(name, u._id.toString());
                        }
                        if (cache.units.has(name)) unitId = cache.units.get(name);
                    }

                    const supplyData = {
                        name: row['Nama'],
                        partNumber: row['Part Number'],
                        category: row['Kategori'],
                        unit: row['Satuan (Unit)'] || 'Pcs',
                        unitId: unitId,
                        quantity: Number(row['Jumlah']) || 0,
                        minimumStock: Number(row['Stok Minimum']) || 1,
                        locationId: locId,
                        location: row['Lokasi'],
                        cost: Number(row['Biaya']) || 0,
                        compatibleModels: row['Model Kompatibel'] ? row['Model Kompatibel'].split(',').map((s: string) => s.trim()) : [],
                        branchId: branchId,
                        departmentId: userDeptId
                    };

                    const supply = new Supply(supplyData);
                    await supply.save();

                    // Create initial history
                    await SupplyHistory.create({
                        supplyId: supply._id,
                        action: 'IMPORT',
                        quantityChange: supply.quantity,
                        newStock: supply.quantity,
                        notes: 'Imported from Excel'
                    });

                    results.success++;
                } catch (err: any) {
                    results.failed++;
                    results.errors.push(`Row ${rows.indexOf(row) + 2}: ${err.message}`);
                }
            }
        }

        res.json({
            message: `Import completed: ${results.success} succeeded, ${results.failed} failed.`,
            results
        });
    } catch (error) {
        next(error);
    }
};
