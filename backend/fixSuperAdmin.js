/**
 * One-shot script to fix the SuperAdmin role for superadmin@gmail.com
 * Run from the backend directory:
 *   node fixSuperAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

async function fix() {
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const result = await mongoose.connection.collection('adminusers').updateOne(
    { email: 'superadmin@gmail.com' },
    { $set: { role: 'SuperAdmin' } }
  );

  if (result.matchedCount === 0) {
    console.error('❌ No admin user found with email superadmin@gmail.com');
  } else if (result.modifiedCount === 0) {
    console.log('ℹ️  Role was already SuperAdmin — no change needed.');
  } else {
    console.log('✅ Role updated to SuperAdmin for superadmin@gmail.com');
  }

  await mongoose.disconnect();
  console.log('✅ Done. Please log out and log back in to get a fresh token.');
}

fix().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
