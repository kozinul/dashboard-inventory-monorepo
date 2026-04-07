import mongoose from 'mongoose';
import { Asset } from '../src/models/asset.model.js';
import { Location } from '../src/models/location.model.js';

async function resolveBuilding(locationId: string): Promise<string | null> {
    let current = await Location.findById(locationId);
    if (!current) return null;

    let parent = current;
    while (parent.parentId) {
        const nextParent = await Location.findById(parent.parentId);
        if (!nextParent) break;
        parent = nextParent;
    }
    return parent.name;
}

async function run() {
    try {
        await mongoose.connect('mongodb://mongo:27017/inventory');
        console.log('Connected to MongoDB');

        const assets = await Asset.find({ locationId: { $exists: true, $ne: null } });
        console.log(`Found ${assets.length} assets with locations to migrate.`);

        let updatedCount = 0;
        for (const asset of assets) {
            const buildingName = await resolveBuilding(asset.locationId.toString());
            if (buildingName && asset.building !== buildingName) {
                asset.building = buildingName;
                await asset.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} assets with building information.`);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
