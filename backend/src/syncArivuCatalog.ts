import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Setup environment variables
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(__dirname, '../.env.production') 
  : path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

import { Vendor } from './models/Vendor';
import ShopProduct from './models/ShopProduct';
import { VendorAdapterFactory } from './services/vendorAdapters/VendorAdapterFactory';

export async function runArivuCatalogSync() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/fastgluco';
  console.log('[ArivuSync] Connecting to database:', uri);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log('[ArivuSync] Database connected successfully.');
  }

  try {
    // 1. Clean out legacy template/mock products
    const removedLegacy = await ShopProduct.deleteMany({
      $or: [
        { vendorExternalId: { $regex: '^ARV-' } },
        { vendorSku: { $regex: '^ARIVU-CP-|^ARIVU-WP-|^ARIVU-FOXTAIL-|^ARIVU-SPROUTED-|^ARIVU-ORGANIC-' } },
        { name: 'Mito-C Complex' },
        { name: 'Cellular Glutathione' },
        { name: 'Resveratrol Elite' },
        { name: 'Blood Glucose Monitor Kit' },
        { name: 'CGM Sensor Patch' },
        { name: 'Organic Almond Bar' },
        { brand: 'MitoLife' },
        { brand: 'CellMax' },
        { brand: 'AccuCheck' },
        { brand: 'Freestyle' },
        { brand: 'NutriBite' }
      ]
    });
    if (removedLegacy.deletedCount > 0) {
      console.log(`[ArivuSync] Cleaned ${removedLegacy.deletedCount} legacy mock products from database.`);
    }

    // 2. Ensure Arivu Foods vendor exists with live verified API configuration
    let arivu = await Vendor.findOne({ slug: 'arivu-foods' });
    const liveBaseUrl = process.env.ARIVU_FOODS_BASE_URL || 'https://backend.arivufoods.com';
    const liveApiKey = process.env.ARIVU_FOODS_API_KEY || 'mito_arivu_sk_4c8f7a1d9e2b6f0a3d5c8e1f7b4a9d6c';

    if (!arivu) {
      arivu = new Vendor({
        name: 'Arivu Foods',
        slug: 'arivu-foods',
        email: 'support@arivufoods.com',
        passwordHash: 'dummy_hash_for_vendor',
        phone: '+91 98450 12345',
        website: 'https://www.arivufoods.com',
        businessName: 'Arivu Natural Foods Private Limited',
        isActive: true,
        commissionType: 'PERCENTAGE',
        commissionValue: 30,
        apiConfig: {
          baseUrl: liveBaseUrl,
          apiKey: liveApiKey,
          mockMode: false,
          lastSyncStatus: 'IDLE',
          healthStatus: 'HEALTHY',
          endpoints: {
            catalogSync: '/api/mitoreboot/products',
            orderSubmit: '/api/mitoreboot/orders',
            orderStatus: '/api/mitoreboot/orders/:orderId'
          }
        }
      });
      await arivu.save();
      console.log('[ArivuSync] Created new Arivu Foods vendor record.');
    } else {
      arivu.apiConfig = {
        baseUrl: liveBaseUrl,
        apiKey: liveApiKey,
        mockMode: false,
        lastSyncStatus: arivu.apiConfig?.lastSyncStatus || 'IDLE',
        healthStatus: arivu.apiConfig?.healthStatus || 'HEALTHY',
        endpoints: {
          catalogSync: '/api/mitoreboot/products',
          orderSubmit: '/api/mitoreboot/orders',
          orderStatus: '/api/mitoreboot/orders/:orderId'
        }
      };
      await arivu.save();
      console.log('[ArivuSync] Updated Arivu Foods vendor with live production endpoints.');
    }

    // 3. Trigger live catalog sync
    console.log('[ArivuSync] Fetching live product catalog from Arivu Foods API...');
    const adapter = VendorAdapterFactory.getAdapter(arivu);
    const syncResult = await adapter.syncProducts(arivu);
    console.log('[ArivuSync] Sync completed with result:', JSON.stringify(syncResult, null, 2));

    const totalProducts = await ShopProduct.find({ vendorId: arivu._id });
    console.log(`[ArivuSync] Total active Arivu Foods products in database: ${totalProducts.length}`);
    totalProducts.forEach(p => {
      console.log(` - [${p.vendorExternalId}] ${p.name} | ₹${p.price} | Variants: ${p.variants?.length} | Active: ${p.isActive}`);
    });

    return { success: true, count: totalProducts.length };
  } catch (err: any) {
    console.error('[ArivuSync] Error during catalog sync:', err);
    throw err;
  }
}

// Execute directly if run as a CLI script
if (require.main === module) {
  runArivuCatalogSync()
    .then(() => {
      console.log('[ArivuSync] Catalog sync script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[ArivuSync] Catalog sync script failed:', err);
      process.exit(1);
    });
}
