import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory';

const assetSchema = new mongoose.Schema({
  name: String,
  alias: String,
  model: String,
  category: String,
  serial: String,
  location: String,
  status: String,
  value: Number,
  purchaseDate: Date,
}, { timestamps: true, strict: false });

const Asset = mongoose.model('Asset', assetSchema);

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.\n');

    // 1. Find the asset by serial
    const serial = 'DS-7616NI-Q21620240618CCRRFG0083764WCVU';
    let asset = await Asset.findOne({ serial });
    if (!asset) {
      // Fallback: search by name containing "NVR Hikvision 16CH"
      asset = await Asset.findOne({ name: { $regex: /NVR Hikvision 16CH/i } });
    }

    if (!asset) {
      console.log('Asset not found.');
      await mongoose.disconnect();
      return;
    }

    console.log('=== BEFORE UPDATE ===');
    console.log(JSON.stringify(asset.toObject(), null, 2));

    // 2. Update alias
    asset.alias = 'NVR Hikvision 16 CH';
    await asset.save();

    // 3. Fetch again to confirm
    const after = await Asset.findById(asset._id);
    console.log('\n=== AFTER UPDATE ===');
    console.log(JSON.stringify(after.toObject(), null, 2));

    await mongoose.disconnect();
    console.log('\nDone.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
