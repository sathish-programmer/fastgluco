const https = require('https');

https.get('https://world.openfoodfacts.org/api/v2/search?categories_tags=en:meals&fields=product_name,nutriments,countries&page_size=3', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('OFF products count:', json.products ? json.products.length : 0);
      if (json.products && json.products.length > 0) {
        console.log('OFF first product:', JSON.stringify(json.products[0], null, 2));
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
    process.exit(0);
  });
});
