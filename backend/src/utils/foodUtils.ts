/**
 * Shared food utility functions.
 * Kept separate from both foodController and fatSecretService to avoid circular dependencies.
 */

/**
 * Determine how a food's quantity is measured.
 * Used when seeding FoodMaster and when interpreting FatSecret results.
 */
export function determinePortionType(name: string): 'count' | 'weight' | 'volume' {
  const lower = name.toLowerCase();

  if (
    lower.includes('tea') ||
    lower.includes('coffee') ||
    lower.includes('milk') ||
    lower.includes('water') ||
    lower.includes('juice') ||
    lower.includes('soda') ||
    lower.includes('sambar') ||
    lower.includes('soup') ||
    lower.includes('dal') ||
    lower.includes('curd') ||
    lower.includes('yogurt') ||
    lower.includes('beverage') ||
    lower.includes('drink') ||
    lower.includes('liquid') ||
    lower.includes('oil') ||
    lower.includes('ghee') ||
    lower.includes('buttermilk') ||
    lower.includes('lassi') ||
    lower.includes('rasam') ||
    lower.includes('gravy') ||
    lower.includes('curry sauce')
  ) {
    return 'volume';
  }

  if (
    lower.includes('roti') ||
    lower.includes('idli') ||
    lower.includes('idly') ||
    lower.includes('dosa') ||
    lower.includes('dosai') ||
    lower.includes('egg') ||
    lower.includes('banana') ||
    lower.includes('chapati') ||
    lower.includes('chapatti') ||
    lower.includes('poori') ||
    lower.includes('puri') ||
    lower.includes('paratha') ||
    lower.includes('bread') ||
    lower.includes('biscuit') ||
    lower.includes('samosa') ||
    lower.includes('apple') ||
    lower.includes('orange') ||
    lower.includes('pear') ||
    lower.includes('peach') ||
    lower.includes('plum') ||
    lower.includes('piece') ||
    lower.includes('cookie') ||
    lower.includes('vadai') ||
    lower.includes('vada') ||
    lower.includes('puri')
  ) {
    return 'count';
  }

  return 'weight';
}

/**
 * Map a food name to one of the app's category enum values.
 * Used for FatSecret results that have no category metadata.
 */
export function mapFoodCategory(name: string): 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Vegetables' | 'Beverages' | 'Dairy' | 'Non-Veg' | 'Sweets' {
  const lower = name.toLowerCase();
  if (/tea|coffee|juice|soda|drink|water|buttermilk|lassi|lemonade|shake|smoothie/.test(lower)) return 'Beverages';
  if (/milk|curd|yogurt|paneer|cheese|ghee|cream|butter/.test(lower)) return 'Dairy';
  if (/apple|banana|mango|orange|grape|pear|berry|fruit|papaya|watermelon|guava|pineapple|pomegranate/.test(lower)) return 'Fruits';
  if (/spinach|tomato|potato|onion|carrot|brinjal|cauliflower|cabbage|beans|peas|lady finger|broccoli|vegetable/.test(lower)) return 'Vegetables';
  if (/chicken|mutton|fish|prawn|egg|meat|beef|pork|seafood|tuna|salmon|lamb/.test(lower)) return 'Non-Veg';
  if (/halwa|barfi|kheer|payasam|ladoo|gulab|jalebi|sweet|dessert|cake|candy|chocolate|ice cream/.test(lower)) return 'Sweets';
  if (/chip|biscuit|cookie|samosa|bhajia|pakora|snack|popcorn|nacho|fries|puff|cracker/.test(lower)) return 'Snacks';
  if (/dosa|idli|sambar|rasam|appam|uttapam|vada|pongal|upma|chettinad|kerala|tamil/.test(lower)) return 'South Indian';
  if (/roti|chapati|paratha|naan|dal|sabzi|pulao|biryani|rajma|chole|paneer|curry/.test(lower)) return 'North Indian';
  return 'Snacks'; // safe default
}
