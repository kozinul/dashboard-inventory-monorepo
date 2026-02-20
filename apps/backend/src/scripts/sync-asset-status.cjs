/**
 * Script: Sinkronisasi Status Aset
 * 
 * Masalah: Aset yang sudah di-assign tetap menampilkan status 'active'
 * Solusi: Cari semua Assignment aktif, pastikan aset terkait berstatus 'assigned'
 * 
 * Juga: Cek data user Agung untuk memastikan managedDepartments terisi
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // ===== 1. SINKRONISASI STATUS ASET =====
    console.log('\n📦 === SINKRONISASI STATUS ASET ===');

    // Find all active assignments (not deleted, status = assigned)
    const activeAssignments = await db.collection('assignments').find({
        status: 'assigned',
        isDeleted: { $ne: true }
    }).toArray();

    console.log(`Found ${activeAssignments.length} active assignments`);

    let fixed = 0;
    let alreadyCorrect = 0;

    for (const assignment of activeAssignments) {
        const asset = await db.collection('assets').findOne({ _id: assignment.assetId });
        if (!asset) {
            console.log(`⚠️  Asset ${assignment.assetId} not found (orphaned assignment)`);
            continue;
        }

        if (asset.status !== 'assigned') {
            console.log(`🔧 Fixing: "${asset.name}" (${asset.serial}) — ${asset.status} → assigned`);
            await db.collection('assets').updateOne(
                { _id: asset._id },
                { $set: { status: 'assigned' } }
            );
            fixed++;
        } else {
            alreadyCorrect++;
        }
    }

    console.log(`\n✅ ${fixed} assets FIXED (status → assigned)`);
    console.log(`✅ ${alreadyCorrect} assets already correct`);

    // ===== 2. CEK USER AGUNG =====
    console.log('\n👤 === CEK USER AGUNG ===');

    const agung = await db.collection('users').findOne({
        name: { $regex: /agung/i }
    });

    if (agung) {
        console.log(`Name: ${agung.name}`);
        console.log(`Role: ${agung.role}`);
        console.log(`Username: ${agung.username}`);
        console.log(`DepartmentId: ${agung.departmentId}`);
        console.log(`ManagedDepartments: ${JSON.stringify(agung.managedDepartments || [])}`);
        console.log(`BranchId: ${agung.branchId}`);

        // Look up department names
        if (agung.departmentId) {
            const homeDept = await db.collection('departments').findOne({ _id: agung.departmentId });
            console.log(`Home Department: ${homeDept?.name || 'NOT FOUND'}`);
        }

        if (agung.managedDepartments && agung.managedDepartments.length > 0) {
            for (const deptId of agung.managedDepartments) {
                const dept = await db.collection('departments').findOne({ _id: deptId });
                console.log(`Managed Dept: ${dept?.name || 'NOT FOUND'} (${deptId})`);
            }
        } else {
            console.log('⚠️  Agung has NO managedDepartments!');
        }

        // Check what Assets exist in Audio Visual department
        const allDepts = await db.collection('departments').find({}).toArray();
        const avDept = allDepts.find(d => d.name && d.name.toLowerCase().includes('audio'));
        if (avDept) {
            console.log(`\n🎵 Audio Visual Department found: ${avDept.name} (${avDept._id})`);
            const avAssets = await db.collection('assets').countDocuments({ departmentId: avDept._id });
            console.log(`Assets in Audio Visual: ${avAssets}`);

            // Check if Agung's managedDepartments includes AV
            const isManaged = agung.managedDepartments?.some(id => id.toString() === avDept._id.toString());
            console.log(`Is Audio Visual in Agung's managedDepartments? ${isManaged ? '✅ YES' : '❌ NO'}`);

            if (!isManaged) {
                console.log('🔧 FIX: Adding Audio Visual to Agung\'s managedDepartments...');
                const currentManaged = agung.managedDepartments || [];
                currentManaged.push(avDept._id);
                await db.collection('users').updateOne(
                    { _id: agung._id },
                    { $set: { managedDepartments: currentManaged } }
                );
                console.log('✅ Audio Visual added to Agung\'s managedDepartments');
            }
        } else {
            console.log('⚠️  No "Audio Visual" department found. Available departments:');
            allDepts.forEach(d => console.log(`   - ${d.name} (${d._id})`));
        }
    } else {
        console.log('⚠️  User Agung not found in database');
    }

    // ===== 3. SUMMARY =====
    console.log('\n📊 === SUMMARY ===');
    const totalAssets = await db.collection('assets').countDocuments({});
    const activeAssets = await db.collection('assets').countDocuments({ status: 'active' });
    const assignedAssets = await db.collection('assets').countDocuments({ status: 'assigned' });
    const maintenanceAssets = await db.collection('assets').countDocuments({ status: 'maintenance' });

    console.log(`Total Assets: ${totalAssets}`);
    console.log(`Active: ${activeAssets}`);
    console.log(`Assigned: ${assignedAssets}`);
    console.log(`Maintenance: ${maintenanceAssets}`);

    await mongoose.disconnect();
    console.log('\n✅ Done!');
}

run().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
