const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://localhost:27017/fastgluco');
  const db = mongoose.connection;
  const config = await db.collection('paymentgatewayconfigs').findOne({});
  console.log('Branding Config in DB:', config);
  process.exit(0);
}

check();
