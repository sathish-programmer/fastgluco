require('dotenv').config();
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET || 'fallback_secret_key_12345!';
const token = jwt.sign({ id: '123', email: 'admin@admin.com', role: 'SuperAdmin' }, secret);
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5005,
  path: '/api/labs/admin/labs',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
req.on('error', e => console.error(e));
req.end();
