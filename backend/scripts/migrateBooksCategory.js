const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';

async function migrate() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');
  const coll = mongoose.connection.collection('shopproducts');

  // Fix non-books that got accidentally tagged
  await coll.updateMany(
    { name: /Women.*Nutri Mix/i },
    { $set: { category: 'Arivu in nutrition', subcategory: '' } }
  );
  await coll.updateMany(
    { name: /Headscarves/i },
    { $set: { category: 'Cancer support wig', subcategory: '' } }
  );

  // 1. Elderly Memory Books
  const elderlyTitles = [
    'Memory Games for Seniors',
    'Large Piece Puzzle for Seniors',
    'Brain Games for Seniors',
    'Memory Activity Book for Seniors',
    'The Complete Memory Sharpener for Healthy Aging'
  ];
  for (const title of elderlyTitles) {
    await coll.updateMany(
      { name: new RegExp(title, 'i') },
      { $set: { category: 'Books', subcategory: 'Books for elderly memory' } }
    );
  }

  // 2. Women Health Books
  const womenBookTitles = [
    'Inside The Menopause Brain',
    'The Menopause Gut',
    'Self-Help for Premenstrual Syndrome',
    'Recipes for Health – PMS',
    'AN AYURVEDIC AND MODERN OVERVIEW Of PREMENSTRUAL SYNDROME'
  ];
  for (const title of womenBookTitles) {
    await coll.updateMany(
      { name: new RegExp(title, 'i') },
      { $set: { category: 'Books', subcategory: 'Books for women health' } }
    );
  }

  // 3. Natural Antioxidant Food Books
  const foodBookTitles = [
    'Vegan Diet: Quick and Easy Paleo Vegan Recipes',
    'Superfood Recipes: Super Foods Healthy Recipes Book',
    'Nature Cure Through Fruits And Vegetables',
    'The Antioxidant Save-Your-Life Cookbook',
    'Cooking Well Beautiful Skin',
    'The Antioxidant Counter',
    'Anti-Inflammatory & Antioxidant Diet',
    'Natural Antioxidants in Clinical Practice',
    'The Antioxidant Miracle',
    'The Ultimate Guide to Antioxidants & DNA Protection'
  ];
  for (const title of foodBookTitles) {
    await coll.updateMany(
      { name: new RegExp(title, 'i') },
      { $set: { category: 'Books', subcategory: 'Books on natural antioxidant food' } }
    );
  }

  const books = await coll.find({ category: 'Books' }).project({ name: 1, category: 1, subcategory: 1 }).toArray();
  console.log('--- FINAL BOOKS IN DB (Total: ' + books.length + ') ---');
  books.forEach(b => console.log(' -> [' + b.subcategory + '] ' + b.name));

  const antioxidants = await coll.find({ category: 'Antioxidants' }).project({ name: 1, category: 1, subcategory: 1 }).toArray();
  console.log('--- FINAL ANTIOXIDANTS IN DB (Total: ' + antioxidants.length + ') ---');
  antioxidants.forEach(a => console.log(' -> ' + a.name));

  await mongoose.disconnect();
}

migrate().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
