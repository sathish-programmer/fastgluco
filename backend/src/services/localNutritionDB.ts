/**
 * Local Nutrition Database - fallback when FatSecret is unavailable.
 * Covers the most common Indian and global foods with accurate macros.
 * Data source: USDA FoodData Central & Indian Council of Medical Research.
 *
 * IMPORTANT: category values must match FoodLog model enum:
 * 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Vegetables' |
 * 'Beverages' | 'Dairy' | 'Non-Veg' | 'Sweets' | 'Custom'
 */

export interface NutritionData {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  servingSize: number;
  servingUnit: string;
  category: string;  // Open string — matches FoodLog model (no enum restriction)
}

const NUTRITION_DB: Record<string, NutritionData> = {
  // ─── Breads & Toasts ───────────────────────────────────────
  'grilled sandwich': { calories: 250, carbs: 28, protein: 10, fat: 11, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'bread toast':      { calories: 270, carbs: 50, protein: 9,  fat: 4,  fiber: 2, servingSize: 1,   servingUnit: 'slice', category: 'Snacks' },
  'sandwich':         { calories: 250, carbs: 28, protein: 10, fat: 11, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'toast':            { calories: 270, carbs: 50, protein: 9,  fat: 4,  fiber: 2, servingSize: 1,   servingUnit: 'slice', category: 'Snacks' },
  'bread':            { calories: 265, carbs: 49, protein: 9,  fat: 3,  fiber: 3, servingSize: 1,   servingUnit: 'slice', category: 'Snacks' },
  'whole wheat bread':{ calories: 247, carbs: 41, protein: 13, fat: 4,  fiber: 7, servingSize: 1,   servingUnit: 'slice', category: 'Snacks' },
  'potato bread':     { calories: 266, carbs: 50, protein: 8,  fat: 4,  fiber: 2, servingSize: 1,   servingUnit: 'slice', category: 'Snacks' },
  'burger':           { calories: 295, carbs: 24, protein: 17, fat: 14, fiber: 1, servingSize: 150, servingUnit: 'g', category: 'Snacks' },
  'pizza':            { calories: 266, carbs: 33, protein: 11, fat: 10, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'naan':             { calories: 262, carbs: 45, protein: 9,  fat: 5,  fiber: 2, servingSize: 1,   servingUnit: 'piece', category: 'North Indian' },

  // ─── South Indian Breakfast ────────────────────────────────
  'idli':        { calories: 58,  carbs: 12, protein: 2, fat: 0, fiber: 1, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'plain dosa':  { calories: 133, carbs: 25, protein: 4, fat: 2, fiber: 1, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'masala dosa': { calories: 195, carbs: 30, protein: 5, fat: 6, fiber: 2, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'dosa':        { calories: 133, carbs: 25, protein: 4, fat: 2, fiber: 1, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'upma':        { calories: 135, carbs: 25, protein: 4, fat: 3, fiber: 2, servingSize: 100, servingUnit: 'g',     category: 'South Indian' },
  'poha':        { calories: 130, carbs: 28, protein: 3, fat: 1, fiber: 1, servingSize: 100, servingUnit: 'g',     category: 'South Indian' },
  'medu vada':   { calories: 175, carbs: 21, protein: 7, fat: 7, fiber: 2, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'vada':        { calories: 175, carbs: 21, protein: 7, fat: 7, fiber: 2, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'uttapam':     { calories: 118, carbs: 20, protein: 4, fat: 3, fiber: 1, servingSize: 1,   servingUnit: 'piece', category: 'South Indian' },
  'sambar':      { calories: 50,  carbs: 8,  protein: 3, fat: 1, fiber: 2, servingSize: 100, servingUnit: 'ml',    category: 'South Indian' },
  'coconut chutney': { calories: 120, carbs: 8, protein: 2, fat: 9, fiber: 3, servingSize: 30, servingUnit: 'g', category: 'South Indian' },

  // ─── North Indian Breads ───────────────────────────────────
  'paratha':  { calories: 297, carbs: 36, protein: 7, fat: 14, fiber: 3, servingSize: 1, servingUnit: 'piece', category: 'North Indian' },
  'chapati':  { calories: 120, carbs: 21, protein: 4, fat: 3,  fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'North Indian' },
  'roti':     { calories: 120, carbs: 21, protein: 4, fat: 3,  fiber: 2, servingSize: 1, servingUnit: 'piece', category: 'North Indian' },
  'puri':     { calories: 165, carbs: 20, protein: 3, fat: 8,  fiber: 1, servingSize: 1, servingUnit: 'piece', category: 'North Indian' },

  // ─── Rice & Indian Mains ───────────────────────────────────
  'cooked rice':    { calories: 130, carbs: 28, protein: 3,  fat: 0, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'South Indian' },
  'rice':           { calories: 130, carbs: 28, protein: 3,  fat: 0, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'South Indian' },
  'fried rice':     { calories: 163, carbs: 28, protein: 4,  fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Custom' },
  'chicken biryani':{ calories: 172, carbs: 22, protein: 11, fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Non-Veg' },
  'biryani':        { calories: 172, carbs: 22, protein: 11, fat: 4, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Non-Veg' },
  'dal':            { calories: 116, carbs: 20, protein: 8,  fat: 1, fiber: 4, servingSize: 100, servingUnit: 'g', category: 'North Indian' },
  'vegetable curry':{ calories: 97,  carbs: 12, protein: 3,  fat: 4, fiber: 3, servingSize: 100, servingUnit: 'g', category: 'Vegetables' },
  'chicken curry':  { calories: 165, carbs: 4,  protein: 21, fat: 7, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Non-Veg' },
  'paneer curry':   { calories: 260, carbs: 8,  protein: 15, fat: 19,fiber: 1, servingSize: 100, servingUnit: 'g', category: 'North Indian' },

  // ─── Eggs & Proteins ───────────────────────────────────────
  'boiled egg':     { calories: 78,  carbs: 1, protein: 6,  fat: 5,  fiber: 0, servingSize: 1,   servingUnit: 'egg',   category: 'Non-Veg' },
  'egg omelette':   { calories: 154, carbs: 1, protein: 11, fat: 12, fiber: 0, servingSize: 1,   servingUnit: 'piece', category: 'Non-Veg' },
  'scrambled egg':  { calories: 148, carbs: 1, protein: 10, fat: 11, fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'grilled chicken':{ calories: 165, carbs: 0, protein: 31, fat: 4,  fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'chicken':        { calories: 165, carbs: 0, protein: 31, fat: 4,  fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'fish curry':     { calories: 130, carbs: 4, protein: 18, fat: 5,  fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'fried fish':     { calories: 196, carbs: 5, protein: 22, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'prawns curry':   { calories: 115, carbs: 3, protein: 18, fat: 4,  fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },
  'fish fry':       { calories: 196, carbs: 5, protein: 22, fat: 10, fiber: 0, servingSize: 100, servingUnit: 'g',     category: 'Non-Veg' },

  // ─── Pasta & Noodles ───────────────────────────────────────
  'pasta':   { calories: 158, carbs: 31, protein: 6, fat: 1, fiber: 2, servingSize: 100, servingUnit: 'g', category: 'Custom' },
  'noodles': { calories: 138, carbs: 25, protein: 5, fat: 2, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Custom' },

  // ─── Snacks & Sweets ───────────────────────────────────────
  'mixed snacks': { calories: 450, carbs: 60, protein: 8, fat: 20, fiber: 3, servingSize: 100, servingUnit: 'g', category: 'Snacks' },
  'cookies':      { calories: 450, carbs: 65, protein: 6, fat: 20, fiber: 2, servingSize: 30,  servingUnit: 'g', category: 'Snacks' },
  'cake':         { calories: 350, carbs: 55, protein: 4, fat: 13, fiber: 1, servingSize: 100, servingUnit: 'g', category: 'Sweets' },
  'chocolate':    { calories: 546, carbs: 60, protein: 5, fat: 31, fiber: 7, servingSize: 30,  servingUnit: 'g', category: 'Sweets' },
  'ice cream':    { calories: 207, carbs: 24, protein: 4, fat: 11, fiber: 0, servingSize: 100, servingUnit: 'g', category: 'Sweets' },

  // ─── Fruits ────────────────────────────────────────────────
  'fresh fruit': { calories: 65, carbs: 15, protein: 1, fat: 0, fiber: 2, servingSize: 100, servingUnit: 'g',      category: 'Fruits' },
  'apple':       { calories: 52, carbs: 14, protein: 0, fat: 0, fiber: 2, servingSize: 1,   servingUnit: 'medium', category: 'Fruits' },
  'banana':      { calories: 89, carbs: 23, protein: 1, fat: 0, fiber: 3, servingSize: 1,   servingUnit: 'medium', category: 'Fruits' },
  'orange':      { calories: 47, carbs: 12, protein: 1, fat: 0, fiber: 2, servingSize: 1,   servingUnit: 'medium', category: 'Fruits' },
  'mango':       { calories: 60, carbs: 15, protein: 1, fat: 0, fiber: 2, servingSize: 100, servingUnit: 'g',      category: 'Fruits' },

  // ─── Dairy ─────────────────────────────────────────────────
  'whole milk': { calories: 61, carbs: 5, protein: 3,  fat: 3, fiber: 0, servingSize: 200, servingUnit: 'ml', category: 'Dairy' },
  'curd':       { calories: 98, carbs: 4, protein: 11, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g',  category: 'Dairy' },
  'yogurt':     { calories: 98, carbs: 4, protein: 11, fat: 4, fiber: 0, servingSize: 100, servingUnit: 'g',  category: 'Dairy' },

  // ─── Beverages ─────────────────────────────────────────────
  'chai tea':    { calories: 50, carbs: 7,  protein: 2, fat: 2, fiber: 0, servingSize: 150, servingUnit: 'ml', category: 'Beverages' },
  'black coffee':{ calories: 5,  carbs: 1,  protein: 0, fat: 0, fiber: 0, servingSize: 240, servingUnit: 'ml', category: 'Beverages' },
  'fruit juice': { calories: 46, carbs: 11, protein: 1, fat: 0, fiber: 0, servingSize: 200, servingUnit: 'ml', category: 'Beverages' },

  // ─── Vegetables & Salads ───────────────────────────────────
  'garden salad':   { calories: 15, carbs: 3, protein: 1, fat: 0, fiber: 1, servingSize: 100, servingUnit: 'g',  category: 'Vegetables' },
  'vegetable soup': { calories: 42, carbs: 8, protein: 2, fat: 1, fiber: 2, servingSize: 250, servingUnit: 'ml', category: 'Vegetables' },
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
