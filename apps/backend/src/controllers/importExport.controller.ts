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
import { MaintenanceRecord } from '../models/maintenance.model.js';
import { Assignment } from '../models/assignment.model.js';
import Rental, { IRental } from '../models/rental.model.js';
import Event from '../models/event.model.js';
import PDFDocument from 'pdfkit-table';

const formatIDR = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(num);
};

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
        const {
            type,
            format = 'excel',
            branchId,
            departmentId,
            status,
            category,
            maintenanceType,
            groupBy,
            startDate,
            endDate
        } = req.query;
        const customColumns = req.query.columns ? String(req.query.columns).split(',') : [];
        let data: any[] = [];
        let filename = '';

        const query: any = {};

        // 1. RBAC: Branch handling
        if (req.user.role === 'superuser') {
            if (branchId) query.branchId = branchId;
        } else {
            // Admin, Manager, Technician are locked to their own branch
            query.branchId = (req.user as any).branchId;
        }

        // 2. RBAC & Selection: Department handling
        // For restricted dept roles, build array of dept IDs including managedDepartments
        const isRestrictedDept = !['superuser', 'admin', 'system_admin'].includes(req.user.role);
        let activeDeptIds: any[] = [];

        if (isRestrictedDept) {
            if (req.user.departmentId) activeDeptIds.push(req.user.departmentId);
            if ((req.user as any).managedDepartments && (req.user as any).managedDepartments.length > 0) {
                activeDeptIds.push(...(req.user as any).managedDepartments);
            }
        } else if (departmentId) {
            activeDeptIds = [departmentId];
        }

        if (activeDeptIds.length > 0) {
            if (type === 'asset' || type === 'supply') {
                query.departmentId = activeDeptIds.length === 1 ? activeDeptIds[0] : { $in: activeDeptIds };
            } else if (type === 'maintenance' || type === 'rental') {
                const deptAssets = await Asset.find({
                    departmentId: activeDeptIds.length === 1 ? activeDeptIds[0] : { $in: activeDeptIds },
                    branchId: query.branchId || { $exists: true }
                }).select('_id');
                const assetIds = deptAssets.map(a => a._id);

                if (type === 'rental') {
                    query.assetId = { $in: assetIds };
                } else if (type === 'maintenance') {
                    query.$or = [
                        { assignedDepartment: activeDeptIds.length === 1 ? activeDeptIds[0] : { $in: activeDeptIds } },
                        { asset: { $in: assetIds } }
                    ];
                }
            }
        }

        // 3. Generic Filters
        if (status && type !== 'supply') query.status = status;
        if (category) query.category = category;
        if (maintenanceType && type === 'maintenance') query.type = maintenanceType;

        // 4. Date Range Filtering
        if (startDate || endDate) {
            // Determine field name based on report type
            let dateField = 'createdAt';
            if (type === 'rental') dateField = 'rentalDate';
            else if (type === 'asset') dateField = 'purchaseDate';
            else if (type === 'maintenance' && status === 'Completed') dateField = 'updatedAt';

            query[dateField] = {};
            if (startDate) query[dateField].$gte = new Date(startDate as string);
            if (endDate) query[dateField].$lte = new Date(endDate as string);
        }

        let headerMap: Record<string, string> = {};
        let rawData: any[] = [];

        if (type === 'asset') {
            rawData = await Asset.find(query)
                .populate('departmentId', 'name')
                .populate('branchId', 'name')
                .populate('locationId', 'name');

            headerMap = {
                name: 'Nama', model: 'Model', category: 'Kategori', serial: 'Serial',
                department: 'Departemen', branch: 'Cabang', location: 'Lokasi',
                status: 'Status', assignment: 'Assignment', value: 'Nilai (IDR)',
                purchaseDate: 'Tgl Pembelian', lastUpdate: 'Terakhir Update'
            };

            // Fetch active assignments for these assets
            const assetIds = rawData.map(a => a._id);
            const activeAssignments = await Assignment.find({
                assetId: { $in: assetIds },
                status: 'assigned',
                isDeleted: false
            }).populate({
                path: 'userId',
                select: 'name departmentId',
                populate: { path: 'departmentId', select: 'name' }
            });

            const assignmentMap = new Map();
            activeAssignments.forEach(asgn => {
                assignmentMap.set(asgn.assetId.toString(), asgn);
            });

            data = rawData.map(a => {
                const asgn = assignmentMap.get(a._id.toString());
                const user = (asgn?.userId as any);
                const assignmentInfo = user ? `${user.name} (${user.departmentId?.name || 'N/A'})` : (asgn?.assignedTo || 'none');

                return {
                    name: a.name,
                    model: a.model,
                    category: a.category,
                    serial: a.serial,
                    department: (a.departmentId as any)?.name || a.department,
                    branch: (a.branchId as any)?.name,
                    location: (a.locationId as any)?.name || a.location,
                    status: a.status,
                    assignment: assignmentInfo,
                    value: a.value || 0,
                    purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toLocaleDateString('id-ID') : '-',
                    lastUpdate: a.updatedAt ? new Date(a.updatedAt).toLocaleDateString('id-ID') : '-'
                };
            });
            filename = `export_assets_${Date.now()}`;
        } else if (type === 'supply') {
            const supplies = await Supply.find(query)
                .populate('locationId', 'name')
                .populate('unitId', 'name')
                .populate('branchId', 'name')
                .populate('departmentId', 'name');

            const supplyIds = supplies.map(s => s._id);
            const historyQuery: any = { supplyId: { $in: supplyIds } };
            if (status) historyQuery.action = status; // Link status filter to history action
            if (startDate || endDate) {
                historyQuery.createdAt = {};
                if (startDate) historyQuery.createdAt.$gte = new Date(startDate as string);
                if (endDate) historyQuery.createdAt.$lte = new Date(endDate as string);
            }

            const historyRaw = await SupplyHistory.find(historyQuery)
                .populate('supplyId', 'name partNumber unitId unit category')
                .populate('userId', 'name')
                .sort({ createdAt: 1 });

            headerMap = {
                supply: 'Barang', sn: 'Part No', date: 'Tanggal',
                action: 'Aksi', change: 'Qty (+/-)', stock: 'Stok Sisa',
                user: 'User', notes: 'Catatan'
            };

            data = historyRaw.map(h => {
                const s = h.supplyId as any;
                return {
                    supply: s?.name || 'N/A',
                    sn: s?.partNumber || 'N/A',
                    date: h.createdAt ? h.createdAt.toLocaleString('id-ID', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }) : 'N/A',
                    action: h.action,
                    change: h.quantityChange || 0,
                    stock: h.newStock || 0,
                    user: (h.userId as any)?.name || 'N/A',
                    notes: h.notes || '-'
                };
            });
            filename = `export_supply_history_${Date.now()}`;
        } else if (type === 'maintenance') {
            rawData = await MaintenanceRecord.find(query)
                .populate('asset', 'name serial model')
                .populate('requestedBy', 'name')
                .populate('technician', 'name')
                .populate('vendor', 'name')
                .populate('suppliesUsed.supply', 'name')
                .populate('branchId', 'name')
                .populate('assignedDepartment', 'name');

            headerMap = {
                asset: 'Aset', model: 'Model', sn: 'Serial No', ticketNumber: 'No Tiket',
                title: 'Judul', date: 'Tgl Selesai', spareparts: 'Sparepart',
                pic: 'PIC/Vendor', internalNotes: 'Internal Notes', type: 'Tipe', cost: 'Biaya',
                status: 'Status', branch: 'Cabang'
            };

            // Fetch current assignments for assets in these maintenance records
            const assetIds = rawData.map(m => m.asset?._id).filter(Boolean);
            const activeAssignments = await Assignment.find({
                assetId: { $in: assetIds },
                status: 'assigned',
                isDeleted: false
            }).populate({
                path: 'userId',
                select: 'name departmentId',
                populate: { path: 'departmentId', select: 'name' }
            });

            const assignmentMap = new Map();
            activeAssignments.forEach(asgn => {
                assignmentMap.set(asgn.assetId.toString(), asgn);
            });

            data = rawData.map(m => {
                const assetId = m.asset?._id?.toString();
                const asgn = assetId ? assignmentMap.get(assetId) : null;
                const user = (asgn?.userId as any);

                const spareparts = (m.suppliesUsed || [])
                    .map((s: any) => `${(s.supply as any)?.name || s.name} (${s.quantity})`)
                    .join(', ');

                const picName = m.serviceProviderType === 'Vendor'
                    ? (m.vendor as any)?.name || 'Vendor'
                    : (m.technician as any)?.name || 'Internal';

                const internalNotes = (m.notes || []).map((n: any) => n.content).join('; ');

                return {
                    asset: (m.asset as any)?.name || 'N/A',
                    model: (m.asset as any)?.model || 'N/A',
                    sn: (m.asset as any)?.serial || 'N/A',
                    ticketNumber: m.ticketNumber,
                    title: m.title,
                    date: m.updatedAt ? m.updatedAt.toISOString().split('T')[0] : 'N/A',
                    spareparts: spareparts || '-',
                    pic: picName,
                    internalNotes: internalNotes || '-',
                    type: m.type,
                    cost: m.cost || 0,
                    status: m.status,
                    branch: (m.branchId as any)?.name || 'N/A'
                };
            });
            filename = `export_maintenance_${Date.now()}`;
        } else if (type === 'rental') {
            rawData = await Rental.find(query)
                .populate('assetId', 'name serial rentalRates')
                .populate('userId', 'name')
                .populate('eventId', 'name room')
                .populate('branchId', 'name');

            // Also fetch Event-based rentals
            const eventQuery: any = { branchId: query.branchId };
            let deptAssetIds: any[] = [];
            let deptSupplyIds: any[] = [];

            if (req.user.role !== 'superuser' && req.user.role !== 'admin') {
                const activeDeptId = req.user.departmentId;
                const [assets, supplies] = await Promise.all([
                    Asset.find({ departmentId: activeDeptId }).select('_id'),
                    Supply.find({ departmentId: activeDeptId }).select('_id')
                ]);
                deptAssetIds = assets.map(a => a._id.toString());
                deptSupplyIds = supplies.map(s => s._id.toString());

                eventQuery.$or = [
                    { 'rentedAssets.assetId': { $in: assets.map(a => a._id) } },
                    { 'planningSupplies.supplyId': { $in: supplies.map(s => s._id) } }
                ];
            } else if (query.assetId) {
                eventQuery['rentedAssets.assetId'] = query.assetId;
                deptAssetIds = Array.isArray(query.assetId.$in) ? query.assetId.$in.map((id: any) => id.toString()) : [query.assetId.toString()];
            }

            if (status) eventQuery.status = status;

            if (startDate || endDate) {
                eventQuery.startTime = {};
                if (startDate) eventQuery.startTime.$gte = new Date(startDate as string);
                if (endDate) eventQuery.startTime.$lte = new Date(endDate as string);
            }

            const events = await Event.find(eventQuery)
                .populate('rentedAssets.assetId', 'name serial rentalRates')
                .populate('planningSupplies.supplyId', 'name partNumber')
                .populate('branchId', 'name');

            headerMap = {
                event: 'Event', item: 'Nama Item', type: 'Tipe',
                venue: 'Venue', qty: 'Qty', price: 'Harga (IDR)',
                amount: 'Total (IDR)', rentalDate: 'Tgl Pinjam',
                returnDate: 'Estimasi Kembali', status: 'Status', branch: 'Cabang'
            };

            const directRentals = rawData.map(r => {
                const asset = r.assetId as any;
                const price = asset?.rentalRates?.[0]?.rate || 0;
                return {
                    event: (r.eventId as any)?.name || 'Direct Rental',
                    item: asset?.name || 'N/A',
                    type: 'Asset',
                    venue: (r.eventId as any)?.room || 'N/A',
                    qty: 1,
                    price: price,
                    amount: price,
                    rentalDate: r.rentalDate ? new Date(r.rentalDate).toLocaleDateString('id-ID') : '',
                    returnDate: r.expectedReturnDate ? new Date(r.expectedReturnDate).toLocaleDateString('id-ID') : '',
                    status: r.status,
                    branch: (r.branchId as any)?.name || 'N/A'
                };
            });

            const eventAssets = events.flatMap(ev => (ev.rentedAssets || []).map(ra => {
                const asset = ra.assetId as any;
                // If filtered by dept/asset, only show dept-owned assets in the event
                if (deptAssetIds.length > 0 && !deptAssetIds.includes(asset?._id?.toString())) {
                    return null;
                }

                const price = ra.rentalRate || 0;
                return {
                    event: ev.name,
                    item: asset?.name || 'N/A',
                    type: 'Asset',
                    venue: ev.room || 'N/A',
                    qty: 1,
                    price: price,
                    amount: price,
                    rentalDate: ev.startTime ? new Date(ev.startTime).toLocaleDateString('id-ID') : '',
                    returnDate: ev.endTime ? new Date(ev.endTime).toLocaleDateString('id-ID') : '',
                    status: ev.status,
                    branch: (ev.branchId as any)?.name || 'N/A'
                };
            })).filter(Boolean);

            const eventSupplies = events.flatMap(ev => (ev.planningSupplies || []).map(ps => {
                const supply = ps.supplyId as any;
                // If filtered by dept/supply, only show dept-owned supplies in the event
                if (deptSupplyIds.length > 0 && !deptSupplyIds.includes(supply?._id?.toString())) {
                    return null;
                }

                const price = ps.cost || 0;
                const amount = (ps.quantity || 0) * price;
                return {
                    event: ev.name,
                    item: supply?.name || 'N/A',
                    type: 'Supply',
                    venue: ev.room || 'N/A',
                    qty: ps.quantity || 0,
                    price: price,
                    amount: amount,
                    rentalDate: ev.startTime ? new Date(ev.startTime).toLocaleDateString('id-ID') : '',
                    returnDate: ev.endTime ? new Date(ev.endTime).toLocaleDateString('id-ID') : '',
                    status: ev.status,
                    branch: (ev.branchId as any)?.name || 'N/A'
                };
            })).filter(Boolean);

            data = [...directRentals, ...eventAssets, ...eventSupplies];

            filename = `export_rentals_${Date.now()}`;
        }

        // Apply Custom Columns if any
        if (customColumns.length > 0) {
            data = data.map(item => {
                const filtered: any = {};
                customColumns.forEach(col => {
                    if (headerMap[col]) filtered[headerMap[col]] = item[col];
                });
                return filtered;
            });
        } else {
            // Transform keys to headers
            data = data.map(item => {
                const transformed: any = {};
                Object.keys(headerMap).forEach(key => {
                    transformed[headerMap[key]] = item[key];
                });
                return transformed;
            });
        }

        // Grouping logic (simplified: sort by group)
        if (groupBy && headerMap[groupBy as string]) {
            const groupHeader = headerMap[groupBy as string];
            data.sort((a, b) => {
                const valA = String(a[groupHeader] || '').toLowerCase();
                const valB = String(b[groupHeader] || '').toLowerCase();
                return valA.localeCompare(valB, 'id', { numeric: true });
            });
        }

        // Add Grand Total row AFTER sorting for Rental type
        if (type === 'rental' && data.length > 0) {
            const rawDataList = data;
            const totalHeader = headerMap.amount;
            const grandTotalValue = rawDataList.reduce((acc, curr) => {
                const val = parseFloat(curr[totalHeader]) || 0;
                return acc + val;
            }, 0);

            const totalRow: any = {};
            Object.values(headerMap).forEach(h => totalRow[h] = '');
            totalRow[headerMap.type] = 'GRAND TOTAL';
            totalRow[headerMap.amount] = format === 'excel' ? grandTotalValue : formatIDR(grandTotalValue);
            data.push(totalRow);
        }

        const reportDate = new Date().toLocaleString('id-ID');
        const generatedBy = req.user.name || 'Admin';

        if (format === 'json') {
            if (type === 'rental') {
                // Group by Event and add subtotals for preview
                const groupedData: any[] = [];
                const eventsSet = [...new Set(data.map(item => item[headerMap.event]))];
                let grandTotal = 0;

                eventsSet.forEach(eventName => {
                    const eventItems = data.filter(item => item[headerMap.event] === eventName);
                    if (eventItems.length === 0) return;

                    // Header row
                    const headerRow: any = {};
                    Object.values(headerMap).forEach(h => headerRow[h] = '');
                    headerRow[headerMap.event] = `EVENT: ${eventName}`;
                    groupedData.push(headerRow);

                    // Add items
                    groupedData.push(...eventItems.map(item => ({
                        ...item,
                        [headerMap.price]: formatIDR(item[headerMap.price]),
                        [headerMap.amount]: formatIDR(item[headerMap.amount])
                    })));

                    // Subtotal row
                    const subtotal = eventItems.reduce((acc, curr) => acc + (parseFloat(curr[headerMap.amount]) || 0), 0);
                    grandTotal += subtotal;
                    const subtotalRow: any = {};
                    Object.values(headerMap).forEach(h => subtotalRow[h] = '');
                    subtotalRow[headerMap.item] = 'TOTAL EVENT';
                    subtotalRow[headerMap.amount] = formatIDR(subtotal);
                    groupedData.push(subtotalRow);

                    // Spacer
                    groupedData.push({});
                });

                // Grand total
                const grandTotalRow: any = {};
                Object.values(headerMap).forEach(h => grandTotalRow[h] = '');
                grandTotalRow[headerMap.item] = 'GRAND TOTAL';
                grandTotalRow[headerMap.amount] = formatIDR(grandTotal);
                groupedData.push(grandTotalRow);

                return res.json({
                    data: groupedData,
                    meta: { reportDate, generatedBy, type, count: data.length }
                });
            }

            if (type === 'maintenance') {
                const groupedData: any[] = [];
                const groups = [...new Set(data.map(item => `${item[headerMap.asset]} | ${item[headerMap.model]}`))];
                let grandTotal = 0;

                groups.forEach(groupKey => {
                    const [assetName, assetModel] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.asset] === assetName && item[headerMap.model] === assetModel);
                    if (groupItems.length === 0) return;

                    // Header row
                    const headerRow: any = {};
                    Object.values(headerMap).forEach(h => headerRow[h] = '');
                    headerRow[headerMap.asset] = `ASSET: ${assetName}`;
                    headerRow[headerMap.model] = `MODEL: ${assetModel}`;
                    groupedData.push(headerRow);

                    // Add items
                    groupedData.push(...groupItems.map(item => ({
                        ...item,
                        [headerMap.cost]: formatIDR(item[headerMap.cost])
                    })));

                    // Subtotal row
                    const subtotal = groupItems.reduce((acc, curr) => acc + (parseFloat(curr[headerMap.cost]) || 0), 0);
                    grandTotal += subtotal;
                    const subtotalRow: any = {};
                    Object.values(headerMap).forEach(h => subtotalRow[h] = '');
                    subtotalRow[headerMap.title] = 'TOTAL ASSET';
                    subtotalRow[headerMap.cost] = formatIDR(subtotal);
                    groupedData.push(subtotalRow);

                    // Spacer
                    groupedData.push({});
                });

                // Grand total
                const grandTotalRow: any = {};
                Object.values(headerMap).forEach(h => grandTotalRow[h] = '');
                grandTotalRow[headerMap.title] = 'GRAND TOTAL';
                grandTotalRow[headerMap.cost] = formatIDR(grandTotal);
                groupedData.push(grandTotalRow);

                return res.json({
                    data: groupedData,
                    meta: { reportDate, generatedBy, type, count: data.length }
                });
            }

            if (type === 'supply') {
                const groupedData: any[] = [];
                const groups = [...new Set(data.map(item => `${item[headerMap.supply]} | ${item[headerMap.sn]}`))];

                groups.forEach(groupKey => {
                    const [name, sn] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.supply] === name && item[headerMap.sn] === sn);
                    if (groupItems.length === 0) return;

                    // Header
                    const headerRow: any = {};
                    Object.values(headerMap).forEach(h => headerRow[h] = '');
                    headerRow[headerMap.supply] = `BARANG: ${name}`;
                    headerRow[headerMap.sn] = `PART NO: ${sn}`;
                    groupedData.push(headerRow);

                    // Items
                    groupedData.push(...groupItems);

                    // Subtotal (Usage only)
                    const totalUsed = groupItems
                        .filter(item => item[headerMap.action] === 'USE')
                        .reduce((acc, curr) => acc + Math.abs(parseFloat(curr[headerMap.change]) || 0), 0);

                    const subtotalRow: any = {};
                    Object.values(headerMap).forEach(h => subtotalRow[h] = '');
                    subtotalRow[headerMap.action] = 'TOTAL DIPAKAI';
                    subtotalRow[headerMap.change] = totalUsed;
                    groupedData.push(subtotalRow);

                    // Balance row
                    const latestStock = groupItems[groupItems.length - 1][headerMap.stock];
                    const balanceRow: any = {};
                    Object.values(headerMap).forEach(h => balanceRow[h] = '');
                    balanceRow[headerMap.action] = 'STOK SAAT INI';
                    balanceRow[headerMap.change] = latestStock;
                    groupedData.push(balanceRow);

                    groupedData.push({}); // Spacer
                });

                return res.json({
                    data: groupedData,
                    meta: { reportDate, generatedBy, type, count: data.length }
                });
            }

            if (type === 'asset') {
                const groupedData: any[] = [];
                const groups = [...new Set(data.map(item => `${item[headerMap.name]} | ${item[headerMap.model]}`))];

                groups.forEach(groupKey => {
                    const [name, model] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.name] === name && item[headerMap.model] === model);
                    if (groupItems.length === 0) return;

                    // Header row
                    const headerRow: any = {};
                    Object.values(headerMap).forEach(h => headerRow[h] = '');
                    headerRow[headerMap.name] = `NAMA: ${name}`;
                    headerRow[headerMap.model] = `MODEL: ${model}`;
                    headerRow[headerMap.category] = `Kategori: ${groupItems[0][headerMap.category]}`;
                    groupedData.push(headerRow);

                    // Items
                    groupedData.push(...groupItems.map(item => ({
                        ...item,
                        [headerMap.value]: formatIDR(item[headerMap.value])
                    })));

                    // Total Unit row
                    const totalUnitRow: any = {};
                    Object.values(headerMap).forEach(h => totalUnitRow[h] = '');
                    totalUnitRow[headerMap.serial] = 'TOTAL UNIT';
                    totalUnitRow[headerMap.department] = groupItems.length;
                    groupedData.push(totalUnitRow);

                    // Spacer
                    groupedData.push({});
                });

                return res.json({
                    data: groupedData,
                    meta: { reportDate, generatedBy, type, count: data.length }
                });
            }

            return res.json({
                data,
                meta: {
                    reportDate,
                    generatedBy,
                    type,
                    count: data.length
                }
            });
        }

        if (format === 'pdf') {
            const doc = new PDFDocument({
                margin: 30,
                size: 'A4',
                layout: (type === 'rental' || type === 'maintenance' || type === 'supply' || type === 'asset') ? 'landscape' : 'portrait'
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
            doc.pipe(res);

            doc.fontSize(16).text('Laporan Inventaris & Maintenance', { align: 'center' });
            doc.moveDown();
            doc.fontSize(10).text(`Tanggal Laporan: ${reportDate}`);
            doc.text(`Dibuat Oleh: ${generatedBy}`);
            doc.moveDown();

            if (type === 'asset') {
                const groups = [...new Set(data.map(item => `${item[headerMap.name]} | ${item[headerMap.model]}`))];

                for (const groupKey of groups) {
                    const [name, model] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.name] === name && item[headerMap.model] === model);
                    if (groupItems.length === 0) continue;

                    const table = {
                        title: `ASSET: ${name} (MODEL: ${model}) - Kategori: ${groupItems[0][headerMap.category]}`,
                        headers: Object.values(headerMap),
                        rows: groupItems.map(item => Object.values({
                            ...item,
                            [headerMap.value]: formatIDR(item[headerMap.value])
                        }).map(v => String(v || '')))
                    };

                    // Add total unit row
                    const totalRow = Object.values(headerMap).map(h => '');
                    totalRow[Object.keys(headerMap).indexOf('serial')] = 'TOTAL UNIT';
                    totalRow[Object.keys(headerMap).indexOf('department')] = String(groupItems.length);
                    table.rows.push(totalRow);

                    await doc.table(table, {
                        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            if (indexRow === table.rows.length - 1) {
                                doc.font('Helvetica-Bold').fontSize(7);
                            } else {
                                doc.font('Helvetica').fontSize(7);
                            }
                            return doc;
                        },
                    });
                    doc.moveDown();
                }
            } else if (type === 'rental') {
                const eventsSet = [...new Set(data.map(item => item[headerMap.event]))];
                let grandTotal = 0;

                for (const eventName of eventsSet) {
                    const eventItems = data.filter(item => item[headerMap.event] === eventName);
                    if (eventItems.length === 0) continue;

                    const subtotal = eventItems.reduce((acc, curr) => acc + (parseFloat(curr[headerMap.amount]) || 0), 0);
                    grandTotal += subtotal;

                    const table = {
                        title: `EVENT: ${eventName}`,
                        headers: Object.values(headerMap),
                        rows: eventItems.map(item => Object.values({
                            ...item,
                            [headerMap.price]: formatIDR(item[headerMap.price]),
                            [headerMap.amount]: formatIDR(item[headerMap.amount])
                        }).map(v => String(v || '')))
                    };

                    // Add subtotal row to the table rows
                    const subtotalRow = Object.values(headerMap).map(h => '');
                    subtotalRow[Object.keys(headerMap).indexOf('item')] = 'TOTAL EVENT';
                    subtotalRow[Object.keys(headerMap).indexOf('amount')] = formatIDR(subtotal);
                    table.rows.push(subtotalRow);

                    await doc.table(table, {
                        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            if (indexRow === table.rows.length - 1) {
                                doc.font('Helvetica-Bold').fontSize(7);
                            } else {
                                doc.font('Helvetica').fontSize(7);
                            }
                            return doc;
                        },
                    });
                    doc.moveDown();
                }

                // Final Grand Total
                doc.font('Helvetica-Bold').fontSize(10).text(`GRAND TOTAL: ${grandTotal}`, { align: 'right' });
            } else if (type === 'maintenance') {
                const groups = [...new Set(data.map(item => `${item[headerMap.asset]} | ${item[headerMap.model]}`))];
                let grandTotal = 0;

                for (const groupKey of groups) {
                    const [assetName, assetModel] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.asset] === assetName && item[headerMap.model] === assetModel);
                    if (groupItems.length === 0) continue;

                    const subtotal = groupItems.reduce((acc, curr) => acc + (parseFloat(curr[headerMap.cost]) || 0), 0);
                    grandTotal += subtotal;

                    const table = {
                        title: `ASSET: ${assetName} (MODEL: ${assetModel})`,
                        headers: Object.values(headerMap),
                        rows: groupItems.map(item => Object.values({
                            ...item,
                            [headerMap.cost]: formatIDR(item[headerMap.cost])
                        }).map(v => String(v || '')))
                    };

                    // Add subtotal row
                    const subtotalRow = Object.values(headerMap).map(h => '');
                    subtotalRow[Object.keys(headerMap).indexOf('title')] = 'TOTAL ASSET';
                    subtotalRow[Object.keys(headerMap).indexOf('cost')] = formatIDR(subtotal);
                    table.rows.push(subtotalRow);

                    await doc.table(table, {
                        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            if (indexRow === table.rows.length - 1) {
                                doc.font('Helvetica-Bold').fontSize(7);
                            } else {
                                doc.font('Helvetica').fontSize(7);
                            }
                            return doc;
                        },
                    });
                    doc.moveDown();
                }

                // Final Grand Total
                doc.font('Helvetica-Bold').fontSize(10).text(`GRAND TOTAL: ${grandTotal}`, { align: 'right' });
            } else if (type === 'supply') {
                const groups = [...new Set(data.map(item => `${item[headerMap.supply]} | ${item[headerMap.sn]}`))];

                for (const groupKey of groups) {
                    const [name, sn] = groupKey.split(' | ');
                    const groupItems = data.filter(item => item[headerMap.supply] === name && item[headerMap.sn] === sn);
                    if (groupItems.length === 0) continue;

                    const totalUsed = groupItems
                        .filter(item => item[headerMap.action] === 'USE')
                        .reduce((acc, curr) => acc + Math.abs(parseFloat(curr[headerMap.change]) || 0), 0);

                    const table = {
                        title: `BARANG: ${name} (PART NO: ${sn})`,
                        headers: Object.values(headerMap),
                        rows: groupItems.map(item => Object.values(item).map(v => String(v || '')))
                    };

                    // Subtotal row
                    const subtotalRow = Object.values(headerMap).map(h => '');
                    subtotalRow[Object.keys(headerMap).indexOf('action')] = 'TOTAL DIPAKAI';
                    subtotalRow[Object.keys(headerMap).indexOf('change')] = String(totalUsed);
                    table.rows.push(subtotalRow);

                    const balanceRow = Object.values(headerMap).map(h => '');
                    const latestStock = groupItems[groupItems.length - 1][headerMap.stock];
                    balanceRow[Object.keys(headerMap).indexOf('action')] = 'STOK SAAT INI';
                    balanceRow[Object.keys(headerMap).indexOf('change')] = String(latestStock);
                    table.rows.push(balanceRow);

                    await doc.table(table, {
                        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
                        prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                            if (indexRow === table.rows.length - 1) {
                                doc.font('Helvetica-Bold').fontSize(7);
                            } else {
                                doc.font('Helvetica').fontSize(7);
                            }
                            return doc;
                        },
                    });
                    doc.moveDown();
                }
            } else {
                const table = {
                    title: `${type?.toString().toUpperCase()} REPORT`,
                    headers: Object.values(headerMap),
                    rows: data.map(item => Object.values(item).map(v => String(v || '')))
                };

                await doc.table(table, {
                    prepareHeader: () => doc.font('Helvetica-Bold').fontSize(8),
                    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                        doc.font('Helvetica').fontSize(7);
                        return doc;
                    },
                });
            }

            doc.end();
        } else {
            // Excel Format
            const wb = XLSX.utils.book_new();

            // Add Metadata rows
            const metadata = [
                ['Tanggal Laporan:', reportDate],
                ['Dibuat Oleh:', generatedBy],
                [] // Spacer
            ];

            const ws = XLSX.utils.aoa_to_sheet(metadata);
            XLSX.utils.sheet_add_json(ws, data, { origin: 'A4' });

            XLSX.utils.book_append_sheet(wb, ws, 'Report');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
            res.send(buffer);
        }
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
