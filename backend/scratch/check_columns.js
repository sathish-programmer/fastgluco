const fs = require('fs');
const https = require('https');
const { parse } = require('csv-parse/sync');

https.get('https://cdn.jsdelivr.net/npm/@ifct2017/compositions/index.csv', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const records = parse(data, {
      columns: true,
      skip_empty_lines: true
    });
    console.log('Record 0:', records[0]);
    process.exit(0);
  });
});
