const BASE_URL = 'http://localhost:3000/api/v1';

async function runVerification() {
    try {
        console.log('1. Creating a new Unit...');
        const unitRes = await fetch(`${BASE_URL}/units`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Box',
                symbol: 'TBox',
                status: 'Active'
            })
        });
        const unit = await unitRes.json();
        if (!unitRes.ok) throw new Error(unit.message || 'Failed to create unit');
        console.log('   Unit created:', unit._id, unit.name);

        console.log('2. Fetching Units...');
        const unitsRes = await fetch(`${BASE_URL}/units`);
        const units = await unitsRes.json();
        const foundUnit = units.find((u: any) => u._id === unit._id);
        if (foundUnit) {
            console.log('   Unit found in list.');
        } else {
            console.error('   Unit NOT found in list!');
        }

        console.log('3. Creating a Supply with the Unit...');
        const supplyRes = await fetch(`${BASE_URL}/supplies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test Supply Item',
                partNumber: `TS-${Date.now()}`,
                category: 'Testing',
                unitId: unit._id,
                quantity: 10,
                minimumStock: 5,
                cost: 100
            })
        });
        const supply = await supplyRes.json();
        if (!supplyRes.ok) throw new Error(supply.message || 'Failed to create supply');
        console.log('   Supply created:', supply._id);

        console.log('4. Fetching Supply to verify Unit population...');
        const fetchedSupplyRes = await fetch(`${BASE_URL}/supplies/${supply._id}`);
        const fetchedSupply = await fetchedSupplyRes.json();

        if (fetchedSupply.unitId && fetchedSupply.unitId._id === unit._id) {
            console.log('   Supply Unit populated correctly:', fetchedSupply.unitId.name);
        } else {
            console.error('   Supply Unit NOT populated correctly:', JSON.stringify(fetchedSupply.unitId, null, 2));
        }

        console.log('Verification Completed Successfully!');

        // Cleanup
        await fetch(`${BASE_URL}/supplies/${supply._id}`, { method: 'DELETE' });
        await fetch(`${BASE_URL}/units/${unit._id}`, { method: 'DELETE' });
        console.log('Cleanup done.');

    } catch (error: any) {
        console.error('Verification Failed:', error.message);
    }
}

runVerification();
