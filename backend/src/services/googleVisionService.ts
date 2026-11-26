import fs from 'fs';
import axios from 'axios';

/**
 * Direct Vision label → specific food name mapping.
 * Covers common food labels Google Vision returns for Indian + global foods.
 */
const FOOD_LABEL_MAP: Record<string, string> = {
  // Breads & Bakery
  'cheese garlic bread': 'Cheese Garlic Bread',
  'cheeze garlic bread': 'Cheese Garlic Bread',
  'cheesy garlic bread': 'Cheese Garlic Bread',
  'garlic cheese bread': 'Cheese Garlic Bread',
  'cheese bread': 'Cheese Garlic Bread',
  'garlic bread': 'Garlic Bread',
  'garlic toast': 'Garlic Bread',
  'bread toast': 'Bread Toast',
  'toast': 'Bread Toast',
  'bruschetta': 'Garlic Bread',
  'crostini': 'Garlic Bread',
  'sandwich': 'Grilled Sandwich',
  'grilled sandwich': 'Grilled Sandwich',
  'bread': 'Bread',
  'whole wheat bread': 'Whole Wheat Bread',
  'potato bread': 'Bread',
  'white bread': 'Bread',
  'hamburger': 'Burger',
  'burger': 'Burger',
  'pizza': 'Pizza',

  // Dairy & Cheese
  'cheese': 'Cheese',
  'cheddar cheese': 'Cheese',
  'mozzarella cheese': 'Cheese',
  'parmesan cheese': 'Cheese',
  'cottage cheese': 'Paneer',

  // Rice & Biryani
  'rice': 'Cooked Rice',
  'cooked rice': 'Cooked Rice',
  'steamed rice': 'Cooked Rice',
  'white rice': 'Cooked Rice',
  'basmati rice': 'Cooked Rice',
  'fried rice': 'Fried Rice',
  'biryani': 'Chicken Biryani',
  'chicken biryani': 'Chicken Biryani',
  'mutton biryani': 'Chicken Biryani',
  'veg biryani': 'Chicken Biryani',

  // Indian Breakfast
  'idli': 'Idli',
  'idly': 'Idli',
  'rice cake': 'Idli',
  'steamed rice cake': 'Idli',
  'dosa': 'Plain Dosa',
  'dosai': 'Plain Dosa',
  'masala dosa': 'Masala Dosa',
  'upma': 'Upma',
  'poha': 'Poha',
  'puffed rice': 'Poha',
  'vada': 'Medu Vada',
  'medu vada': 'Medu Vada',
  'vadai': 'Medu Vada',
  'uttapam': 'Uttapam',
  'puri': 'Puri',
  'poori': 'Puri',

  // Flatbreads
  'roti': 'Roti',
  'chapati': 'Chapati',
  'chapathi': 'Chapati',
  'paratha': 'Paratha',
  'parantha': 'Paratha',
  'naan': 'Naan',

  // Sauces & Dips
  'marinara sauce': 'Marinara Sauce',
  'marinara': 'Marinara Sauce',
  'tomato sauce': 'Tomato Sauce',
  'pasta sauce': 'Marinara Sauce',
  'dipping sauce': 'Marinara Sauce',
  'dip': 'Marinara Sauce',
  'tomato salsa': 'Tomato Salsa',
  'salsa': 'Tomato Salsa',

  // Curries & Sides
  'sambar': 'Sambar',
  'dal': 'Dal',
  'lentil soup': 'Dal',
  'curry': 'Vegetable Curry',
  'gravy': 'Vegetable Curry',
  'chutney': 'Coconut Chutney',
  'coconut chutney': 'Coconut Chutney',
  'tomato chutney': 'Coconut Chutney',
  'raita': 'Curd',
  'raitha': 'Curd',
  'paneer': 'Paneer Curry',
  'paneer butter masala': 'Paneer Curry',
  'palak paneer': 'Paneer Curry',

  // Chicken & Meat
  'chicken': 'Chicken Curry',
  'grilled chicken': 'Grilled Chicken',
  'chicken curry': 'Chicken Curry',
  'chicken tikka': 'Grilled Chicken',
  'chicken masala': 'Chicken Curry',
  'butter chicken': 'Chicken Curry',
  'mutton': 'Chicken Curry',
  'meat': 'Chicken Curry',

  // Fish & Seafood
  'fish': 'Fish Curry',
  'fish curry': 'Fish Curry',
  'fried fish': 'Fried Fish',
  'fish fry': 'Fried Fish',
  'grilled fish': 'Fried Fish',
  'roasted fish': 'Fried Fish',
  'seafood': 'Fish Curry',
  'prawn': 'Prawns Curry',
  'shrimp': 'Prawns Curry',
  'crab': 'Fish Curry',

  // Eggs
  'egg': 'Boiled Egg',
  'boiled egg': 'Boiled Egg',
  'fried egg': 'Egg Omelette',
  'omelette': 'Egg Omelette',
  'scrambled egg': 'Egg Omelette',

  // Noodles & Pasta
  'noodles': 'Noodles',
  'noodle': 'Noodles',
  'pasta': 'Pasta',
  'spaghetti': 'Pasta',

  // Snacks & Sweets
  'samosa': 'Samosa',
  'pakora': 'Pakora',
  'bhaji': 'Pakora',
  'chips': 'Mixed Snacks',
  'biscuit': 'Cookies',
  'cookie': 'Cookies',
  'cake': 'Cake',
  'chocolate': 'Chocolate',
  'ice cream': 'Ice Cream',

  // Fruits
  'apple': 'Apple',
  'banana': 'Banana',
  'orange': 'Orange',
  'mango': 'Mango',
  'grapes': 'Fresh Fruit',
  'fruit': 'Fresh Fruit',
  'watermelon': 'Fresh Fruit',
  'papaya': 'Fresh Fruit',

  // Dairy & Drinks
  'milk': 'Whole Milk',
  'curd': 'Curd',
  'yogurt': 'Curd',
  'buttermilk': 'Curd',
  'lassi': 'Curd',
  'tea': 'Chai Tea',
  'chai': 'Chai Tea',
  'coffee': 'Black Coffee',
  'juice': 'Fruit Juice',
  'coconut water': 'Fruit Juice',

  // Salads & Soups
  'salad': 'Garden Salad',
  'soup': 'Vegetable Soup',
};

// Labels to completely ignore (non-food items, generic descriptors, noise)
const IGNORED_LABELS = new Set([
  // Kitchen appliances & equipment
  'barbecue', 'toaster', 'home appliance', 'small appliance', 'kitchen appliance',
  'cooking', 'cookware', 'kitchen utensil', 'frying pan', 'appliance',
  // Containers & Tableware
  'plate', 'spoon', 'bowl', 'table', 'kitchen', 'dish', 'cutlery', 'tableware',
  'container', 'pan', 'pot', 'wok', 'vessel', 'steel', 'serveware', 'platter',
  'tray', 'saucer', 'cup', 'glass', 'fork', 'knife', 'chopsticks',
  // Generic / abstract categories that cause false FatSecret lookups
  'food', 'ingredient', 'cuisine', 'recipe', 'meal', 'produce', 'plant', 'junk food',
  'staple food', 'comfort food', 'street food', 'fast food', 'finger food',
  'side dish', 'side', 'dessert', 'snack', 'sweet', 'sweets', 'gluten',
  'baking', 'breakfast', 'lunch', 'dinner', 'appetizer', 'starter',
  'vegetarian cuisine', 'meat', 'vegetable', 'vegetables', 'condiment', 'spread',
  'herb', 'herbs', 'butter', 'oil', 'garlic butter',
  // Non-food materials & objects
  'furniture', 'wood', 'metal', 'plastic', 'room', 'floor', 'wall', 'counter',
  'countertop', 'surface', 'textile', 'cloth', 'leaf', 'banana leaf', 'person', 'hand',
  'bottle', 'can', 'packaging', 'wrapper', 'bag', 'box',
  // UI & Technology noise (screenshots/photos of screens)
  'gadget', 'screenshot', 'software', 'multimedia', 'mobile phone', 'communication device',
  'electronic device', 'device', 'display device', 'smartphone', 'take-out food', 'take out',
  'takeaway',
  // Alcoholic
  'alcoholic', 'wine', 'beer', 'spirits', 'liquor',
]);

// Food families for parent-child / competing synonym suppression
const FOOD_FAMILIES = [
  ['bread', 'toast', 'garlic bread', 'cheese garlic bread', 'cheeze garlic bread', 'cheesy garlic bread', 'sandwich', 'bruschetta', 'crostini', 'cicchetti', 'bun', 'bagel', 'roti', 'naan', 'paratha', 'chapati', 'kulcha', 'phulka', 'rye', 'cheese', 'roll', 'rolls', 'dinner rolls', 'herb dinner rolls'],
  ['marinara sauce', 'marinara', 'tomato sauce', 'pasta sauce', 'dipping sauce', 'salsa', 'dip', 'chutney', 'sambar', 'raita', 'hummus', 'guacamole'],
  ['rice', 'biryani', 'pulao', 'pilaf', 'fried rice'],
  ['dosa', 'dosai', 'idli', 'idly', 'uttapam', 'appam', 'vada', 'medu vada'],
  ['curry', 'gravy', 'dal', 'sambar', 'korma', 'masala', 'paneer'],
  ['chicken', 'poultry', 'mutton', 'lamb', 'beef', 'pork'],
  ['fish', 'prawn', 'shrimp', 'crab', 'seafood'],
  ['egg', 'omelette'],
  ['salad'],
  ['soup'],
  ['pasta', 'spaghetti', 'noodle', 'noodles', 'macaroni'],
  ['pizza'],
  ['burger', 'hamburger']
];

// Common food keywords to ensure only authentic food items pass through
const FOOD_KEYWORDS = [
  'bread', 'toast', 'rice', 'curry', 'chicken', 'fish', 'egg', 'dal', 'dosa', 'idli',
  'biryani', 'roti', 'paratha', 'sambar', 'chutney', 'paneer', 'mutton',
  'noodle', 'pasta', 'pizza', 'burger', 'sandwich', 'salad', 'soup',
  'fruit', 'vegetable', 'meat', 'seafood', 'prawn', 'shrimp',
  'cake', 'cookie', 'cookies', 'biscuit', 'chocolate', 'yogurt', 'curd', 'milk',
  'tea', 'coffee', 'juice', 'smoothie', 'shake', 'upma', 'poha', 'vada',
  'uttapam', 'puri', 'chapati', 'naan', 'gravy', 'kebab', 'tikka', 'steak',
  'fries', 'potato', 'cheese', 'beans', 'lentil', 'wrap', 'roll', 'oats',
  'corn', 'mushroom', 'beef', 'pork', 'taco', 'burrito', 'pie', 'pasta',
  'marinara', 'sauce', 'dip', 'salsa'
];

export class GoogleVisionService {
  /**
   * Check if text is non-food noise or generic category
   */
  private static isNoise(text: string): boolean {
    const t = text.toLowerCase().trim();
    if (IGNORED_LABELS.has(t)) return true;
    if (t.startsWith('/m/')) return true;
    if (t.endsWith(' cuisine')) return true;
    if (t.length < 3) return true;
    return false;
  }

  /**
   * Strictly verify if a candidate string is an authentic food item
   */
  private static isFoodCandidate(text: string): boolean {
    const lower = text.toLowerCase().trim();
    if (this.isNoise(lower)) return false;
    if (FOOD_LABEL_MAP[lower]) return true;
    for (const key of Object.keys(FOOD_LABEL_MAP)) {
      if (lower.includes(key)) return true;
    }
    for (const kw of FOOD_KEYWORDS) {
      if (lower.includes(kw)) return true;
    }
    for (const family of FOOD_FAMILIES) {
      if (family.some(term => lower.includes(term))) return true;
    }
    return false;
  }

  /**
   * Normalize food name via FOOD_LABEL_MAP or title case
   */
  private static normalizeName(text: string): string {
    const lower = text.toLowerCase().trim();
    if (FOOD_LABEL_MAP[lower]) return FOOD_LABEL_MAP[lower];
    // Sort keys by descending length so "cheese garlic bread" matches before "bread"
    const sortedKeys = Object.keys(FOOD_LABEL_MAP).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (lower === key || lower.includes(key)) return FOOD_LABEL_MAP[key];
    }
    return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /**
   * Determine if two food candidate strings belong to the same food family
   */
  private static shareFamily(a: string, b: string): boolean {
    const al = a.toLowerCase();
    const bl = b.toLowerCase();
    for (const family of FOOD_FAMILIES) {
      if (family.some(term => al.includes(term)) && family.some(term => bl.includes(term))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect food labels from a local image path using the Google Cloud Vision API.
   * Utilizes bestGuessLabels for pinpoint single-dish recognition, and groups/suppresses
   * competing synonym guesses so a plate never produces 4-5 overlapping bread/rice variations.
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
              { type: 'WEB_DETECTION', maxResults: 15 }
            ]
          }]
        }
      );

      const responseItem = response.data?.responses?.[0];
      const bestGuess = responseItem?.webDetection?.bestGuessLabels?.[0]?.label;
      const webEntities = responseItem?.webDetection?.webEntities || [];
      const labelAnnotations = responseItem?.labelAnnotations || [];

      interface Candidate {
        name: string;
        rawName: string;
        confidence: number;
        priority: number; // 1 = bestGuess, 2 = webEntity, 3 = label
      }

      const rawCandidates: Candidate[] = [];

      // 1. Highest Priority: Google Vision Best Guess (pinpoint dish identification)
      if (bestGuess && this.isFoodCandidate(bestGuess)) {
        rawCandidates.push({
          name: this.normalizeName(bestGuess),
          rawName: bestGuess.toLowerCase().trim(),
          confidence: 95,
          priority: 1
        });
      }

      // 2. High Priority: Web Entities (specific dish concepts)
      for (const w of webEntities) {
        if (!w.description || !this.isFoodCandidate(w.description)) continue;
        if (w.score && w.score >= 0.5) {
          rawCandidates.push({
            name: this.normalizeName(w.description),
            rawName: w.description.toLowerCase().trim(),
            confidence: Math.round(w.score * 100),
            priority: 2
          });
        }
      }

      // 3. Medium Priority: Label Annotations (general taxonomy tags)
      for (const l of labelAnnotations) {
        if (!l.description || !this.isFoodCandidate(l.description)) continue;
        if (l.score && l.score >= 0.55) {
          rawCandidates.push({
            name: this.normalizeName(l.description),
            rawName: l.description.toLowerCase().trim(),
            confidence: Math.round(l.score * 100),
            priority: 3
          });
        }
      }

      if (rawCandidates.length === 0) {
        console.warn('No food candidates found in Google Vision output.');
        return [];
      }

      // 4. Smart Sibling & Parent Suppression:
      // If candidates belong to the same food family or have substring overlap,
      // retain ONLY the most specific / highest priority item.
      const finalItems: Candidate[] = [];

      for (const c of rawCandidates) {
        const existingIndex = finalItems.findIndex(existing => {
          const eName = existing.name.toLowerCase();
          const cName = c.name.toLowerCase();
          if (eName === cName) return true;
          if (eName.includes(cName) || cName.includes(eName)) return true;
          if (this.shareFamily(eName, cName)) return true;
          return false;
        });

        if (existingIndex === -1) {
          finalItems.push(c);
        } else {
          const existing = finalItems[existingIndex];
          // Determine if current candidate is more specific or higher priority
          const isCurrentBetter =
            (c.priority < existing.priority) ||
            (c.priority === existing.priority && c.name.split(' ').length > existing.name.split(' ').length) ||
            (c.priority === existing.priority && c.confidence > existing.confidence);

          if (isCurrentBetter) {
            finalItems[existingIndex] = c;
          }
        }
      }

      // Sort by confidence, return top distinct food items (max 3 distinct items)
      const sorted = finalItems
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3)
        .map(i => ({ name: i.name, confidence: i.confidence }));

      console.log('GoogleVisionService detected food labels:', sorted.map(u => `${u.name} (${u.confidence.toFixed(0)}%)`));
      return sorted;

    } catch (error: any) {
      console.error('Error in GoogleVisionService.detectFoodLabels:', error.message || error);
      return [];
    }
  }
}
