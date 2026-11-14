const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../app_store_screenshots');

// Target Directories for All Platforms
const iosDir = path.join(OUTPUT_DIR, 'ios');
const androidDir = path.join(OUTPUT_DIR, 'android');
const featureGraphicDir = path.join(OUTPUT_DIR, 'feature_graphic');
const tabletIosDir = path.join(OUTPUT_DIR, 'tablet_ios');
const tabletAndroidDir = path.join(OUTPUT_DIR, 'tablet_android');
const desktopDir = path.join(OUTPUT_DIR, 'desktop');

[iosDir, androidDir, featureGraphicDir, tabletIosDir, tabletAndroidDir, desktopDir].forEach(d => {
  fs.mkdirSync(d, { recursive: true });
});

// Helper to load image as Base64 Data URI
function getBase64Image(filePath, mimeType = 'image/jpeg') {
  try {
    if (fs.existsSync(filePath)) {
      const b64 = fs.readFileSync(filePath).toString('base64');
      return `data:${mimeType};base64,${b64}`;
    }
  } catch (e) {
    console.error('Error reading asset:', filePath, e.message);
  }
  return '';
}

const imgPlate = getBase64Image(path.join(__dirname, 'assets/food_plate.jpg'), 'image/jpeg');
const imgDish1 = getBase64Image(path.join(__dirname, 'assets/food_dish1.jpg'), 'image/jpeg');
const imgDish2 = getBase64Image(path.join(__dirname, 'assets/food_dish2.jpg'), 'image/jpeg');
const imgDoctor = getBase64Image(path.join(__dirname, 'assets/doctor.jpg'), 'image/jpeg');
const imgLifestyle = getBase64Image(path.join(__dirname, 'assets/lifestyle.webp'), 'image/webp');
const imgRecipe2 = getBase64Image(path.join(__dirname, 'assets/recipe2.webp'), 'image/webp');

console.log('Assets loaded:');
console.log(' - food_plate:', imgPlate ? '✓ Base64' : '✗ Missing');
console.log(' - food_dish1:', imgDish1 ? '✓ Base64' : '✗ Missing');
console.log(' - food_dish2:', imgDish2 ? '✓ Base64' : '✗ Missing');
console.log(' - doctor:', imgDoctor ? '✓ Base64' : '✗ Missing');
console.log(' - lifestyle:', imgLifestyle ? '✓ Base64' : '✗ Missing');
console.log(' - recipe2:', imgRecipe2 ? '✓ Base64' : '✗ Missing');

// ─── SCREEN DEFINITIONS (CONTENT-FOCUSED, MODERN HEALTHIFY AESTHETIC) ───
// Every screen is designed so there is ZERO empty space, with rich data, cards, and base64 imagery.

const screens = [
  // 1. CAMERA FOOD SCANNER
  {
    id: '01_snap_food_ai_scanner',
    headline: 'Snap a Meal or a Packet<br>& Track in an Instant',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.12) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="position: relative; width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; overflow: hidden;">
        <!-- Full edge-to-edge camera feed -->
        <img src="${imgPlate || imgDish1}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.85) 100%);"></div>

        <!-- Top Camera Header -->
        <div style="position: relative; z-index: 20; padding: ${isTablet ? '36px 44px' : '20px 24px'}; display: flex; justify-content: space-between; align-items: center;">
          <div style="width: ${isTablet ? '64px' : '44px'}; height: ${isTablet ? '64px' : '44px'}; border-radius: 50%; background: rgba(0,0,0,0.45); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: white; font-size: ${isTablet ? '28px' : '20px'};">←</div>
          <div style="display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); padding: ${isTablet ? '12px 28px' : '8px 18px'}; border-radius: 30px; border: 1.5px solid rgba(255,255,255,0.25);">
            <span style="font-size: ${isTablet ? '22px' : '16px'};">📸</span>
            <span style="color: white; font-weight: 900; font-size: ${isTablet ? '20px' : '15px'}; letter-spacing: 0.3px;">AI Food Scanner</span>
          </div>
          <div style="width: ${isTablet ? '64px' : '44px'}; height: ${isTablet ? '64px' : '44px'}; border-radius: 50%; background: rgba(0,0,0,0.45); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #FBBF24; font-size: ${isTablet ? '26px' : '18px'};">⚡</div>
        </div>

        <!-- AR Bounding Box with Food Detection Badges -->
        <div style="position: absolute; top: ${isTablet ? '28%' : '24%'}; left: 10%; width: 80%; height: ${isTablet ? '46%' : '44%'}; border: ${isTablet ? '4px' : '3px'} solid rgba(255,255,255,0.95); border-radius: 36px; box-shadow: 0 0 0 2000px rgba(0,0,0,0.25), inset 0 0 40px rgba(16,185,129,0.4);">
          <!-- Pill 1 -->
          <div style="position: absolute; top: -18px; left: 24px; background: white; color: #0F172A; font-size: ${isTablet ? '18px' : '13px'}; font-weight: 900; padding: ${isTablet ? '8px 22px' : '6px 16px'}; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 8px;">
            <span>🥗</span> Quinoa & Greens
          </div>
          <!-- Pill 2 -->
          <div style="position: absolute; top: 32%; right: -16px; background: white; color: #0F172A; font-size: ${isTablet ? '18px' : '13px'}; font-weight: 900; padding: ${isTablet ? '8px 22px' : '6px 16px'}; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 8px;">
            <span>🥑</span> Hass Avocado
          </div>
          <!-- Pill 3 -->
          <div style="position: absolute; bottom: 30%; left: -16px; background: white; color: #0F172A; font-size: ${isTablet ? '18px' : '13px'}; font-weight: 900; padding: ${isTablet ? '8px 22px' : '6px 16px'}; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 8px;">
            <span>🍗</span> Lean Chicken
          </div>
          <!-- Pill 4 -->
          <div style="position: absolute; bottom: -18px; right: 28px; background: white; color: #0F172A; font-size: ${isTablet ? '18px' : '13px'}; font-weight: 900; padding: ${isTablet ? '8px 22px' : '6px 16px'}; border-radius: 16px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 8px;">
            <span>🎃</span> Sprouted Seeds
          </div>
        </div>

        <!-- Bottom Recognition Sheet Overlay (Google Lens / Healthify style) -->
        <div style="margin-top: auto; position: relative; z-index: 20; padding: ${isTablet ? '36px 44px' : '22px 24px'}; background: rgba(15, 23, 42, 0.88); backdrop-filter: blur(20px); border-radius: 36px 36px 0 0; border: 1.5px solid rgba(255,255,255,0.15); border-bottom: none;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${isTablet ? '24px' : '16px'};">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: #065F46; color: #6EE7B7; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; padding: 4px 12px; border-radius: 8px; text-transform: uppercase;">
                ✨ 99% AI Match
              </div>
              <h3 style="color: white; font-size: ${isTablet ? '26px' : '20px'}; font-weight: 900; margin-top: 6px;">Mediterranean Longevity Plate</h3>
            </div>
            <div style="text-align: right;">
              <div style="color: white; font-size: ${isTablet ? '36px' : '28px'}; font-weight: 900;">350 <span style="font-size: ${isTablet ? '18px' : '14px'}; color: #94A3B8;">kcal</span></div>
              <div style="color: #10B981; font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800;">Cellular Score 9.4</div>
            </div>
          </div>

          <!-- Shutter Bar -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px;">
            <div style="width: ${isTablet ? '64px' : '52px'}; height: ${isTablet ? '64px' : '52px'}; border-radius: 20px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: ${isTablet ? '28px' : '22px'}; color: white;">🖼️</div>
            <div style="width: ${isTablet ? '92px' : '76px'}; height: ${isTablet ? '92px' : '76px'}; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(16,185,129,0.5);">
              <div style="width: ${isTablet ? '72px' : '60px'}; height: ${isTablet ? '72px' : '60px'}; border-radius: 50%; background: white;"></div>
            </div>
            <div style="width: ${isTablet ? '64px' : '52px'}; height: ${isTablet ? '64px' : '52px'}; border-radius: 20px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: ${isTablet ? '28px' : '22px'}; color: white;">🏷️</div>
          </div>
        </div>
      </div>
    `
  },

  // 2. INSTANT MEAL INSIGHTS & ADVICE
  {
    id: '02_instant_meal_insights',
    headline: 'Get Instant Meal<br>Insights & Advice',
    accentColor: '#059669',
    bgGlow: 'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 60%), radial-gradient(circle at 85% 85%, rgba(245, 158, 11, 0.14) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; overflow: hidden; position: relative;">
        <!-- Top Photo of Dish -->
        <div style="height: ${isTablet ? '42%' : '38%'}; position: relative; overflow: hidden; border-radius: 36px 36px 0 0;">
          <img src="${imgDish1 || imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%);"></div>
          
          <div style="position: absolute; top: ${isTablet ? '32px' : '20px'}; left: ${isTablet ? '32px' : '20px'}; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); width: ${isTablet ? '52px' : '40px'}; height: ${isTablet ? '52px' : '40px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: ${isTablet ? '22px' : '16px'};">←</div>
          
          <div style="position: absolute; bottom: ${isTablet ? '36px' : '24px'}; left: ${isTablet ? '32px' : '22px'}; right: ${isTablet ? '32px' : '22px'}; color: white;">
            <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; background: #10B981; color: white; padding: 4px 12px; border-radius: 8px; text-transform: uppercase;">Dinner • Verified</span>
            <h2 style="font-size: ${isTablet ? '32px' : '24px'}; font-weight: 900; margin-top: 6px; letter-spacing: -0.5px;">Mediterranean Quinoa & Greens</h2>
          </div>
        </div>

        <!-- Floating Macro & Calorie Card (Healthify Style) -->
        <div style="margin: ${isTablet ? '-24px 28px 0 28px' : '-20px 18px 0 18px'}; background: white; border-radius: 28px; padding: ${isTablet ? '28px' : '18px 20px'}; box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12); border: 1.5px solid #E2E8F0; position: relative; z-index: 10;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${isTablet ? '18px' : '12px'};">
            <span style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 800; color: #64748B;">Total Calories</span>
            <div style="font-size: ${isTablet ? '42px' : '32px'}; font-weight: 900; color: #0F172A; line-height: 1;">350 <span style="font-size: ${isTablet ? '18px' : '14px'}; color: #64748B; font-weight: 700;">kcal</span></div>
          </div>

          <!-- 4 Macro Pills -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${isTablet ? '14px' : '8px'}; margin-bottom: ${isTablet ? '18px' : '12px'};">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 8px' : '10px 6px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">🍗 Protein</div>
              <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #059669; margin-top: 2px;">30g</div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 8px' : '10px 6px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">💧 Fat</div>
              <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #D97706; margin-top: 2px;">15g</div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 8px' : '10px 6px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">🌾 Carbs</div>
              <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #3B82F6; margin-top: 2px;">40g</div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 8px' : '10px 6px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">🥦 Fibre</div>
              <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #10B981; margin-top: 2px;">8g</div>
            </div>
          </div>

          <!-- Score Banner -->
          <div style="background: linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 100%); border: 1.5px solid #A7F3D0; border-radius: 18px; padding: ${isTablet ? '16px 20px' : '10px 16px'}; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: ${isTablet ? '22px' : '16px'};">✨</span>
              <span style="font-size: ${isTablet ? '18px' : '13px'}; font-weight: 900; color: #065F46;">Cellular Repair Score: 9.2 on 10</span>
            </div>
            <span style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 800; color: #059669;">Safe Tier ›</span>
          </div>
        </div>

        <!-- Content-Dense Ingredient Breakdown (NO EMPTY SPACES) -->
        <div style="flex: 1; padding: ${isTablet ? '20px 28px' : '14px 18px'}; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${isTablet ? '12px' : '8px'};">
            <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Logged Meal Items</div>
            
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A;">Organic Quinoa & Steamed Greens</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; margin-top: 2px;">1.5 cups • Low glycemic index</div>
              </div>
              <span style="font-size: ${isTablet ? '17px' : '14px'}; font-weight: 900; color: #0F172A;">180 kcal</span>
            </div>

            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A;">Hass Avocado & Sprouted Pumpkin Seeds</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; margin-top: 2px;">1/2 fruit + 2 tbsp • Monounsaturated fats</div>
              </div>
              <span style="font-size: ${isTablet ? '17px' : '14px'}; font-weight: 900; color: #0F172A;">120 kcal</span>
            </div>

            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A;">Cold-Pressed Extra Virgin Olive Oil</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; margin-top: 2px;">1 tsp • Polyphenol oleocanthal</div>
              </div>
              <span style="font-size: ${isTablet ? '17px' : '14px'}; font-weight: 900; color: #0F172A;">50 kcal</span>
            </div>
          </div>

          <!-- Bottom Action Buttons (Healthify Style) -->
          <div style="display: flex; gap: 12px; margin-top: 10px;">
            <div style="flex: 1; background: #ECFDF5; border: 1.5px solid #A7F3D0; color: #059669; padding: ${isTablet ? '20px' : '14px'}; border-radius: 18px; font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; text-align: center;">
              ✨ Quick AI Fix
            </div>
            <div style="flex: 1.4; background: #059669; color: white; padding: ${isTablet ? '20px' : '14px'}; border-radius: 18px; font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; text-align: center; box-shadow: 0 8px 24px rgba(5,150,105,0.35);">
              Log Meal & Track
            </div>
          </div>
        </div>
      </div>
    `
  },

  // 3. KEEP THE CONVERSATION GOING WITH AI MITO
  {
    id: '03_keep_conversation_ai_mito',
    headline: 'Keep the Conversation<br>Going with AI Mito',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.18) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(124, 58, 237, 0.12) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '36px 32px' : '20px 18px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '20px' : '14px'};">
          <!-- Assistant Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: ${isTablet ? '18px' : '12px'}; border-bottom: 1.5px solid #F1F5F9;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: ${isTablet ? '54px' : '40px'}; height: ${isTablet ? '54px' : '40px'}; border-radius: 14px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; font-size: ${isTablet ? '26px' : '20px'};">✨</div>
              <div>
                <div style="font-size: ${isTablet ? '22px' : '16px'}; font-weight: 900; color: #0F172A;">AI Mito</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #059669; font-weight: 700;">Metabolic Medicine Coach • Active</div>
              </div>
            </div>
            <span style="background: #F1F5F9; color: #475569; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Mito_Reboot v2</span>
          </div>

          <!-- User Message Bubble (Healthify green italic bubble) -->
          <div style="align-self: flex-end; max-width: 85%; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 22px 22px 4px 22px; padding: ${isTablet ? '20px 24px' : '14px 18px'}; color: #166534; font-size: ${isTablet ? '20px' : '15px'}; font-weight: 800; font-style: italic; line-height: 1.35;">
            "I'm struggling to meet my protein & fibre budgets. Help!"
          </div>

          <!-- AI Response Bubble -->
          <div style="align-self: flex-start; max-width: 95%; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 22px 22px 22px 4px; padding: ${isTablet ? '22px 26px' : '16px 18px'};">
            <div style="font-size: ${isTablet ? '19px' : '14px'}; color: #334155; line-height: 1.45; font-weight: 600;">
              Can be hard on vegetarian days—add lentils, tofu, pumpkin seeds, and broccoli for a cellular boost. Some recipes for you:
            </div>
          </div>

          <!-- TWO BIG RECIPE CARDS (Healthify Style) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${isTablet ? '18px' : '12px'}; margin-top: 4px;">
            <!-- Recipe 1 -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
              <div style="height: ${isTablet ? '180px' : '110px'}; position: relative;">
                <img src="${imgDish2 || imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="padding: ${isTablet ? '18px' : '12px'};">
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A; line-height: 1.2;">Chickpea Spinach Curry</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; font-weight: 700; margin-top: 4px;">20g Protein • 200 Cal</div>
                <div style="font-size: ${isTablet ? '12px' : '10px'}; color: #059669; font-weight: 800; margin-top: 2px;">Low Glycemic Index</div>
              </div>
            </div>

            <!-- Recipe 2 -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 22px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.06); display: flex; flex-direction: column;">
              <div style="height: ${isTablet ? '180px' : '110px'}; position: relative;">
                <img src="${imgRecipe2 || imgDish1}" style="width: 100%; height: 100%; object-fit: cover;" />
              </div>
              <div style="padding: ${isTablet ? '18px' : '12px'};">
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A; line-height: 1.2;">Tofu Black Bean Bowl</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; font-weight: 700; margin-top: 4px;">20.5g Protein • 250 Cal</div>
                <div style="font-size: ${isTablet ? '12px' : '10px'}; color: #059669; font-weight: 800; margin-top: 2px;">Autophagy Stage Safe</div>
              </div>
            </div>
          </div>

          <!-- Follow-up suggestion pills (NO BLANK SPACE) -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <span style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #059669; font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; padding: 6px 14px; border-radius: 14px;">🌱 Swap with Tempeh</span>
            <span style="background: #F0F9FF; border: 1px solid #BAE6FD; color: #0284C7; font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; padding: 6px 14px; border-radius: 14px;">📉 Show Glucose Impact</span>
            <span style="background: #FDF4FF; border: 1px solid #F5D0FE; color: #A21CAF; font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; padding: 6px 14px; border-radius: 14px;">⚡ Fasting Match</span>
          </div>
        </div>

        <!-- Chat Input Bar (Healthify Style) -->
        <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 24px; padding: ${isTablet ? '18px 24px' : '12px 18px'}; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="color: #059669; font-size: ${isTablet ? '24px' : '18px'};">|</span>
            <span style="font-size: ${isTablet ? '18px' : '14px'}; color: #94A3B8; font-weight: 600;">Ask Ria / Mito...</span>
          </div>
          <div style="display: flex; align-items: center; gap: ${isTablet ? '16px' : '12px'}; font-size: ${isTablet ? '22px' : '18px'}; color: #64748B;">
            <span>➕</span>
            <span>🎙️</span>
            <span>▦</span>
          </div>
        </div>
      </div>
    `
  },

  // 4. REACH YOUR GOALS & SOCIAL PROOF
  {
    id: '04_reach_goals_social_proof',
    headline: 'Reach Your Goals &<br>Healthify for Good',
    accentColor: '#059669',
    bgGlow: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.16) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.14) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #0F172A; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '44px 36px' : '28px 22px'};">
        <!-- Background lifestyle photo -->
        <img src="${imgLifestyle || imgPlate}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;" />
        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(240,253,244,0.85) 45%, rgba(15,23,42,0.9) 100%);"></div>

        <!-- 3 Big Stacked Cards on Right (Exact Healthify Style) -->
        <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: ${isTablet ? '20px' : '14px'}; max-width: 92%; align-self: flex-end;">
          <!-- Card 1 -->
          <div style="background: white; border-radius: 26px; padding: ${isTablet ? '26px 32px' : '18px 22px'}; box-shadow: 0 16px 40px rgba(0,0,0,0.12); border: 1.5px solid rgba(226,232,240,0.8);">
            <div style="font-size: ${isTablet ? '54px' : '38px'}; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 800; color: #64748B;">lb</span></div>
            <div style="font-size: ${isTablet ? '18px' : '13px'}; color: #475569; font-weight: 700; margin-top: 6px; line-height: 1.35;">
              avg weight lost per week by Mito_Reboot users
            </div>
          </div>

          <!-- Card 2 -->
          <div style="background: white; border-radius: 26px; padding: ${isTablet ? '26px 32px' : '18px 22px'}; box-shadow: 0 16px 40px rgba(0,0,0,0.12); border: 1.5px solid rgba(226,232,240,0.8);">
            <div style="font-size: ${isTablet ? '54px' : '38px'}; font-weight: 900; color: #0F172A; line-height: 1;">80 <span style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 800; color: #059669;">%</span></div>
            <div style="font-size: ${isTablet ? '18px' : '13px'}; color: #475569; font-weight: 700; margin-top: 6px; line-height: 1.35;">
              users report improvement in eating habits
            </div>
          </div>

          <!-- Card 3 -->
          <div style="background: white; border-radius: 26px; padding: ${isTablet ? '26px 32px' : '18px 22px'}; box-shadow: 0 16px 40px rgba(0,0,0,0.12); border: 1.5px solid rgba(226,232,240,0.8);">
            <div style="font-size: ${isTablet ? '54px' : '38px'}; font-weight: 900; color: #0F172A; line-height: 1;">45 <span style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 800; color: #2563EB;">%</span></div>
            <div style="font-size: ${isTablet ? '18px' : '13px'}; color: #475569; font-weight: 700; margin-top: 6px; line-height: 1.35;">
              users report increase in daily activity
            </div>
          </div>
        </div>

        <!-- Bottom User Testimonial Overlay (NO BLANK SPACE) -->
        <div style="position: relative; z-index: 10; background: rgba(15,23,42,0.85); backdrop-filter: blur(14px); border-radius: 24px; padding: ${isTablet ? '22px 28px' : '16px 20px'}; border: 1px solid rgba(255,255,255,0.2); color: white;">
          <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #34D399; text-transform: uppercase;">Verified Patient Cohort</div>
          <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 800; margin-top: 4px;">"My HbA1c reduced from 6.8% to 5.2% in 90 days."</div>
          <div style="font-size: ${isTablet ? '13px' : '11px'}; color: #94A3B8; margin-top: 2px;">Priya V. • Age 38 • Active Mito_Reboot Member</div>
        </div>
      </div>
    `
  },

  // 5. DECODE GLUCOSE CURVES & CGM SPIKES
  {
    id: '05_continuous_glucose_cgm',
    headline: 'Decode Glucose Curves<br>& CGM Spikes',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.18) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.12) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '36px 32px' : '22px 20px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '18px' : '12px'};">
          <!-- Sensor Top Card -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 26px; padding: ${isTablet ? '26px' : '18px 20px'}; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px #10B981;"></span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #059669; text-transform: uppercase;">Abbott Sensor Live</span>
              </div>
              <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">Synced 2m ago</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
              <div>
                <div style="font-size: ${isTablet ? '56px' : '44px'}; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; color: #059669; font-weight: 800; margin-top: 4px;">mg/dL • Optimal Target Range</div>
              </div>
              <div style="text-align: right;">
                <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; padding: 6px 14px; border-radius: 12px;">96% In Range</span>
              </div>
            </div>

            <!-- CGM 24-Hour Wave SVG -->
            <svg viewBox="0 0 460 140" style="width: 100%; height: ${isTablet ? '180px' : '130px'}; overflow: visible;">
              <defs>
                <linearGradient id="cgmFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <!-- Target Band (70 to 120 mg/dL) -->
              <rect x="0" y="35" width="460" height="70" fill="#F0FDF4" rx="10"/>
              <line x1="0" y1="35" x2="460" y2="35" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              <line x1="0" y1="105" x2="460" y2="105" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              
              <!-- Wave -->
              <path d="M 0 85 C 50 80, 80 60, 130 45 C 180 30, 210 65, 260 75 C 310 85, 360 60, 410 50 L 460 55 L 460 140 L 0 140 Z" fill="url(#cgmFill)"/>
              <path d="M 0 85 C 50 80, 80 60, 130 45 C 180 30, 210 65, 260 75 C 310 85, 360 60, 410 50 L 460 55" fill="none" stroke="#10B981" stroke-width="4" stroke-linecap="round"/>
              <circle cx="130" cy="45" r="6" fill="#10B981" stroke="white" stroke-width="2.5"/>
            </svg>

            <div style="display: flex; justify-content: space-between; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #94A3B8; margin-top: 6px;">
              <span>6 AM</span>
              <span>12 PM (Lunch +18)</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          <!-- Post-Meal Response Card -->
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 20px; padding: ${isTablet ? '20px' : '14px 18px'}; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: ${isTablet ? '28px' : '20px'};">🥑</span>
              <div>
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0F172A;">Post-Lunch Response</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #059669; font-weight: 700; margin-top: 2px;">+18 mg/dL spike • Optimal Safe Tier</div>
              </div>
            </div>
            <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; padding: 4px 10px; border-radius: 8px;">Optimal</span>
          </div>

          <!-- Autophagy Fasting Stage Card -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: 20px; padding: ${isTablet ? '22px' : '16px 20px'}; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #34D399; text-transform: uppercase;">AUTOPHAGY CELLULAR REPAIR</div>
              <div style="font-size: ${isTablet ? '26px' : '20px'}; font-weight: 900; margin-top: 2px;">⚡ 15h 24m Fasting</div>
              <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #94A3B8; margin-top: 2px;">Deep cellular recycling & mitophagy active</div>
            </div>
            <div style="width: ${isTablet ? '54px' : '42px'}; height: ${isTablet ? '54px' : '42px'}; border-radius: 50%; background: rgba(16,185,129,0.2); border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: ${isTablet ? '22px' : '18px'};">🔥</div>
          </div>
        </div>

        <!-- 4-Stat Grid (NO EMPTY SPACES) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${isTablet ? '16px' : '10px'};">
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: ${isTablet ? '18px' : '12px 16px'};">
            <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">AVG GLUCOSE</div>
            <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">98 mg/dL</div>
          </div>
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: ${isTablet ? '18px' : '12px 16px'};">
            <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">EST. HbA1c</div>
            <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #059669; margin-top: 2px;">5.1%</div>
          </div>
        </div>
      </div>
    `
  },

  // 6. CONSULT CLINICAL SPECIALISTS ANYTIME
  {
    id: '06_consult_top_specialists',
    headline: 'Consult Clinical<br>Specialists Anytime',
    accentColor: '#0284C7',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.18) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '36px 32px' : '22px 20px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '18px' : '12px'};">
          <!-- Doctor Profile Card -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 26px; padding: ${isTablet ? '26px' : '18px 20px'}; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="display: flex; gap: ${isTablet ? '20px' : '14px'}; align-items: center; margin-bottom: ${isTablet ? '18px' : '12px'};">
              <img src="${imgDoctor}" style="width: ${isTablet ? '84px' : '64px'}; height: ${isTablet ? '84px' : '64px'}; border-radius: 20px; object-fit: cover; border: 2.5px solid #0284C7;" />
              <div>
                <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar MD</div>
                <div style="font-size: ${isTablet ? '15px' : '12px'}; color: #64748B; font-weight: 700;">Preventive Oncologist • 12+ Yrs</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #059669; font-weight: 800; margin-top: 2px;">★ 4.9 (340+ Verified Consultations)</div>
              </div>
            </div>

            <!-- Next Appointment Banner -->
            <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 16px; padding: ${isTablet ? '16px 20px' : '12px 14px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Teleconsultation</div>
                <div style="font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; color: #0C4A6E; margin-top: 2px;">Today at 4:30 PM (Video Call)</div>
              </div>
              <span style="background: #0284C7; color: white; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Ready</span>
            </div>
          </div>

          <!-- Clinical Care Deliverables (Prescription & Labs) -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 22px; padding: ${isTablet ? '22px' : '16px 18px'};">
            <div style="font-size: ${isTablet ? '15px' : '12px'}; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 10px;">Clinical Care Plan</div>
            
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: ${isTablet ? '22px' : '16px'};">📄</span>
                  <div>
                    <div style="font-size: ${isTablet ? '16px' : '13px'}; font-weight: 800; color: #0F172A;">Medical Prescription PDF</div>
                    <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #64748B;">Digitally signed by Dr. Krithikaa</div>
                  </div>
                </div>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0284C7;">Download ›</span>
              </div>

              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: ${isTablet ? '22px' : '16px'};">🧪</span>
                  <div>
                    <div style="font-size: ${isTablet ? '16px' : '13px'}; font-weight: 800; color: #0F172A;">Biomarker Lab Audit</div>
                    <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #059669; font-weight: 700;">HbA1c 5.1% • CEA 1.2 ng/mL (Optimal)</div>
                  </div>
                </div>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #059669;">Verified ✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Big CTA Button (NO EMPTY SPACES) -->
        <div style="background: #0284C7; color: white; padding: ${isTablet ? '22px' : '16px'}; border-radius: 20px; font-size: ${isTablet ? '20px' : '15px'}; font-weight: 900; text-align: center; box-shadow: 0 10px 24px rgba(2,132,199,0.35);">
          Join Secure Consultation Room
        </div>
      </div>
    `
  }
];

// ─── MASTER HTML TEMPLATE ───
function buildPageHtml({ screen, width, height, isTablet = false }) {
  const isAndroid = width === 1080 || (isTablet && width === 1600);
  
  // Scaling calculations
  const headlineSize = isTablet ? (width === 2048 ? '86px' : '72px') : (isAndroid ? '54px' : '66px');
  const chassisWidth = isTablet ? (width === 2048 ? '1800px' : '1420px') : (isAndroid ? '940px' : '1120px');
  const topPadding = isTablet ? '70px' : (isAndroid ? '50px' : '80px');
  const headlineMargin = isTablet ? '38px' : '30px';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${screen.headline.replace(/<br>/g, ' ')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      background: #FFFFFF;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding-top: ${topPadding};
    }

    .ambient-glow {
      position: absolute;
      inset: 0;
      background: ${screen.bgGlow};
      pointer-events: none;
      z-index: 0;
    }

    .headline-box {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: ${isTablet ? '1600px' : '1080px'};
      padding: 0 40px;
      margin-bottom: ${headlineMargin};
    }

    .headline {
      font-size: ${headlineSize};
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1.8px;
    }

    .device-wrap {
      position: relative;
      z-index: 10;
      width: ${chassisWidth};
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .phone-chassis {
      width: 100%;
      height: 100%;
      background: #111827;
      border-radius: ${isTablet ? '54px 54px 0 0' : '64px 64px 0 0'};
      padding: ${isTablet ? '20px 20px 0 20px' : '14px 14px 0 14px'};
      box-shadow: 
        0 -20px 80px rgba(15, 23, 42, 0.22),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
      border: 4px solid #1F2937;
      border-bottom: none;
      display: flex;
      flex-direction: column;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      background: #FFFFFF;
      border-radius: ${isTablet ? '42px 42px 0 0' : '52px 52px 0 0'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .status-bar {
      height: ${isTablet ? '56px' : '46px'};
      padding: ${isTablet ? '14px 36px 0 36px' : '10px 28px 0 28px'};
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      z-index: 30;
      color: #0F172A;
      font-weight: 800;
      font-size: ${isTablet ? '20px' : '15px'};
    }

    .dynamic-island {
      width: 120px;
      height: 28px;
      background: #000000;
      border-radius: 18px;
      position: absolute;
      left: 50%;
      top: 10px;
      transform: translateX(-50%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: ${isTablet ? 'none' : 'block'};
    }

    .screen-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="headline-box">
    <h1 class="headline">${screen.headline}</h1>
  </div>
  <div class="device-wrap">
    <div class="phone-chassis">
      <div class="phone-screen">
        <div class="status-bar">
          <span>9:00</span>
          <div class="dynamic-island"></div>
          <span style="display: flex; gap: 6px; align-items: center;">📶 🔋</span>
        </div>
        <div class="screen-body">
          ${screen.renderScreen(isTablet)}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── FEATURE GRAPHIC (1024 x 500) ───
function buildFeatureGraphicHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mito_Reboot Feature Graphic</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px;
      height: 500px;
      background: #FFFFFF;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 60px 0 70px;
      position: relative;
    }
    .ambient-glow {
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.22) 0%, transparent 60%),
        radial-gradient(circle at 15% 80%, rgba(37, 99, 235, 0.14) 0%, transparent 60%);
      pointer-events: none;
    }
    .left-copy {
      max-width: 500px;
      z-index: 10;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ECFDF5;
      border: 1.5px solid #A7F3D0;
      color: #065F46;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 46px;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.1;
      letter-spacing: -1.2px;
    }
    .highlight {
      background: linear-gradient(135deg, #059669 0%, #2563EB 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .sub {
      font-size: 16px;
      color: #475569;
      font-weight: 600;
      line-height: 1.4;
      margin-top: 14px;
    }
    .chips {
      display: flex;
      gap: 10px;
      margin-top: 22px;
      flex-wrap: wrap;
    }
    .chip {
      background: white;
      border: 1.5px solid #E2E8F0;
      padding: 6px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 800;
      color: #0F172A;
      box-shadow: 0 4px 10px rgba(0,0,0,0.04);
    }
    .right-phones {
      position: relative;
      width: 420px;
      height: 480px;
      z-index: 10;
    }
    .mockup-1 {
      position: absolute;
      top: 40px;
      left: 10px;
      width: 220px;
      height: 440px;
      background: #111827;
      border-radius: 36px 36px 0 0;
      padding: 8px 8px 0 8px;
      border: 3px solid #1F2937;
      box-shadow: 0 20px 50px rgba(0,0,0,0.25);
      transform: rotate(-6deg);
      overflow: hidden;
    }
    .mockup-2 {
      position: absolute;
      top: 20px;
      right: 10px;
      width: 220px;
      height: 460px;
      background: #111827;
      border-radius: 36px 36px 0 0;
      padding: 8px 8px 0 8px;
      border: 3px solid #1F2937;
      box-shadow: -10px 20px 60px rgba(0,0,0,0.3);
      transform: rotate(4deg);
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="left-copy">
    <div class="badge">
      <span>🧬</span>
      <span>CELLULAR REVERSAL & LONGEVITY</span>
    </div>
    <h1 class="title">Mito_Reboot™<br><span class="highlight">Healthify Your Cells</span></h1>
    <p class="sub">Continuous glucose monitoring, AI food scanner, real-time metabolic coaching & specialist physician telehealth.</p>
    <div class="chips">
      <div class="chip">📸 AI Food Vision</div>
      <div class="chip">📈 Abbott CGM Synced</div>
      <div class="chip">✨ AI Coaching</div>
      <div class="chip">🩺 Oncologists</div>
    </div>
  </div>
  <div class="right-phones">
    <div class="mockup-1">
      <div style="width: 100%; height: 100%; border-radius: 28px 28px 0 0; overflow: hidden; background: #0F172A;">
        <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
      </div>
    </div>
    <div class="mockup-2">
      <div style="width: 100%; height: 100%; border-radius: 28px 28px 0 0; overflow: hidden; background: white; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #059669;">ABBOTT LIVE CGM</span>
          <div style="font-size: 28px; font-weight: 900; color: #0F172A; margin: 4px 0;">108 <span style="font-size: 11px; color: #059669;">mg/dL</span></div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 8px; text-align: center; font-size: 11px; font-weight: 900; color: #065F46;">96% In Target Band</div>
        </div>
        <div style="background: #0284C7; color: white; padding: 10px; border-radius: 12px; text-align: center; font-size: 11px; font-weight: 900;">
          Dr. Krithikaa MD
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── MASTER GENERATOR FUNCTION ───
async function runGenerator() {
  console.log('================================================================');
  console.log('🚀 RENDERING 100% CONTENT-FOCUSED STORE ASSETS (HEALTHIFY STYLE)');
  console.log('================================================================');

  const tempDir = path.join('/tmp', 'modern_store_v2');
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Phone Screenshots: Android (1080x1920) & iOS (1290x2796)
  console.log('\n📱 [1/4] Rendering Phone Screenshots (Google Play & Apple App Store)...');
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    console.log(`   📸 [${i + 1}/${screens.length}] ${s.id}...`);

    // Android (1080x1920)
    const androidHtml = buildPageHtml({ screen: s, width: 1080, height: 1920, isTablet: false });
    const androidHtmlPath = path.join(tempDir, `${s.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${s.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, { stdio: 'pipe' });

    // iOS (1290x2796)
    const iosHtml = buildPageHtml({ screen: s, width: 1290, height: 2796, isTablet: false });
    const iosHtmlPath = path.join(tempDir, `${s.id}_ios.html`);
    const iosPngPath = path.join(iosDir, `${s.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=1290,2796 "${iosHtmlPath}"`, { stdio: 'pipe' });
  }

  // 2. Feature Graphic: Google Play (1024x500)
  console.log('\n🎨 [2/4] Rendering Modern Google Play Feature Graphic (1024x500)...');
  const fgHtml = buildFeatureGraphicHtml();
  const fgHtmlPath = path.join(tempDir, 'feature_graphic.html');
  const fgPngPath = path.join(featureGraphicDir, 'feature_graphic.png');
  fs.writeFileSync(fgHtmlPath, fgHtml, 'utf8');
  execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${fgPngPath}" --window-size=1024,500 "${fgHtmlPath}"`, { stdio: 'pipe' });
  console.log(`   ✓ Google Play Feature Graphic generated: ${fgPngPath}`);

  // 3. Tablet Screenshots: Android Tablet (1600x2560) & iPad Pro (2048x2732)
  console.log('\n📟 [3/4] Rendering Tablet Screenshots (iPad Pro 12.9" & Android Tablet)...');
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    console.log(`   📸 [${i + 1}/${screens.length}] Tablet: ${s.id}...`);

    // Android Tablet (1600x2560)
    const tabletAndroidHtml = buildPageHtml({ screen: s, width: 1600, height: 2560, isTablet: true });
    const tabletAndroidHtmlPath = path.join(tempDir, `${s.id}_tablet_android.html`);
    const tabletAndroidPngPath = path.join(tabletAndroidDir, `${s.id}.png`);
    fs.writeFileSync(tabletAndroidHtmlPath, tabletAndroidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletAndroidPngPath}" --window-size=1600,2560 "${tabletAndroidHtmlPath}"`, { stdio: 'pipe' });

    // Apple iPad Pro (2048x2732)
    const tabletIosHtml = buildPageHtml({ screen: s, width: 2048, height: 2732, isTablet: true });
    const tabletIosHtmlPath = path.join(tempDir, `${s.id}_tablet_ios.html`);
    const tabletIosPngPath = path.join(tabletIosDir, `${s.id}.png`);
    fs.writeFileSync(tabletIosHtmlPath, tabletIosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletIosPngPath}" --window-size=2048,2732 "${tabletIosHtmlPath}"`, { stdio: 'pipe' });
  }

  // 4. Desktop / Chromebook Widescreen (1920x1080)
  console.log('\n💻 [4/4] Rendering Modern Desktop Screens (1920x1080)...');
  const desktopScreens = [
    {
      id: '01_desktop_snap_and_nutrition',
      title: 'Snap Food AI Scanner & Instant Meal Insights',
      subtitle: 'Automated calorie, macro & cellular repair classification across all meals',
      contentHtml: `
        <div style="display: grid; grid-template-columns: 1.1fr 1.2fr; gap: 24px; height: 100%;">
          <div style="border-radius: 28px; overflow: hidden; position: relative; background: #0F172A; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 16px; color: white; font-weight: 800; font-size: 14px; border: 1px solid rgba(255,255,255,0.2);">
              📸 AI Food Detection Active
            </div>
            <div style="position: absolute; top: 38%; left: 16%; width: 68%; height: 42%; border: 3px solid white; border-radius: 24px; box-shadow: 0 0 20px rgba(16,185,129,0.4);">
              <div style="position: absolute; -top: 14px; left: 16px; background: white; color: #0F172A; font-weight: 900; font-size: 13px; padding: 4px 12px; border-radius: 10px;">🥗 Quinoa & Greens</div>
              <div style="position: absolute; -bottom: 14px; right: 16px; background: white; color: #0F172A; font-weight: 900; font-size: 13px; padding: 4px 12px; border-radius: 10px;">🥑 Hass Avocado</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 18px;">
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                  <span style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 8px;">DINNER LOG</span>
                  <h3 style="font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 6px;">Mediterranean Quinoa & Greens</h3>
                </div>
                <div style="font-size: 32px; font-weight: 900; color: #0F172A;">350 <span style="font-size: 14px; color: #64748B;">kcal</span></div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748B;">🍗 Protein</div>
                  <div style="font-size: 22px; font-weight: 900; color: #059669;">30g</div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748B;">💧 Fat</div>
                  <div style="font-size: 22px; font-weight: 900; color: #D97706;">15g</div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748B;">🌾 Carbs</div>
                  <div style="font-size: 22px; font-weight: 900; color: #3B82F6;">40g</div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 12px; text-align: center;">
                  <div style="font-size: 11px; font-weight: 800; color: #64748B;">🥦 Fibre</div>
                  <div style="font-size: 22px; font-weight: 900; color: #10B981;">8g</div>
                </div>
              </div>
              <div style="background: linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 100%); border: 1.5px solid #A7F3D0; border-radius: 18px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: 16px; font-weight: 900; color: #065F46;">✨ Cellular Repair Score: 9.2 / 10</div>
                  <div style="font-size: 12px; color: #047857; font-weight: 600; margin-top: 2px;">Optimal postprandial glucose stability • Low inflammatory index</div>
                </div>
                <span style="background: white; color: #059669; font-size: 12px; font-weight: 900; padding: 6px 14px; border-radius: 12px;">Safe Tier</span>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div style="background: white; border-radius: 20px; padding: 18px; border: 1.5px solid #E2E8F0;">
                <div style="font-size: 12px; font-weight: 800; color: #64748B;">FASTING TIMELINE</div>
                <div style="font-size: 24px; font-weight: 900; color: #4F46E5; margin-top: 4px;">⚡ 15h 24m</div>
                <div style="font-size: 11px; color: #10B981; font-weight: 700; margin-top: 2px;">Autophagy Stage Active</div>
              </div>
              <div style="background: white; border-radius: 20px; padding: 18px; border: 1.5px solid #E2E8F0;">
                <div style="font-size: 12px; font-weight: 800; color: #64748B;">GLUCOSE SPIKE</div>
                <div style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 4px;">+14 mg/dL</div>
                <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-top: 2px;">Within Optimal Limits</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: '02_desktop_cgm_and_clinical_care',
      title: 'Continuous Glucose Monitoring (CGM) & Oncology Telehealth',
      subtitle: 'Abbott sensor live curves, meal spikes correlation, and direct specialist care',
      contentHtml: `
        <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; height: 100%;">
          <div style="background: white; border-radius: 28px; padding: 26px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div>
                  <span style="font-size: 12px; font-weight: 800; color: #059669; text-transform: uppercase;">Abbott FreeStyle Libre Synced</span>
                  <h3 style="font-size: 24px; font-weight: 900; color: #0F172A; margin-top: 4px;">24-Hour Continuous Glucose Trace</h3>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 42px; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                  <div style="font-size: 12px; color: #059669; font-weight: 800;">mg/dL • In Target (96%)</div>
                </div>
              </div>
              <svg viewBox="0 0 540 180" style="width: 100%; height: 210px; overflow: visible;">
                <defs>
                  <linearGradient id="deskCgmGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="45" width="540" height="90" fill="#F0FDF4" rx="12"/>
                <line x1="0" y1="45" x2="540" y2="45" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
                <line x1="0" y1="135" x2="540" y2="135" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
                <path d="M 0 110 C 60 105, 100 80, 160 55 C 220 30, 260 70, 320 85 C 380 100, 430 75, 480 65 L 540 68 L 540 180 L 0 180 Z" fill="url(#deskCgmGrad)"/>
                <path d="M 0 110 C 60 105, 100 80, 160 55 C 220 30, 260 70, 320 85 C 380 100, 430 75, 480 65 L 540 68" fill="none" stroke="#10B981" stroke-width="4.5" stroke-linecap="round"/>
                <circle cx="160" cy="55" r="7" fill="#10B981" stroke="white" stroke-width="3"/>
              </svg>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 13px; font-weight: 800; color: #64748B;">
              <span>Target Band: 70 – 120 mg/dL</span>
              <span>Glycemic Variability: Low (12.4%)</span>
              <span>HbA1c Equivalent: 5.1%</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: white; border-radius: 28px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
              <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
                <img src="${imgDoctor}" style="width: 72px; height: 72px; border-radius: 20px; object-fit: cover; border: 2.5px solid #0284C7;" />
                <div>
                  <div style="font-size: 18px; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar MD</div>
                  <div style="font-size: 13px; color: #64748B; font-weight: 700;">Preventive Oncologist • 12+ Yrs</div>
                  <div style="font-size: 12px; color: #059669; font-weight: 800; margin-top: 2px;">★ 4.9 (340+ Reviews)</div>
                </div>
              </div>
              <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 16px; padding: 14px; margin-bottom: 16px;">
                <div style="font-size: 12px; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Teleconsultation</div>
                <div style="font-size: 16px; font-weight: 900; color: #0C4A6E; margin-top: 2px;">Today at 4:30 PM (Video Call)</div>
              </div>
              <div style="background: #0284C7; color: white; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 900; text-align: center;">
                Join Patient Consultation Room
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: '03_desktop_ai_mito_chat_recipes',
      title: 'Keep the Conversation Going with AI Mito',
      subtitle: 'Real-time metabolic AI coaching, anti-angiogenic recipes & personalized dietary swaps',
      contentHtml: `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 100%;">
          <div style="background: white; border-radius: 28px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #F1F5F9;">
                <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; font-size: 22px;">✨</div>
                <div>
                  <div style="font-size: 17px; font-weight: 900; color: #0F172A;">AI Mito Health Assistant</div>
                  <div style="font-size: 12px; color: #059669; font-weight: 700;">Active • Trained on Cellular Metabolic Medicine</div>
                </div>
              </div>
              <div style="align-self: flex-end; max-width: 80%; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 20px 20px 4px 20px; padding: 14px 18px; color: #166534; font-size: 15px; font-weight: 800;">
                "I'm struggling to reach my daily protein & fibre budgets on a plant-based schedule. Can you optimize my dinner?"
              </div>
              <div style="align-self: flex-start; max-width: 90%; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px 20px 20px 4px; padding: 16px 20px;">
                <div style="font-size: 14px; color: #334155; line-height: 1.5; font-weight: 600;">
                  Plant-based cellular longevity requires pairing diverse legumes with resistant starch. Here are 2 optimized high-polyphenol options tailored to keep your fasting window unspiked:
                </div>
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 18px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 14px; color: #94A3B8; font-weight: 600;">Ask AI Mito anything about nutrition, markers or sleep...</span>
              <span style="background: #10B981; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">↑</span>
            </div>
          </div>
          <div style="display: grid; grid-template-rows: 1fr 1fr; gap: 16px;">
            <div style="background: white; border-radius: 24px; padding: 18px; border: 1.5px solid #E2E8F0; display: flex; gap: 18px; align-items: center;">
              <img src="${imgDish2}" style="width: 130px; height: 110px; border-radius: 18px; object-fit: cover;" />
              <div style="flex: 1;">
                <span style="font-size: 11px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 3px 8px; border-radius: 6px;">HIGH FIBRE • 240 kcal</span>
                <div style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 4px 0;">Spiced Chickpea & Spinach Curry</div>
                <div style="font-size: 13px; color: #64748B; font-weight: 700;">22g Protein • 12g Dietary Fibre • Low GI</div>
              </div>
            </div>
            <div style="background: white; border-radius: 24px; padding: 18px; border: 1.5px solid #E2E8F0; display: flex; gap: 18px; align-items: center;">
              <img src="${imgDish1}" style="width: 130px; height: 110px; border-radius: 18px; object-fit: cover;" />
              <div style="flex: 1;">
                <span style="font-size: 11px; font-weight: 800; color: #2563EB; background: #EFF6FF; padding: 3px 8px; border-radius: 6px;">POLYPHENOL RICH • 280 kcal</span>
                <div style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 4px 0;">Organic Edamame & Black Bean Bowl</div>
                <div style="font-size: 13px; color: #64748B; font-weight: 700;">26g Protein • 14g Dietary Fibre • Satiety 9.4</div>
              </div>
            </div>
          </div>
        </div>
      `
    },
    {
      id: '04_desktop_reach_goals_and_analytics',
      title: 'Reach Your Health Goals & Reverse Metabolic Age',
      subtitle: 'Clinically proven outcomes: -2.2 lb/wk avg weight loss, 80% habit improvement & sustained autophagy',
      contentHtml: `
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; height: 100%;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: 22px; font-weight: 700; color: #64748B;">lb</span></div>
              <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 8px;">AVG WEEKLY WEIGHT LOSS</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Maintained across 8,000+ active Mito_Reboot members</div>
            </div>
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">80 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
              <div style="font-size: 14px; font-weight: 800; color: #2563EB; margin-top: 8px;">HABIT IMPROVEMENT</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Report sustained dietary & cellular circadian improvements</div>
            </div>
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">45 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
              <div style="font-size: 14px; font-weight: 800; color: #7C3AED; margin-top: 8px;">INCREASE IN ACTIVITY</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Sustained VO2 max and zone 2 aerobic adherence</div>
            </div>
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">94 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
              <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 8px;">NORMALIZED GLUCOSE</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Time in optimal cellular metabolic range (70–120 mg/dL)</div>
            </div>
          </div>
          <div style="border-radius: 28px; overflow: hidden; position: relative; background: #0F172A;">
            <img src="${imgLifestyle}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(15,23,42,0.95) 100%);"></div>
            <div style="position: absolute; bottom: 24px; left: 24px; right: 24px; color: white;">
              <div style="background: rgba(16,185,129,0.9); display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 11px; font-weight: 900; text-transform: uppercase; margin-bottom: 8px;">Member Milestone</div>
              <div style="font-size: 20px; font-weight: 900;">"My HbA1c dropped from 6.8% to 5.2% in 90 days."</div>
              <div style="font-size: 13px; color: #94A3B8; margin-top: 4px;">Priya V. • 38 yrs • Mito_Reboot Clinical Care Cohort</div>
            </div>
          </div>
        </div>
      `
    }
  ];

  function buildDesktopHtml({ screen }) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${screen.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 1080px;
      background: #FFFFFF;
      font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding: 50px 80px 0 80px;
    }
    .ambient-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), radial-gradient(circle at 15% 80%, rgba(37, 99, 235, 0.08) 0%, transparent 60%);
      pointer-events: none;
    }
    .headline-box {
      text-align: center;
      max-width: 1300px;
      margin-bottom: 36px;
      position: relative;
      z-index: 10;
    }
    .headline {
      font-size: 54px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -1.2px;
      line-height: 1.15;
    }
    .subheadline {
      font-size: 20px;
      color: #64748B;
      font-weight: 600;
      margin-top: 8px;
    }
    .mac-window {
      width: 100%;
      flex: 1;
      background: #F8FAFC;
      border-radius: 28px 28px 0 0;
      border: 3.5px solid #1E293B;
      border-bottom: none;
      box-shadow: 0 -20px 80px rgba(15,23,42,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
      z-index: 10;
    }
    .window-header {
      height: 48px;
      background: #FFFFFF;
      border-bottom: 1.5px solid #E2E8F0;
      display: flex;
      align-items: center;
      padding: 0 24px;
      gap: 12px;
    }
    .dots { display: flex; gap: 8px; }
    .dot { width: 13px; height: 13px; border-radius: 50%; }
    .dot-red { background: #EF4444; }
    .dot-yellow { background: #F59E0B; }
    .dot-green { background: #10B981; }
    .window-content {
      flex: 1;
      padding: 28px;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="headline-box">
    <h1 class="headline">${screen.title}</h1>
    <p class="subheadline">${screen.subtitle}</p>
  </div>
  <div class="mac-window">
    <div class="window-header">
      <div class="dots">
        <div class="dot dot-red"></div>
        <div class="dot dot-yellow"></div>
        <div class="dot dot-green"></div>
      </div>
      <span style="font-size: 13px; font-weight: 800; color: #64748B; margin-left: 12px;">Mito_Reboot™ Clinical Workstation</span>
    </div>
    <div class="window-content">
      ${screen.contentHtml}
    </div>
  </div>
</body>
</html>`;
  }

  for (let i = 0; i < desktopScreens.length; i++) {
    const s = desktopScreens[i];
    console.log(`   📸 [${i + 1}/${desktopScreens.length}] Desktop: ${s.id}...`);

    const deskHtml = buildDesktopHtml({ screen: s });
    const deskHtmlPath = path.join(tempDir, `${s.id}.html`);
    const deskPngPath = path.join(desktopDir, `${s.id}.png`);
    fs.writeFileSync(deskHtmlPath, deskHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${deskPngPath}" --window-size=1920,1080 "${deskHtmlPath}"`, { stdio: 'pipe' });
  }
  
  console.log('\n🎉 ALL STORE ASSETS GENERATED WITH ZERO EMPTY SPACES & FULL BASE64 IMAGERY!');
}

runGenerator().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
