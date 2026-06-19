/**
 * FatSecret Platform REST API Service
 * Uses OAuth 2.0 Client Credentials (scope=basic)
 * Credentials loaded from environment variables only — never hardcoded.
 */

import axios from 'axios';
import { determinePortionType, mapFoodCategory } from '../utils/foodUtils';

const FATSECRET_TOKEN_URL = 'https://oauth.fatsecret.com/connect/token';
const FATSECRET_API_URL   = 'https://platform.fatsecret.com/rest/server.api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OAuthToken {
  access_token: string;
  expires_at: number; // epoch ms
}

interface FatSecretServing {
  serving_id: string;
  serving_description: string;
  metric_serving_amount?: string;
  metric_serving_unit?: string;
  number_of_units?: string;
  calories: string;
  carbohydrate: string;
  protein: string;
  fat: string;
  fiber?: string;
}

interface FatSecretFoodDetail {
  food_id: string;
  food_name: string;
  food_type: string;
  food_description?: string;
  servings?: {
    serving: FatSecretServing | FatSecretServing[];
  };
}

export interface FatSecretResult {
  fatSecretId: string;
  name: string;
  calories: number;      // per 100g/100ml base
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
  servingSize: number;
  servingUnit: string;
  servingDescription: string;
  category: 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Vegetables' | 'Beverages' | 'Dairy' | 'Non-Veg' | 'Sweets';
  portionType: 'count' | 'weight' | 'volume';
  source: 'FatSecret';
  verified: true;
}

// ─── Token Cache ─────────────────────────────────────────────────────────────

let cachedToken: OAuthToken | null = null;

async function getAccessToken(): Promise<string> {
  const clientId     = process.env.FATSECRET_CLIENT_ID;
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET must be set in environment variables.');
  }

  // Return cached token if still valid (5 min buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 5 * 60 * 1000) {
    return cachedToken.access_token;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('scope', 'basic');

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await axios.post(FATSECRET_TOKEN_URL, params, {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000
  });

  const data = response.data;
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 86400) * 1000
  };

  return cachedToken.access_token;
}

// ─── Serving Parser ───────────────────────────────────────────────────────────

/**
 * Pick the best serving from a raw serving object/array and normalize
 * all macros to a per-100g (or per-100ml) base.
 *
 * Priority:
 *  1. Serving whose metric_serving_amount is exactly 100 (g or ml)
 *  2. Any serving that has a metric_serving_amount (we normalize)
 *  3. First serving available (use as-is)
 */
function parseBestServing(raw: FatSecretServing | FatSecretServing[]): {
  calories: number; carbs: number; protein: number; fat: number; fiber: number;
  servingSize: number; servingUnit: string; servingDescription: string;
} {
  const servings: FatSecretServing[] = Array.isArray(raw) ? raw : [raw];

  let best = servings.find(s =>
    s.metric_serving_amount === '100' &&
    (s.metric_serving_unit === 'g' || s.metric_serving_unit === 'ml')
  );

  if (!best) {
    best = servings.find(s =>
      s.serving_description?.toLowerCase().includes('100g') ||
      s.serving_description?.toLowerCase().includes('100 g') ||
      s.serving_description?.toLowerCase().includes('100ml')
    );
  }

  if (!best) {
    best = servings.find(s => s.metric_serving_amount && s.metric_serving_unit);
  }

  if (!best) {
    best = servings[0];
  }

  const metricAmt  = parseFloat(best.metric_serving_amount || '100');
  const metricUnit = best.metric_serving_unit || 'g';

  // Normalize all macros to per-100g/100ml
  const factor = metricAmt > 0 ? 100 / metricAmt : 1;

  return {
    calories: Math.round(parseFloat(best.calories || '0') * factor),
    carbs:    Math.round(parseFloat(best.carbohydrate || '0') * factor * 10) / 10,
    protein:  Math.round(parseFloat(best.protein || '0') * factor * 10) / 10,
    fat:      Math.round(parseFloat(best.fat || '0') * factor * 10) / 10,
    fiber:    Math.round(parseFloat(best.fiber || '0') * factor * 10) / 10,
    servingSize: 100,
    servingUnit: metricUnit,
    servingDescription: best.serving_description || `100${metricUnit}`
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search FatSecret for food items matching a query.
 *
 * Matching priority applied to results:
 *  1. Exact name match
 *  2. Name starts with query
 *  3. Name contains query
 *  4. Generic foods preferred over Brand
 *
 * For each hit in the top-5:
 *  - If the search response contains inline nutrition in food_description, use it.
 *  - If not, call getFoodById() to fetch full serving data (avoids returning empty nutrition).
 *
 * Returns up to 5 results.
 */
export async function searchFood(query: string): Promise<FatSecretResult[]> {
  const token = await getAccessToken();

  const response = await axios.get(FATSECRET_API_URL, {
    params: {
      method: 'foods.search',
      search_expression: query,
      format: 'json',
      max_results: 10,
      page_number: 0
    },
    headers: { 'Authorization': `Bearer ${token}` },
    timeout: 10000
  });

  const rawFoods: any[] = response.data?.foods?.food ?? [];
  if (rawFoods.length === 0) return [];

  const normalized = query.toLowerCase().trim();

  // Score + sort
  const scored = rawFoods.map((food: any) => {
    const nameL = (food.food_name || '').toLowerCase();
    let score = 0;
    if (nameL === normalized)               score += 100;
    else if (nameL.startsWith(normalized))  score += 60;
    else if (nameL.includes(normalized))    score += 30;
    if (food.food_type === 'Generic')       score += 10;
    return { food, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const results: FatSecretResult[] = [];

  for (const { food } of scored.slice(0, 5)) {
    const name: string = food.food_name;

    // Attempt to parse inline nutrition from food_description
    const desc: string = food.food_description || '';
    const calMatch  = desc.match(/Calories:\s*([\d.]+)kcal/i);
    const fatMatch  = desc.match(/Fat:\s*([\d.]+)g/i);
    const carbMatch = desc.match(/Carbs:\s*([\d.]+)g/i);
    const protMatch = desc.match(/Protein:\s*([\d.]+)g/i);

    if (calMatch) {
      // Inline nutrition available — use it directly
      results.push({
        fatSecretId: food.food_id,
        name,
        calories: Math.round(parseFloat(calMatch[1])),
        carbs:    Math.round(parseFloat(carbMatch?.[1] || '0') * 10) / 10,
        protein:  Math.round(parseFloat(protMatch?.[1] || '0') * 10) / 10,
        fat:      Math.round(parseFloat(fatMatch?.[1] || '0') * 10) / 10,
        fiber: 0,
        servingSize: 100,
        servingUnit: 'g',
        servingDescription: '100g',
        category: mapFoodCategory(name),
        portionType: determinePortionType(name),
        source: 'FatSecret',
        verified: true
      });
    } else {
      // No inline nutrition — call food.get to fetch serving data
      try {
        const detailed = await getFoodById(food.food_id);
        if (detailed) {
          results.push(detailed);
        }
      } catch (detailErr: any) {
        console.warn(`FatSecret food.get failed for "${name}" (${food.food_id}): ${detailErr.message}`);
        // Skip this result rather than returning empty nutrition
      }
    }
  }

  return results;
}

/**
 * Fetch full nutrition details for a specific FatSecret food_id.
 * Returns normalized per-100g values using the best available serving.
 */
export async function getFoodById(foodId: string): Promise<FatSecretResult | null> {
  const token = await getAccessToken();

  const response = await axios.get(FATSECRET_API_URL, {
    params: {
      method: 'food.get',
      food_id: foodId,
      format: 'json'
    },
    headers: { 'Authorization': `Bearer ${token}` },
    timeout: 10000
  });

  const food: FatSecretFoodDetail = response.data?.food;
  if (!food) return null;

  const servingRaw = food.servings?.serving;
  if (!servingRaw) return null;

  const parsed = parseBestServing(servingRaw);
  const name   = food.food_name;

  return {
    fatSecretId: food.food_id,
    name,
    ...parsed,
    category:    mapFoodCategory(name),
    portionType: determinePortionType(name),
    source: 'FatSecret',
    verified: true
  };
}
