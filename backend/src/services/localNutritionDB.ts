/**
 * Local Nutrition Database - fallback when FatSecret is unavailable.
 * Covers the most common Indian and global foods with accurate macros.
 * Data source: USDA FoodData Central & Indian Council of Medical Research.
 */

export interface NutritionData {
  calories: number;  // per 100g
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  servingSize: number;
  servingUnit: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Drinks';
}

const NUTRITION_DB: Record<string, NutritionData> = {
  // ─── Breads & Toasts ───────────────────────────────────────
  'grilled sandwich': { calories: 250, carbs: 28, protein: 10, fat: 11, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'bread toast': { calories: 270, carbs: 50, protein: 9, fat: 4, fiber: 2, servingSize: 1, servingUnit: 'slice', category: 'Breakfast' },
  'sandwich': { calories: 250, carbs: 28, protein: 10, fat: 11, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'toast': { calories: 270, carbs: 50, protein: 9, fat: 4, fiber: 2, servingSize: 1, servingUnit: 'slice', category: 'Breakfast' },
  'bread': { calories: 265, carbs: 49, protein: 9, fat: 3, fiber: 3, servingSize: 1, servingUnit: 'slice', category: 'Breakfast' },
  'whole wheat bread': { calories: 247, carbs: 41, protein: 13, fat: 4, fiber: 7, servingSize: 1, servingUnit: 'slice', category: 'Breakfast' },
  'potato bread': { calories: 266, carbs: 50, protein: 8, fat: 4, fiber: 2, servingSize: 1, servingUnit: 'slice', category: 'Breakfast' },
  'burger': { calories: 295, carbs: 24, protein: 17, fat: 14, fiber: 1, servingSize: 150, servingUnit: 'g', category: 'Snacks' },
  'pizza': { calories: 266, carbs: 33, protein: 11, fat: 10, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },

  // ─── Indian Breakfast ──────────────────────────────────────
  'idli': { calories: 58, carbs: 12, protein: 2, fat: 0, fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'plain dosa': { calories: 133, carbs: 25, protein: 4, fat: 2, fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'masala dosa': { calories: 195, carbs: 30, protein: 5, fat: 6, fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'dosa': { calories: 133, carbs: 25, protein: 4, fat: 2, fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'upma': { calories: 135, carbs: 25, protein: 4, fat: 3, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'poha': { calories: 130, carbs: 28, protein: 3, fat: 1, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'medu vada': { calories: 175, carbs: 21, protein: 7, fat: 7, fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'vada': { calories: 175, carbs: 21, protein: 7, fat: 7, fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'uttapam': { calories: 118, carbs: 20, protein: 4, fat: 3, fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'paratha': { calories: 297, carbs: 36, protein: 7, fat: 14, fiber: 3, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'chapati': { calories: 120, carbs: 21, protein: 4, fat: 3, fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'roti': { calories: 120, carbs: 21, protein: 4, fat: 3, fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'puri': { calories: 165, carbs: 20, protein: 3, fat: 8, fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },

  // ─── Rice & Indian Mains ───────────────────────────────────
  'cooked rice': { calories: 130, carbs: 28, protein: 3, fat: 0, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'rice': { calories: 130, carbs: 28, protein: 3, fat: 0, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'fried rice': { calories: 163, carbs: 28, protein: 4, fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'chicken biryani': { calories: 172, carbs: 22, protein: 11, fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'biryani': { calories: 172, carbs: 22, protein: 11, fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'sambar': { calories: 50, carbs: 8, protein: 3, fat: 1, fiber: 2, servingSize: 100, servingUnit: 'ml', category: 'Lunch' },
  'dal': { calories: 116, carbs: 20, protein: 8, fat: 1, fiber: 4, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'vegetable curry': { calories: 97, carbs: 12, protein: 3, fat: 4, fiber: 3, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'chicken curry': { calories: 165, carbs: 4, protein: 21, fat: 7, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'paneer curry': { calories: 260, carbs: 8, protein: 15, fat: 19, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'coconut chutney': { calories: 120, carbs: 8, protein: 2, fat: 9, fiber: 3, servingSize: 30, servingUnit: 'g', category: 'Snacks' },

  // ─── Eggs & Proteins ───────────────────────────────────────
  'boiled egg': { calories: 78, carbs: 1, protein: 6, fat: 5, fiber: 0, servingSize: 1, servingUnit: 'egg', category: 'Breakfast' },
  'egg omelette': { calories: 154, carbs: 1, protein: 11, fat: 12, fiber: 0, servingSize: 1, servingUnit: 'piece', category: 'Breakfast' },
  'scrambled egg': { calories: 148, carbs: 1, protein: 10, fat: 11, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'grilled chicken': { calories: 165, carbs: 0, protein: 31, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'chicken': { calories: 165, carbs: 0, protein: 31, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'fish curry': { calories: 130, carbs: 4, protein: 18, fat: 5, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'fried fish': { calories: 196, carbs: 5, protein: 22, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'prawns curry': { calories: 115, carbs: 3, protein: 18, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'fish fry': { calories: 196, carbs: 5, protein: 22, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Lunch' },

  // ─── Pasta & Noodles ───────────────────────────────────────
  'pasta': { calories: 158, carbs: 31, protein: 6, fat: 1, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'noodles': { calories: 138, carbs: 25, protein: 5, fat: 2, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },

  // ─── Snacks ────────────────────────────────────────────────
  'mixed snacks': { calories: 450, carbs: 60, protein: 8, fat: 20, fiber: 3, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'cookies': { calories: 450, carbs: 65, protein: 6, fat: 20, fiber: 2, servingSize: 30, servingUnit: 'g', category: 'Snacks' },
  'cake': { calories: 350, carbs: 55, protein: 4, fat: 13, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'chocolate': { calories: 546, carbs: 60, protein: 5, fat: 31, fiber: 7, servingSize: 30, servingUnit: 'g', category: 'Snacks' },
  'ice cream': { calories: 207, carbs: 24, protein: 4, fat: 11, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Snacks' },

  // ─── Fruits ────────────────────────────────────────────────
  'fresh fruit': { calories: 65, carbs: 15, protein: 1, fat: 0, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'apple': { calories: 52, carbs: 14, protein: 0, fat: 0, fiber: 2, servingSize: 1, servingUnit: 'medium', category: 'Snacks' },
  'banana': { calories: 89, carbs: 23, protein: 1, fat: 0, fiber: 3, servingSize: 1, servingUnit: 'medium', category: 'Snacks' },
  'orange': { calories: 47, carbs: 12, protein: 1, fat: 0, fiber: 2, servingSize: 1, servingUnit: 'medium', category: 'Snacks' },
  'mango': { calories: 60, carbs: 15, protein: 1, fat: 0, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },

  // ─── Dairy & Drinks ────────────────────────────────────────
  'whole milk': { calories: 61, carbs: 5, protein: 3, fat: 3, fiber: 0, servingSize: 200, servingUnit: 'ml', category: 'Drinks' },
  'curd': { calories: 98, carbs: 4, protein: 11, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'yogurt': { calories: 98, carbs: 4, protein: 11, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Breakfast' },
  'chai tea': { calories: 50, carbs: 7, protein: 2, fat: 2, fiber: 0, servingSize: 150, servingUnit: 'ml', category: 'Drinks' },
  'black coffee': { calories: 5, carbs: 1, protein: 0, fat: 0, fiber: 0, servingSize: 240, servingUnit: 'ml', category: 'Drinks' },
  'fruit juice': { calories: 46, carbs: 11, protein: 1, fat: 0, fiber: 0, servingSize: 200, servingUnit: 'ml', category: 'Drinks' },

  // ─── Garden Salad ──────────────────────────────────────────
  'garden salad': { calories: 15, carbs: 3, protein: 1, fat: 0, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Lunch' },
  'vegetable soup': { calories: 42, carbs: 8, protein: 2, fat: 1, fiber: 2, servingSize: 250, servingUnit: 'ml', category: 'Lunch' },
};

/**
 * Look up nutrition data by food name (case-insensitive, fuzzy match).
 * Returns null if no match found.
 */
export function lookupNutrition(foodName: string): NutritionData | null {
  const key = foodName.toLowerCase().trim();

  // 1. Exact match
  if (NUTRITION_DB[key]) return NUTRITION_DB[key];

  // 2. Partial match (input contains a key or key contains input)
  for (const [dbKey, data] of Object.entries(NUTRITION_DB)) {
    if (key.includes(dbKey) || dbKey.includes(key)) {
      return data;
    }
  }

  return null;
}
