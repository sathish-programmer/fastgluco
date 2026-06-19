import { FoodMaster } from '../models/FoodMaster';
import { parse } from 'csv-parse/sync';
import { determinePortionType } from '../utils/foodUtils';
export class FoodSyncService {
  /**
   * Run automated sync for all trusted datasets
   */
  public static async syncAllDatasets() {
    console.log('[FoodSync] Starting automatic trusted food database sync...');

    let totalImported = 0;

    // 1. Import Indian Food Composition Tables (IFCT)
    try {
      console.log('[FoodSync] Fetching IFCT 2017 dataset...');
      const response = await fetch('https://cdn.jsdelivr.net/npm/@ifct2017/compositions/index.csv');
      if (response.ok) {
        const csvText = await response.text();
        const records = parse(csvText, {
          columns: true,
          skip_empty_lines: true
        });

        let ifctCount = 0;
        for (const record of records) {
          const name = record['Food Name; name'] || record['name'];
          if (!name) continue;

          // Normalize values
          const cleanName = name.replace(/"/g, '').trim();

          const carbs = parseFloat(record['Carbohydrate; choavldf']) || 0;
          const protein = parseFloat(record['Protein; protcnt']) || 0;
          const fat = parseFloat(record['Total Fat; fatce']) || 0;
          const fiber = parseFloat(record['Dietary Fiber; fibtg']) || 0;
          const group = record['Food Group; grup'] || '';

          // energy in kJ, convert to kcal (1 kJ = 0.239 kcal)
          const energyKj = parseFloat(record['Energy; enerc']) || 0;
          let calories = Math.round(energyKj / 4.184);

          if (calories === 0 && (carbs > 0 || protein > 0 || fat > 0)) {
            calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
          }

          const category = FoodSyncService.mapCategory(cleanName, group);
          const aliases = FoodSyncService.generateAliases(cleanName);

          await FoodMaster.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${FoodSyncService.escapeRegExp(cleanName)}$`, 'i') } },
            {
              name: cleanName,
              aliases,
              category,
              calories,
              carbs,
              protein,
              fat,
              fiber,
              servingSize: 100,
              servingUnit: 'g',
              verified: true,
              source: 'IFCT',
              countries: ['India'],
              portionType: determinePortionType(cleanName)
            },
            { upsert: true, new: true }
          );
          ifctCount++;
        }
        console.log(`[FoodSync] IFCT Import Complete: Upserted ${ifctCount} items.`);
        totalImported += ifctCount;
      } else {
        console.error(`[FoodSync] Failed to fetch IFCT dataset. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[FoodSync] Error syncing IFCT dataset:', err);
    }

    // 2. Import USDA FoodData Central (Foundation/SR Legacy)
    try {
      console.log('[FoodSync] Fetching USDA dataset...');
      const response = await fetch('https://api.nal.usda.gov/fdc/v1/foods/list?api_key=DEMO_KEY&dataType=Foundation,SR%20Legacy&pageSize=50');
      if (response.ok) {
        const foods = await response.json() as any[];
        let usdaCount = 0;

        for (const food of foods) {
          if (!food.description || !food.foodNutrients) continue;

          const cleanName = food.description.trim();
          let calories = 0;
          let carbs = 0;
          let protein = 0;
          let fat = 0;
          let fiber = 0;

          // Extract macro nutrients
          food.foodNutrients.forEach((nut: any) => {
            const nutName = nut.name ? nut.name.toLowerCase() : '';
            if (nutName.includes('energy') && nut.unitName === 'KCAL') {
              calories = Math.round(nut.amount);
            } else if (nutName.includes('carbohydrate')) {
              carbs = nut.amount;
            } else if (nutName.includes('protein')) {
              protein = nut.amount;
            } else if (nutName.includes('total lipid') || nutName === 'fat') {
              fat = nut.amount;
            } else if (nutName.includes('fiber')) {
              fiber = nut.amount;
            }
          });

          if (calories === 0 && (carbs > 0 || protein > 0 || fat > 0)) {
            calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
          }

          const category = FoodSyncService.mapCategory(cleanName);
          const aliases = FoodSyncService.generateAliases(cleanName);

          await FoodMaster.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${FoodSyncService.escapeRegExp(cleanName)}$`, 'i') } },
            {
              name: cleanName,
              aliases,
              category,
              calories,
              carbs,
              protein,
              fat,
              fiber,
              servingSize: 100,
              servingUnit: 'g',
              verified: true,
              source: 'USDA',
              countries: ['USA', 'Global'],
              portionType: determinePortionType(cleanName)
            },
            { upsert: true, new: true }
          );
          usdaCount++;
        }
        console.log(`[FoodSync] USDA Import Complete: Upserted ${usdaCount} items.`);
        totalImported += usdaCount;
      } else {
        console.error(`[FoodSync] Failed to fetch USDA dataset. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[FoodSync] Error syncing USDA dataset:', err);
    }

    // 3. Import OpenFoodFacts (Packaged Foods)
    try {
      console.log('[FoodSync] Fetching OpenFoodFacts dataset...');
      const response = await fetch('https://world.openfoodfacts.org/api/v2/search?categories_tags=en:meals&fields=product_name,nutriments,countries&page_size=50');
      if (response.ok) {
        const resJson = await response.json() as any;
        const products = resJson.products || [];
        let offCount = 0;

        for (const prod of products) {
          if (!prod.product_name || !prod.nutriments) continue;

          const cleanName = prod.product_name.trim();
          const nut = prod.nutriments;

          const carbs = parseFloat(nut['carbohydrates_100g'] || nut['carbohydrates_value']) || 0;
          const protein = parseFloat(nut['proteins_100g'] || nut['proteins_value']) || 0;
          const fat = parseFloat(nut['fat_100g'] || nut['fat_value']) || 0;
          const fiber = parseFloat(nut['fiber_100g'] || nut['fiber_value']) || 0;

          let calories = Math.round(nut['energy-kcal_100g'] || nut['energy-kcal_value'] || (nut['energy_100g'] ? nut['energy_100g'] / 4.184 : 0)) || 0;
          if (calories === 0 && (carbs > 0 || protein > 0 || fat > 0)) {
            calories = Math.round((protein * 4) + (carbs * 4) + (fat * 9));
          }

          // Countries mapping
          let countries = ['Global'];
          if (prod.countries) {
            countries = prod.countries.split(',').map((c: string) => c.trim()).filter(Boolean);
          }

          const category = FoodSyncService.mapCategory(cleanName);
          const aliases = FoodSyncService.generateAliases(cleanName);

          await FoodMaster.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${FoodSyncService.escapeRegExp(cleanName)}$`, 'i') } },
            {
              name: cleanName,
              aliases,
              category,
              calories,
              carbs,
              protein,
              fat,
              fiber,
              servingSize: 100,
              servingUnit: 'g',
              verified: true,
              source: 'OpenFoodFacts',
              countries,
              portionType: determinePortionType(cleanName)
            },
            { upsert: true, new: true }
          );
          offCount++;
        }
        console.log(`[FoodSync] OpenFoodFacts Import Complete: Upserted ${offCount} items.`);
        totalImported += offCount;
      } else {
        console.error(`[FoodSync] Failed to fetch OpenFoodFacts dataset. Status: ${response.status}`);
      }
    } catch (err) {
      console.error('[FoodSync] Error syncing OpenFoodFacts dataset:', err);
    }

    console.log(`[FoodSync] Database sync completed. Total verified items synced: ${totalImported}`);
    return totalImported;
  }

  /**
   * Helper to map food names to category tags
   */
  private static mapCategory(name: string, group?: string): 'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Vegetables' | 'Beverages' | 'Dairy' | 'Non-Veg' | 'Sweets' {
    const text = `${name} ${group || ''}`.toLowerCase();
    if (text.includes('fruit')) return 'Fruits';
    if (text.includes('spinach') || text.includes('carrot') || text.includes('broccoli') || text.includes('tomato') || text.includes('salad') || text.includes('vegetable')) return 'Vegetables';
    if (text.includes('milk') || text.includes('curd') || text.includes('yogurt') || text.includes('cheese') || text.includes('butter') || text.includes('ghee') || text.includes('dairy')) return 'Dairy';
    if (text.includes('chicken') || text.includes('fish') || text.includes('meat') || text.includes('mutton') || text.includes('egg') || text.includes('salmon') || text.includes('beef') || text.includes('non-veg')) return 'Non-Veg';
    if (text.includes('tea') || text.includes('coffee') || text.includes('water') || text.includes('juice') || text.includes('soda') || text.includes('beverage') || text.includes('drink')) return 'Beverages';
    if (text.includes('sweet') || text.includes('cake') || text.includes('cookie') || text.includes('chocolate') || text.includes('ice cream') || text.includes('pancake') || text.includes('jamun') || text.includes('ladoo')) return 'Sweets';
    if (text.includes('idli') || text.includes('dosa') || text.includes('vada') || text.includes('pongal') || text.includes('sambar')) return 'South Indian';
    if (text.includes('roti') || text.includes('naan') || text.includes('paratha') || text.includes('paneer') || text.includes('dal') || text.includes('curry') || text.includes('masala')) return 'North Indian';
    return 'Snacks';
  }

  /**
   * Auto-generate aliases for common food name variants
   */
  private static generateAliases(name: string): string[] {
    const lower = name.toLowerCase();
    const aliasesSet = new Set<string>();
    aliasesSet.add(lower);

    if (lower.includes('idli') && !lower.includes('idly')) aliasesSet.add(lower.replace('idli', 'idly'));
    if (lower.includes('idly') && !lower.includes('idli')) aliasesSet.add(lower.replace('idly', 'idli'));

    if (lower.includes('chapati') && !lower.includes('roti')) aliasesSet.add(lower.replace('chapati', 'roti'));
    if (lower.includes('chappati') && !lower.includes('roti')) aliasesSet.add(lower.replace('chappati', 'roti'));
    if (lower.includes('roti') && !lower.includes('chapati')) aliasesSet.add(lower.replace('roti', 'chapati'));

    if (lower.includes('curd') && !lower.includes('yogurt')) aliasesSet.add(lower.replace('curd', 'yogurt'));
    if (lower.includes('yogurt') && !lower.includes('curd')) aliasesSet.add(lower.replace('yogurt', 'curd'));

    if (lower.includes('brinjal') && !lower.includes('eggplant')) aliasesSet.add(lower.replace('brinjal', 'eggplant'));
    if (lower.includes('eggplant') && !lower.includes('brinjal')) aliasesSet.add(lower.replace('eggplant', 'brinjal'));

    if (lower.includes('lady finger') && !lower.includes('okra')) aliasesSet.add(lower.replace('lady finger', 'okra'));
    if (lower.includes('okra') && !lower.includes('lady finger')) aliasesSet.add(lower.replace('okra', 'lady finger'));

    return Array.from(aliasesSet);
  }

  private static escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

}
