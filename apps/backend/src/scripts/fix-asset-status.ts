import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Asset } from '../models/asset.model.js';
import { Location } from '../models/location.model.js';

dotenv.config();

const fixAssetStatus = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || '');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const fixableStatuses = ['active', 'storage', 'in_use', 'Active'];
        let updatedToInUse = 0;
        let updatedToStorage = 0;
        let skipped = 0;

        // 1. Fix assets with locationId
        const assetsWithLoc = await Asset.find({
            locationId: { $exists: true, $ne: null },
            status: { $in: fixableStatuses }
        });

        console.log(`Found ${assetsWithLoc.length} assets with a location to check...`);

        for (const asset of assetsWithLoc) {
            const location = await Location.findById(asset.locationId);
            if (!location) {
                console.log(`  ⚠ Asset "${asset.name}" has unknown locationId, skipping.`);
                skipped++;
                continue;
            }

            const correct = location.isWarehouse ? 'active' : 'in_use';
            if (asset.status !== correct) {
                await Asset.findByIdAndUpdate(asset._id, { status: correct });
                if (correct === 'in_use') {
                    console.log(`  ✓ "${asset.name}" (${location.name}) → in_use`);
                    updatedToInUse++;
                } else {
                    console.log(`  ✓ "${asset.name}" (${location.name}) → active`);
                    updatedToStorage++;
                }
            } else {
                skipped++;
            }
        }

        // 2. Fix assets with NO locationId
        const assetsNoLoc = await Asset.find({
            $or: [
                { locationId: { $exists: false } },
                { locationId: null }
            ],
            status: { $in: fixableStatuses },
            departmentId: { $exists: true, $ne: null }
        });

        console.log(`\nFound ${assetsNoLoc.length} assets with NO location...`);

        for (const asset of assetsNoLoc) {
            // Find warehouse for this department
            const warehouse = await Location.findOne({
                departmentId: asset.departmentId,
                isWarehouse: true
            });

            if (warehouse) {
                await Asset.findByIdAndUpdate(asset._id, {
                    locationId: warehouse._id,
                    location: warehouse.name,
                    status: 'active'
                });
                console.log(`  ✓ "${asset.name}" (No Location) → ${warehouse.name} [active]`);
                updatedToStorage++;
            } else {
                // Fallback to any warehouse in branch
                const anyWarehouse = await Location.findOne({
                    branchId: (asset as any).branchId,
                    isWarehouse: true
                });
                if (anyWarehouse) {
                    await Asset.findByIdAndUpdate(asset._id, {
                        locationId: anyWarehouse._id,
                        location: anyWarehouse.name,
                        status: 'active'
                    });
                    console.log(`  ✓ "${asset.name}" (No Location) → ${anyWarehouse.name} [active] (Branch Fallback)`);
                    updatedToStorage++;
                } else {
                    console.log(`  ⚠ Asset "${asset.name}" has no location and no warehouse found for dept/branch.`);
                    skipped++;
                }
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`  Updated to in_use:  ${updatedToInUse}`);
        console.log(`  Updated to active:  ${updatedToStorage}`);
        console.log(`  Skipped (correct):  ${skipped}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

fixAssetStatus();
