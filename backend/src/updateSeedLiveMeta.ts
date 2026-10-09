import fs from 'fs';
import path from 'path';

const metaPath = path.join(__dirname, 'resolvedAmazonLiveMeta.json');
const pricesPath = path.join(__dirname, 'scrapedAmazonPrices.json');
const seedPath = path.join(__dirname, 'seedShopAffiliateProducts.ts');

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const prices = JSON.parse(fs.readFileSync(pricesPath, 'utf8'));

const metaMap = new Map<string, { asin: string; title: string; img: string }>();
meta.forEach((m: any) => metaMap.set(m.asin, m));

const priceMap = new Map<string, { asin: string; price: number; mrp: number; discount: number }>();
prices.forEach((p: any) => priceMap.set(p.asin, p));

let content = fs.readFileSync(seedPath, 'utf8');

// Split content by product object definitions
const chunks = content.split(/(\n\s*\{\s*\n)/);

let updatedCount = 0;

for (let i = 0; i < chunks.length; i++) {
  const chunk = chunks[i];
  const asinMatch = chunk.match(/buyOnAmazonUrl:\s*['"]https:\/\/www\.amazon\.in\/[^\/]+\/dp\/([A-Z0-9]+)/);
  if (!asinMatch) continue;
  const asin = asinMatch[1];
  const m = metaMap.get(asin);
  const p = priceMap.get(asin);

  let updated = chunk;
  if (m) {
    if (m.title) {
      const cleanTitle = m.title
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/: Amazon\.in.*$/i, '')
        .trim();
      const escapedTitle = cleanTitle.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      updated = updated.replace(/name:\s*['"][^'"]+['"]/, `name: '${escapedTitle}'`);
    }
    if (m.img) {
      updated = updated.replace(/image:\s*['"][^'"]+['"]/, `image: '${m.img}'`);
      updated = updated.replace(/images:\s*\[\s*['"][^'"]+['"]\s*\]/, `images: ['${m.img}']`);
    }
  }
  if (p) {
    if (p.price) {
      updated = updated.replace(/price:\s*\d+/, `price: ${p.price}`);
      updated = updated.replace(/offerPrice:\s*\d+/, `offerPrice: ${p.price}`);
    }
    if (p.mrp) {
      updated = updated.replace(/regularPrice:\s*\d+/, `regularPrice: ${p.mrp}`);
    }
    if (p.discount !== undefined) {
      updated = updated.replace(/discountPercent:\s*\d+/, `discountPercent: ${p.discount}`);
    }
  }

  if (updated !== chunk) {
    updatedCount++;
    chunks[i] = updated;
  }
}

fs.writeFileSync(seedPath, chunks.join(''), 'utf8');
console.log(`[Success] Updated ${updatedCount} products in seedShopAffiliateProducts.ts with live Amazon images, titles, and pricing!`);
