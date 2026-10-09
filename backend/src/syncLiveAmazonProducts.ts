import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import ShopProduct from './models/ShopProduct';

dotenv.config({ path: path.join(__dirname, '../.env') });

const UPDATED_AMAZON_ITEMS = [
  {
    asin: 'B09R4DGRH9',
    name: 'Vinnie Walnut With Shell - 500g (Pack Of 2) | Premium Chilean Select Akhrot',
    brand: 'Vinnie',
    price: 690,
    regularPrice: 799,
    discountPercent: 14,
    image: 'https://m.media-amazon.com/images/I/81KBQ4jrO7L.jpg',
    category: 'Pesticide free food'
  },
  {
    asin: 'B07BG7D7SC',
    name: 'Fresh Amla, 250gm',
    brand: 'Fresh Farm',
    price: 50.35,
    regularPrice: 55,
    discountPercent: 8,
    image: 'https://m.media-amazon.com/images/I/31Ip4aURUpL.png',
    category: 'Pesticide free food'
  },
  {
    asin: 'B0B53W9WJX',
    name: 'Fresh Organic Carrot Ooty, 500g',
    brand: 'Fresh Organic',
    price: 131,
    regularPrice: 150,
    discountPercent: 13,
    image: 'https://m.media-amazon.com/images/I/41RgULA8t0L.jpg',
    category: 'Pesticide free food'
  },
  {
    asin: 'B0GVK35WXS',
    name: 'Prana Air Pocket PM2.5 Air Quality Monitor, WiFi',
    brand: 'Prana Air',
    price: 3980,
    regularPrice: 8990,
    discountPercent: 56,
    image: 'https://m.media-amazon.com/images/I/41k46nyhQJL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0CMJ6T9JB',
    name: 'Eureka Forbes Air Purifier 355 | True HEPA H13 (480 Sq. Ft.)',
    brand: 'Eureka Forbes',
    price: 10999,
    regularPrice: 15990,
    discountPercent: 42,
    image: 'https://m.media-amazon.com/images/I/61nNG5witoL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0CRRWXQC4',
    name: 'Philips Car Air Purifier (3601)',
    brand: 'Philips',
    price: 3995,
    regularPrice: 5999,
    discountPercent: 33,
    image: 'https://m.media-amazon.com/images/I/61OQAQ7TkuL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0CB8KG44H',
    name: 'KENT Supreme Plus Alkaline+Copper RO Water Purifier',
    brand: 'KENT',
    price: 14499,
    regularPrice: 15990,
    discountPercent: 38,
    image: 'https://m.media-amazon.com/images/I/61UUbUkDGRL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0G2YNB443',
    name: 'atovio Nova N99 Anti-Pollution Face Mask with 8 Replaceable Filters',
    brand: 'atovio',
    price: 459,
    regularPrice: 799,
    discountPercent: 43,
    image: 'https://m.media-amazon.com/images/I/717KndjwFYL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B018IE1XSM',
    name: 'Oral B Cross Action AA Battery Electric Toothbrush for Adults',
    brand: 'Oral-B',
    price: 480,
    regularPrice: 599,
    discountPercent: 20,
    image: 'https://m.media-amazon.com/images/I/413HAuxlHPL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0GYZ7WH1F',
    name: 'Sensodyne Expert White Toothpaste 70gm X 02, 140GM',
    brand: 'Sensodyne',
    price: 500,
    regularPrice: 500,
    discountPercent: 0,
    image: 'https://m.media-amazon.com/images/I/51JSOPM8qRL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B08C5HKS1R',
    name: 'Cureveda Sparkle Oil Pulling for Mouth, Healthy Teeth & Gums (270 gm)',
    brand: 'Cureveda',
    price: 755,
    regularPrice: 795,
    discountPercent: 5,
    image: 'https://m.media-amazon.com/images/I/51YuQGAWwWL.jpg',
    category: 'Environment safe products'
  },
  {
    asin: 'B0FZX1FGFS',
    name: 'CUMIN CO. Enamel Cast Iron Non Stick Dosa Tawa 28 cm',
    brand: 'CUMIN & CO',
    price: 2999,
    regularPrice: 4399,
    discountPercent: 32,
    image: 'https://m.media-amazon.com/images/I/61q70oB2l4L.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0BZJFWFN8',
    name: 'The Indus Valley Super Smooth Cast Iron Cookware Set (4 Pcs)',
    brand: 'The Indus Valley',
    price: 4103,
    regularPrice: 7999,
    discountPercent: 49,
    image: 'https://m.media-amazon.com/images/I/71zT2y+qGEL.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0DN1SXXRK',
    name: 'KnobON Pre-Seasoned Cast Iron Cookware Set with Grill Pan (4 Pcs)',
    brand: 'KnobON',
    price: 4559,
    regularPrice: 10999,
    discountPercent: 59,
    image: 'https://m.media-amazon.com/images/I/614kQd8p7WL.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0FF4YS9K2',
    name: 'Stainless Steel Chopping Board, Multi-Purpose Cutting Board',
    brand: 'OLMARTT',
    price: 299,
    regularPrice: 699,
    discountPercent: 57,
    image: 'https://m.media-amazon.com/images/I/61F9O51jEGL.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0HC329FYK',
    name: 'MEEROK Oil dispenser 1 Litre Stainless Steel Leakfree Oil Pot',
    brand: 'MEEROK',
    price: 369,
    regularPrice: 999,
    discountPercent: 63,
    image: 'https://m.media-amazon.com/images/I/61l0c9J+NBL.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0CDL5G2R8',
    name: 'NATULIX 1 Kg Stainless Steel Containers for Kitchen with See Through Lid (6 Pcs)',
    brand: 'NATULIX',
    price: 1518,
    regularPrice: 2799,
    discountPercent: 46,
    image: 'https://m.media-amazon.com/images/I/71u9iBv1pML._SX679_.jpg',
    category: 'Safe kitchen'
  },
  {
    asin: 'B0849WHJQN',
    name: 'Abbott | FreeStyle Libre Blood Glucose Sensor',
    brand: 'Abbott',
    price: 2999,
    regularPrice: 3799,
    discountPercent: 36,
    image: 'https://m.media-amazon.com/images/I/61z+H36gU3L.jpg',
    category: 'Glucose monitoring'
  },
  {
    asin: 'B08KXS4TGC',
    name: 'Abbott FreeStyle Optimum H Blood Ketone Test Strips (10 Strips)',
    brand: 'Abbott',
    price: 1450,
    regularPrice: 1750,
    discountPercent: 17,
    image: 'https://m.media-amazon.com/images/I/51m86uH9j6L.jpg',
    category: 'Glucose monitoring'
  },
  {
    asin: 'B0H267WC5H',
    name: 'FreeStyle Libre-2 Reader Glucose Monitoring System (Black)',
    brand: 'Abbott',
    price: 5413,
    regularPrice: 5999,
    discountPercent: 10,
    image: 'https://m.media-amazon.com/images/I/51H6d9g2PPL.jpg',
    category: 'Glucose monitoring'
  },
  {
    asin: 'B0FG72Q5XM',
    name: 'A TATA Product - Organic India Amla Powder, 200g',
    brand: 'Organic India',
    price: 257,
    regularPrice: 299,
    discountPercent: 14,
    image: 'https://m.media-amazon.com/images/I/61M61Xm2Q0L.jpg',
    category: 'Antioxidants'
  },
  {
    asin: '1989682812',
    name: 'Vegan Diet: Quick and Easy Paleo Vegan Recipes (High Antioxidants & Phytochemicals)',
    brand: 'Health Books',
    price: 1226,
    regularPrice: 1532,
    discountPercent: 20,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1989682812.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food'
  },
  {
    asin: '1632872323',
    name: 'Superfood Recipes: Super Foods Healthy Recipes Book',
    brand: 'Gloria Richardson',
    price: 999,
    regularPrice: 1056,
    discountPercent: 5,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1632872323.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food'
  },
  {
    asin: '9350578883',
    name: 'Nature Cure Through Fruits And Vegetables: Best Natural Prescriptions',
    brand: 'Medical Publishing',
    price: 156.6,
    regularPrice: 195,
    discountPercent: 20,
    image: 'https://images-na.ssl-images-amazon.com/images/P/9350578883.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food'
  },
  {
    asin: '1557043019',
    name: 'The Antioxidant Save-Your-Life Cookbook: 150 Nutritious High-Fiber, Low-Fat Recipes',
    brand: 'Jane Kinderlehrer Smart Food Series',
    price: 499,
    regularPrice: 699,
    discountPercent: 29,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1557043019.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food'
  },
  {
    asin: '1578263239',
    name: 'Cooking Well Beautiful Skin: Over 75 Antioxidant-Rich Recipes for Glowing Skin',
    brand: 'Hatherleigh Press',
    price: 710.4,
    regularPrice: 1050,
    discountPercent: 32,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1578263239.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food'
  },
  {
    asin: 'B0DKT5B8S1',
    name: 'Inside The Menopause Brain: Reset your Understanding of the Menopause',
    brand: 'Avery Publishing',
    price: 2065,
    regularPrice: 2437,
    discountPercent: 15,
    image: 'https://images-na.ssl-images-amazon.com/images/P/B0DKT5B8S1.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health'
  },
  {
    asin: '0593855191',
    name: 'The Menopause Gut: Balance Your Microbiome to Reclaim Your Health',
    brand: 'Rodale Books',
    price: 1218,
    regularPrice: 2999,
    discountPercent: 24,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0593855191.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health'
  },
  {
    asin: '0679778004',
    name: 'Self-Help for Premenstrual Syndrome Third Edition',
    brand: 'Random House',
    price: 1197,
    regularPrice: 1441,
    discountPercent: 17,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0679778004.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health'
  },
  {
    asin: '0722531400',
    name: 'Recipes for Health – PMS: Over 100 Recipes for Overcoming Premenstrual Tension',
    brand: 'Thorsons',
    price: 999,
    regularPrice: 1199,
    discountPercent: 17,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0722531400.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health'
  },
  {
    asin: '9355154461',
    name: 'AN AYURVEDIC AND MODERN OVERVIEW Of PREMENSTRUAL SYNDROME',
    brand: 'Ayurvedic Press',
    price: 250,
    regularPrice: 300,
    discountPercent: 17,
    image: 'https://m.media-amazon.com/images/I/41SAS8UeP1L.jpg',
    category: 'Books',
    subcategory: 'Books for women health'
  },
  {
    asin: '1648450954',
    name: 'Memory Games for Seniors (Large Print): A Fun Activity Book with Brain Games',
    brand: 'Senior Activities Press',
    price: 1283,
    regularPrice: 2699,
    discountPercent: 22,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1648450954.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory'
  },
  {
    asin: 'B0DM1BM3PS',
    name: '6 Packs 16 Large Piece Puzzle for Seniors Dementia Alzheimer\'s Cognitive Games',
    brand: 'Senior Cognitive Games',
    price: 3819,
    regularPrice: 15748,
    discountPercent: 76,
    image: 'https://m.media-amazon.com/images/I/61InrePRt5L.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory'
  },
  {
    asin: '1837995346',
    name: 'Brain Games for Seniors: Fun, Achievable and Soothing Logic Puzzles',
    brand: 'Summersdale Publishers',
    price: 1361,
    regularPrice: 1599,
    discountPercent: 15,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1837995346.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory'
  }
];

async function sync() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
  console.log('[Sync] Connecting to MongoDB...');
  await mongoose.connect(uri);

  for (const item of UPDATED_AMAZON_ITEMS) {
    // Match by ASIN in the buyOnAmazonUrl
    const regex = new RegExp(item.asin, 'i');
    const existing = await ShopProduct.findOne({ buyOnAmazonUrl: regex });

    if (existing) {
      existing.name = item.name;
      existing.brand = item.brand;
      existing.price = item.price;
      existing.regularPrice = item.regularPrice;
      existing.offerPrice = item.price;
      existing.discountPercent = item.discountPercent;
      existing.image = item.image;
      existing.images = [item.image];
      if (item.category) existing.category = item.category;
      await existing.save();
      console.log(`[Updated] ${item.asin} => ${item.name.slice(0, 45)}... | Price: ₹${item.price} (MRP: ₹${item.regularPrice})`);
    } else {
      console.log(`[Not Found] ASIN ${item.asin}`);
    }
  }

  console.log('[Sync] Finished updating Amazon products in database.');
  await mongoose.disconnect();
}

sync().catch(console.error);
