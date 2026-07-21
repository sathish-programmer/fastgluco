import fs from 'fs';
import axios from 'axios';

/**
 * Direct Vision label → specific food name mapping.
 * Covers common food labels Google Vision returns for Indian + global foods.
 * ANY label not in this map that sounds food-like will still pass through as-is.
 */
const FOOD_LABEL_MAP: Record<string, string> = {
  // Breads
  'bread toast': 'Bread Toast', 'toast': 'Bread Toast',
  'sandwich': 'Grilled Sandwich', 'grilled sandwich': 'Grilled Sandwich',
  'bread': 'Bread', 'whole wheat bread': 'Whole Wheat Bread',
  'potato bread': 'Bread', 'white bread': 'Bread',
  'hamburger': 'Burger', 'burger': 'Burger',
  'pizza': 'Pizza',
  // Rice & Biryani
  'rice': 'Cooked Rice', 'cooked rice': 'Cooked Rice', 'steamed rice': 'Cooked Rice',
  'white rice': 'Cooked Rice', 'basmati rice': 'Cooked Rice',
  'fried rice': 'Fried Rice',
  'biryani': 'Chicken Biryani', 'chicken biryani': 'Chicken Biryani',
  'mutton biryani': 'Chicken Biryani', 'veg biryani': 'Chicken Biryani',
  // Indian Breakfast
  'idli': 'Idli', 'idly': 'Idli', 'rice cake': 'Idli', 'steamed rice cake': 'Idli',
  'dosa': 'Plain Dosa', 'dosai': 'Plain Dosa', 'masala dosa': 'Masala Dosa',
  'upma': 'Upma', 'poha': 'Poha', 'puffed rice': 'Poha',
  'vada': 'Medu Vada', 'medu vada': 'Medu Vada', 'vadai': 'Medu Vada',
  'uttapam': 'Uttapam',
  'puri': 'Puri', 'poori': 'Puri',
  // Flatbreads
  'roti': 'Roti', 'chapati': 'Chapati', 'chapathi': 'Chapati',
  'paratha': 'Paratha', 'parantha': 'Paratha',
  'naan': 'Naan',
  // Curries & Sides
  'sambar': 'Sambar', 'dal': 'Dal', 'lentil soup': 'Dal',
  'curry': 'Vegetable Curry', 'gravy': 'Vegetable Curry',
  'chutney': 'Coconut Chutney', 'coconut chutney': 'Coconut Chutney',
  'tomato chutney': 'Coconut Chutney',
  'raita': 'Curd', 'raitha': 'Curd',
  'paneer': 'Paneer Curry', 'paneer butter masala': 'Paneer Curry',
  'palak paneer': 'Paneer Curry',
  // Chicken & Meat
  'chicken': 'Chicken Curry', 'grilled chicken': 'Grilled Chicken',
  'chicken curry': 'Chicken Curry', 'chicken tikka': 'Grilled Chicken',
  'chicken masala': 'Chicken Curry', 'butter chicken': 'Chicken Curry',
  'mutton': 'Chicken Curry', 'meat': 'Chicken Curry',
  // Fish & Seafood
  'fish': 'Fish Curry', 'fish curry': 'Fish Curry',
  'fried fish': 'Fried Fish', 'fish fry': 'Fried Fish',
  'grilled fish': 'Fried Fish', 'roasted fish': 'Fried Fish',
  'seafood': 'Fish Curry', 'prawn': 'Prawns Curry',
  'shrimp': 'Prawns Curry', 'crab': 'Fish Curry',
  // Eggs
  'egg': 'Boiled Egg', 'boiled egg': 'Boiled Egg', 'fried egg': 'Egg Omelette',
  'omelette': 'Egg Omelette', 'scrambled egg': 'Egg Omelette',
  // Noodles & Pasta
  'noodles': 'Noodles', 'noodle': 'Noodles',
  'pasta': 'Pasta', 'spaghetti': 'Pasta',
  // Snacks
  'samosa': 'Samosa', 'pakora': 'Pakora', 'bhaji': 'Pakora',
  'chips': 'Mixed Snacks', 'biscuit': 'Cookies', 'cookie': 'Cookies',
  'cake': 'Cake', 'chocolate': 'Chocolate', 'ice cream': 'Ice Cream',
  // Fruits
  'apple': 'Apple', 'banana': 'Banana', 'orange': 'Orange',
  'mango': 'Mango', 'grapes': 'Fresh Fruit', 'fruit': 'Fresh Fruit',
  'watermelon': 'Fresh Fruit', 'papaya': 'Fresh Fruit',
  // Dairy & Drinks
  'milk': 'Whole Milk', 'curd': 'Curd', 'yogurt': 'Curd',
  'buttermilk': 'Curd', 'lassi': 'Curd',
  'tea': 'Chai Tea', 'chai': 'Chai Tea', 'coffee': 'Black Coffee',
  'juice': 'Fruit Juice', 'coconut water': 'Fruit Juice',
  // Salads & Soups
  'salad': 'Garden Salad', 'soup': 'Vegetable Soup',
};

// Labels to completely ignore (non-food items)
const IGNORED_LABELS = [
  // Kitchen appliances & equipment
  'barbecue', 'toaster', 'home appliance', 'small appliance', 'kitchen appliance',
  'cooking', 'cookware', 'kitchen utensil', 'frying pan', 'appliance',
  // Containers
  'plate', 'spoon', 'bowl', 'table', 'kitchen', 'dish', 'cutlery', 'tableware',
  'container', 'pan', 'pot', 'wok', 'vessel', 'steel',
  // Generic / abstract (these give false FatSecret results)
  'food', 'ingredient', 'cuisine', 'recipe', 'meal', 'produce', 'plant', 'junk food',
  'staple food', 'comfort food', 'street food', 'fast food',
  // Non-food
  'furniture', 'wood', 'metal', 'plastic', 'room', 'floor', 'wall', 'counter',
  'surface', 'textile', 'cloth', 'leaf', 'banana leaf', 'person', 'hand',
  'bottle', 'can', 'packaging', 'wrapper', 'bag', 'box',
  // Alcoholic
  'alcoholic', 'wine', 'beer', 'spirits', 'liquor',
];

// Words that indicate food-related labels we should include even if not in map
const FOOD_KEYWORDS = [
  'rice', 'bread', 'curry', 'chicken', 'fish', 'egg', 'dal', 'dosa', 'idli',
  'biryani', 'roti', 'paratha', 'sambar', 'chutney', 'paneer', 'mutton',
  'noodle', 'pasta', 'pizza', 'burger', 'sandwich', 'salad', 'soup',
  'fruit', 'vegetable', 'meat', 'seafood', 'prawn', 'shrimp',
  'cake', 'cookie', 'chocolate', 'snack', 'sweet', 'dessert',
  'milk', 'yogurt', 'curd', 'tea', 'coffee', 'juice',
  'upma', 'poha', 'vada', 'uttapam', 'puri', 'chapati',
];

export class GoogleVisionService {
  /**
   * Detect food labels from a local image path using the Google Cloud Vision API.
   * Returns all detected food items — no hardcoded combination logic.
   */
  public static async detectFoodLabels(imagePath: string): Promise<Array<{ name: string; confidence: number }>> {
    try {
      const apiKey = process.env.GOOGLE_VISION_API_KEY;
      if (!apiKey) {
        console.error('GOOGLE_VISION_API_KEY is missing in environment variables.');
        return [];
      }

      if (!fs.existsSync(imagePath)) {
        console.error(`Image file does not exist: ${imagePath}`);
        return [];
      }

      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          requests: [{
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'WEB_DETECTION', maxResults: 10 }
            ]
          }]
        }
      );

      const responseItem = response.data?.responses?.[0];
      const labelAnnotations = responseItem?.labelAnnotations || [];
      const webEntities = responseItem?.webDetection?.webEntities || [];

      // Gather all raw labels
      const rawLabels: Array<{ name: string; confidence: number }> = [
        ...labelAnnotations.map((l: any) => ({
          name: (l.description || '').toLowerCase().trim(),
          confidence: (l.score || 0) * 100
        })),
        ...webEntities
          .filter((e: any) => e.score > 0.4 && e.description)
          .map((e: any) => ({
            name: (e.description || '').toLowerCase().trim(),
            confidence: e.score * 100
          }))
      ];

      if (rawLabels.length === 0) {
        console.warn('No labels returned from Google Vision API.');
        return [];
      }

      // Process ALL labels independently — no break, accumulate all matches
      const results: Array<{ name: string; confidence: number }> = [];
      const seenNames = new Set<string>();

      for (const item of rawLabels) {
        const nameLower = item.name;

        // Skip if confidence too low
        if (item.confidence < 55) continue;

        // Skip non-food / ignored labels
        if (IGNORED_LABELS.some(ignored => nameLower.includes(ignored))) continue;

        // Check direct map first (most specific)
        const mappedName = FOOD_LABEL_MAP[nameLower];
        if (mappedName) {
          if (!seenNames.has(mappedName)) {
            seenNames.add(mappedName);
            results.push({ name: mappedName, confidence: item.confidence });
          }
          continue;
        }

        // Check partial map match (e.g. "south indian idli" → find "idli" key)
        let partialMatch: string | null = null;
        for (const [key, value] of Object.entries(FOOD_LABEL_MAP)) {
          if (nameLower.includes(key) || key.includes(nameLower)) {
            partialMatch = value;
            break;
          }
        }
        if (partialMatch && !seenNames.has(partialMatch)) {
          seenNames.add(partialMatch);
          results.push({ name: partialMatch, confidence: item.confidence });
          continue;
        }

        // Pass through if contains a food keyword (capitalize for display)
        const hasFoodKeyword = FOOD_KEYWORDS.some(kw => nameLower.includes(kw));
        if (hasFoodKeyword) {
          const displayName = this.capitalize(nameLower);
          if (!seenNames.has(displayName)) {
            seenNames.add(displayName);
            results.push({ name: displayName, confidence: item.confidence });
          }
        }
      }

      // Sort by confidence, return top 5
      const sorted = results.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
      console.log('GoogleVisionService detected food labels:', sorted.map(u => `${u.name} (${u.confidence.toFixed(0)}%)`));
      return sorted;

    } catch (error: any) {
      console.error('Error in GoogleVisionService.detectFoodLabels:', error.message || error);
      return [];
    }
  }

  private static capitalize(str: string): string {
    return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
