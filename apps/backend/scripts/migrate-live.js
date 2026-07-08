import mongoose from 'mongoose';

async function run() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error("Gagal: MONGO_URI tidak ditemukan!");
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('Terhubung ke MongoDB Live...');

        const db = mongoose.connection.db;
        const assetsCol = db.collection('assets');
        const locsCol = db.collection('locations');

        const assets = await assetsCol.find({ locationId: { $exists: true, $ne: null } }).toArray();
        console.log(`Menemukan ${assets.length} aset untuk dimigrasi.`);

        let updatedCount = 0;
        for (const asset of assets) {
            let currentLocId = asset.locationId;
            let buildingName = null;

            // Loop untuk cari parent paling atas (Gedung)
            while (currentLocId) {
                const loc = await locsCol.findOne({ _id: currentLocId });
                if (!loc) break;
                buildingName = loc.name;
                currentLocId = loc.parentId;
            }

            if (buildingName && asset.building !== buildingName) {
                await assetsCol.updateOne(
                    { _id: asset._id }, 
                    { $set: { building: buildingName } }
                );
                updatedCount++;
            }
        }

        console.log(`Sukses! ${updatedCount} aset telah diperbarui dengan data Gedung.`);
    } catch (err) {
        console.error('Terjadi error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
