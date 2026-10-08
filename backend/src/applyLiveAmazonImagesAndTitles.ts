import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import ShopProduct from './models/ShopProduct';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
  await mongoose.connect(uri);

  const raw = fs.readFileSync(path.join(__dirname, 'resolvedAmazonLiveMeta.json'), 'utf8');
  const items = JSON.parse(raw);

  for (const item of items) {
    if (!item.img && !item.title) continue;
    const regex = new RegExp(item.asin, 'i');
    const prod = await ShopProduct.findOne({ buyOnAmazonUrl: regex });
    if (prod) {
      if (item.title) {
        prod.name = item.title
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/: Amazon\.in.*$/i, '')
          .trim();
      }
      if (item.img) {
        prod.image = item.img;
        prod.images = [item.img];
      }
      await prod.save();
      console.log(`[Updated DB] ASIN ${item.asin} => Name: ${prod.name.slice(0, 40)}... | Img: ${prod.image}`);
    } else {
      console.log(`[Not Found] ASIN ${item.asin}`);
    }
  }

  await mongoose.disconnect();
  console.log('[Done] MongoDB updated with live Amazon images and titles.');
}

main().catch(console.error);
