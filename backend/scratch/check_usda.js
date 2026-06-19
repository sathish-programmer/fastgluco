const https = require('https');

https.get('https://api.nal.usda.gov/fdc/v1/foods/list?api_key=DEMO_KEY&dataType=Foundation,SR%20Legacy&pageSize=5', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const itemsWithNutrients = json.filter(item => item.foodNutrients && item.foodNutrients.length > 0);
      console.log('Count with nutrients:', itemsWithNutrients.length);
      if (itemsWithNutrients.length > 0) {
        console.log('USDA item with nutrients:', JSON.stringify(itemsWithNutrients[0], null, 2));
      } else {
        console.log('No nutrients found in first 5. All items:', JSON.stringify(json.slice(0, 3), null, 2));
      }
    } catch (e) {
      console.log('Error parsing JSON:', e.message);
    }
    process.exit(0);
  });
});
