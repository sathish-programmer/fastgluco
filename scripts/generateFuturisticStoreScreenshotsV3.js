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

console.log('Base assets verified:');
console.log(' - food_plate:', imgPlate ? '✓ Base64' : '✗ Missing');
console.log(' - food_dish1:', imgDish1 ? '✓ Base64' : '✗ Missing');
console.log(' - food_dish2:', imgDish2 ? '✓ Base64' : '✗ Missing');
console.log(' - doctor:', imgDoctor ? '✓ Base64' : '✗ Missing');

// ─── 6 MASTER CONTENT-PACKED, FUTURISTIC SCREENS ───
// Built to 100% fill the viewport with NO empty space, featuring Gia, Mia, 10-sec log, futuristic graphs, and zero teeth images.

const screens = [
  // SCREEN 1: SNAP FOOD AI SCANNER & 10-SEC LOG
  {
    id: '01_snap_food_ai_scanner',
    headline: 'Snap a Meal or a Packet<br>& Track in 10 Seconds',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.22) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="position: relative; width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
        <!-- Top Half: Camera Viewfinder with AI AR Detection -->
        <div style="height: ${isTablet ? '52%' : '48%'}; position: relative; overflow: hidden; background: #0F172A;">
          <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 35%, transparent 65%, rgba(15,23,42,0.95) 100%);"></div>

          <!-- Top Bar -->
          <div style="position: absolute; top: ${isTablet ? '28px' : '16px'}; left: ${isTablet ? '32px' : '20px'}; right: ${isTablet ? '32px' : '20px'}; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
            <div style="width: ${isTablet ? '56px' : '40px'}; height: ${isTablet ? '56px' : '40px'}; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: white; font-size: ${isTablet ? '24px' : '18px'};">←</div>
            <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.55); backdrop-filter: blur(12px); padding: ${isTablet ? '10px 24px' : '6px 16px'}; border-radius: 30px; border: 1.5px solid rgba(255,255,255,0.25);">
              <span style="font-size: ${isTablet ? '20px' : '15px'};">📸</span>
              <span style="color: white; font-weight: 900; font-size: ${isTablet ? '18px' : '14px'};">AI Food Vision • Autofocus Locked</span>
            </div>
            <div style="width: ${isTablet ? '56px' : '40px'}; height: ${isTablet ? '56px' : '40px'}; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #FBBF24; font-size: ${isTablet ? '24px' : '18px'};">⚡</div>
          </div>

          <!-- AR Bounding Box with Floating Detection Badges -->
          <div style="position: absolute; top: ${isTablet ? '22%' : '20%'}; left: 12%; width: 76%; height: ${isTablet ? '58%' : '56%'}; border: ${isTablet ? '3.5px' : '2.5px'} solid rgba(255,255,255,0.95); border-radius: 32px; box-shadow: 0 0 0 2000px rgba(0,0,0,0.2), inset 0 0 30px rgba(16,185,129,0.35);">
            <div style="position: absolute; -top: 14px; left: 18px; background: white; color: #0F172A; font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; padding: ${isTablet ? '6px 18px' : '4px 12px'}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 6px;">
              <span>🥗</span> Quinoa & Greens
            </div>
            <div style="position: absolute; top: 34%; right: -14px; background: white; color: #0F172A; font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; padding: ${isTablet ? '6px 18px' : '4px 12px'}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 6px;">
              <span>🥑</span> Hass Avocado
            </div>
            <div style="position: absolute; bottom: 22%; left: -14px; background: white; color: #0F172A; font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; padding: ${isTablet ? '6px 18px' : '4px 12px'}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 6px;">
              <span>🍗</span> Lean Protein
            </div>
            <div style="position: absolute; -bottom: 14px; right: 24px; background: white; color: #0F172A; font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; padding: ${isTablet ? '6px 18px' : '4px 12px'}; border-radius: 12px; box-shadow: 0 4px 14px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 6px;">
              <span>🎃</span> Sprouted Seeds
            </div>
          </div>
        </div>

        <!-- Lower Half: 100% Packed Content Panel (NO EMPTY SPACES) -->
        <div style="flex: 1; background: #FFFFFF; border-radius: 36px 36px 0 0; padding: ${isTablet ? '28px 36px' : '18px 20px'}; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 -16px 40px rgba(0,0,0,0.2);">
          <!-- Top Row: Match & Calories -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div>
                <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">✨ 99% AI Food Match</span>
                <h3 style="font-size: ${isTablet ? '26px' : '19px'}; font-weight: 900; color: #0F172A; margin-top: 4px;">Mediterranean Longevity Plate</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: ${isTablet ? '38px' : '28px'}; font-weight: 900; color: #0F172A; line-height: 1;">350 <span style="font-size: ${isTablet ? '16px' : '13px'}; color: #64748B;">kcal</span></div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #059669; font-weight: 800;">Cellular Score 9.4</div>
              </div>
            </div>

            <!-- 4 Macro Badges -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${isTablet ? '12px' : '8px'}; margin-bottom: 12px;">
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '10px' : '8px'}; text-align: center;">
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🍗 Protein</div>
                <div style="font-size: ${isTablet ? '20px' : '16px'}; font-weight: 900; color: #059669;">30g</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '10px' : '8px'}; text-align: center;">
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">💧 Fat</div>
                <div style="font-size: ${isTablet ? '20px' : '16px'}; font-weight: 900; color: #D97706;">15g</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '10px' : '8px'}; text-align: center;">
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🌾 Carbs</div>
                <div style="font-size: ${isTablet ? '20px' : '16px'}; font-weight: 900; color: #3B82F6;">40g</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '10px' : '8px'}; text-align: center;">
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🥦 Fibre</div>
                <div style="font-size: ${isTablet ? '20px' : '16px'}; font-weight: 900; color: #10B981;">8g</div>
              </div>
            </div>

            <!-- 10-Second Quick Habit Log Banner -->
            <div style="background: linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%); border: 1.5px solid #BFDBFE; border-radius: 18px; padding: ${isTablet ? '14px 20px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: ${isTablet ? '22px' : '18px'};">⚡</span>
                <div>
                  <div style="font-size: ${isTablet ? '15px' : '12px'}; font-weight: 900; color: #1E40AF;">10-Sec AI Quick Logger Active</div>
                  <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #3B82F6; font-weight: 700;">Logged calories, 500ml hydration & glycemic impact in 1 tap</div>
                </div>
              </div>
              <span style="background: #2563EB; color: white; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 4px 10px; border-radius: 8px;">10s ✓</span>
            </div>

            <!-- Itemized Ingredients Log -->
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: ${isTablet ? '10px 14px' : '7px 12px'}; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #334155;">🥗 Quinoa & Steamed Greens (Low GI)</span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A;">180 kcal</span>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: ${isTablet ? '10px 14px' : '7px 12px'}; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #334155;">🥑 Hass Avocado + Sprouted Pumpkin Seeds</span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A;">120 kcal</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 10px; margin-top: 10px;">
            <div style="flex: 1; background: #ECFDF5; border: 1.5px solid #A7F3D0; color: #059669; padding: ${isTablet ? '18px' : '12px'}; border-radius: 16px; font-size: ${isTablet ? '16px' : '13px'}; font-weight: 900; text-align: center;">
              ✨ Quick AI Fix
            </div>
            <div style="flex: 1.4; background: #059669; color: white; padding: ${isTablet ? '18px' : '12px'}; border-radius: 16px; font-size: ${isTablet ? '16px' : '13px'}; font-weight: 900; text-align: center; box-shadow: 0 8px 20px rgba(5,150,105,0.3);">
              Log Meal in 10s
            </div>
          </div>
        </div>
      </div>
    `
  },

  // SCREEN 2: DECODE GLUCOSE CURVES & REAL-TIME CGM SPIKES (FUTURISTIC GRAPHS)
  {
    id: '02_continuous_glucose_cgm',
    headline: 'Decode Glucose Curves<br>& Real-Time CGM Spikes',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.22) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.16) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '32px 30px' : '18px 18px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '16px' : '10px'};">
          <!-- Sensor Top Card -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 26px; padding: ${isTablet ? '24px' : '16px 18px'}; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 12px #10B981;"></span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #059669; text-transform: uppercase;">Abbott Sensor Live • 24h Sync</span>
              </div>
              <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">Synced 2m ago</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
              <div>
                <div style="font-size: ${isTablet ? '58px' : '44px'}; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                <div style="font-size: ${isTablet ? '15px' : '12px'}; color: #059669; font-weight: 800; margin-top: 3px;">mg/dL • Optimal Target Range (→ Steady)</div>
              </div>
              <div style="text-align: right;">
                <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '15px' : '12px'}; font-weight: 900; padding: 6px 14px; border-radius: 12px;">96% In Target Band</span>
              </div>
            </div>

            <!-- Futuristic Glowing CGM SVG Graph -->
            <svg viewBox="0 0 460 130" style="width: 100%; height: ${isTablet ? '160px' : '120px'}; overflow: visible;">
              <defs>
                <linearGradient id="cgmNeon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="30" width="460" height="65" fill="#F0FDF4" rx="10"/>
              <line x1="0" y1="30" x2="460" y2="30" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              <line x1="0" y1="95" x2="460" y2="95" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              
              <path d="M 0 75 C 50 70, 80 50, 130 38 C 180 25, 210 55, 260 65 C 310 75, 360 52, 410 44 L 460 48 L 460 130 L 0 130 Z" fill="url(#cgmNeon)"/>
              <path d="M 0 75 C 50 70, 80 50, 130 38 C 180 25, 210 55, 260 65 C 310 75, 360 52, 410 44 L 460 48" fill="none" stroke="#10B981" stroke-width="4.5" stroke-linecap="round"/>
              <circle cx="130" cy="38" r="7" fill="#10B981" stroke="white" stroke-width="3"/>
            </svg>

            <div style="display: flex; justify-content: space-between; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #94A3B8; margin-top: 4px;">
              <span>6 AM</span>
              <span style="color: #059669; font-weight: 900;">12 PM (Lunch +18 mg/dL)</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          <!-- Post-Meal Glycemic Response Card -->
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 20px; padding: ${isTablet ? '16px 20px' : '12px 16px'}; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: ${isTablet ? '26px' : '20px'};">🥑</span>
              <div>
                <div style="font-size: ${isTablet ? '17px' : '13px'}; font-weight: 900; color: #0F172A;">Post-Lunch Glycemic Response</div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #059669; font-weight: 700; margin-top: 2px;">+18 mg/dL spike • Safe Postprandial Buffer</div>
              </div>
            </div>
            <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; padding: 4px 10px; border-radius: 8px;">Optimal</span>
          </div>

          <!-- Autophagy Fasting Clock -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: 20px; padding: ${isTablet ? '18px 22px' : '14px 18px'}; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #34D399; text-transform: uppercase;">AUTOPHAGY CELLULAR REPAIR</div>
              <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; margin-top: 2px;">⚡ 15h 24m Fasting Window</div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #94A3B8; margin-top: 2px;">Deep cellular recycling & mitophagy active</div>
            </div>
            <div style="width: ${isTablet ? '50px' : '40px'}; height: ${isTablet ? '50px' : '40px'}; border-radius: 50%; background: rgba(16,185,129,0.25); border: 2px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: ${isTablet ? '22px' : '18px'};">🔥</div>
          </div>

          <!-- 4-Stat Futuristic Telemetry Grid (FILLING SPACE) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${isTablet ? '14px' : '8px'};">
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'};">
              <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #64748B;">AVG GLUCOSE</div>
              <div style="font-size: ${isTablet ? '22px' : '17px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">98 mg/dL</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'};">
              <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #64748B;">EST. HbA1c</div>
              <div style="font-size: ${isTablet ? '22px' : '17px'}; font-weight: 900; color: #059669; margin-top: 2px;">5.1% Equivalent</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'};">
              <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #64748B;">VARIABILITY (CV)</div>
              <div style="font-size: ${isTablet ? '22px' : '17px'}; font-weight: 900; color: #2563EB; margin-top: 2px;">11.8% (Very Low)</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'};">
              <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #64748B;">METABOLIC SCORE</div>
              <div style="font-size: ${isTablet ? '22px' : '17px'}; font-weight: 900; color: #10B981; margin-top: 2px;">94 / 100 Safe</div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="background: #10B981; color: white; padding: ${isTablet ? '18px' : '13px'}; border-radius: 18px; font-size: ${isTablet ? '17px' : '13px'}; font-weight: 900; text-align: center; box-shadow: 0 8px 20px rgba(16,185,129,0.3); margin-top: 8px;">
          Export Ambulatory Glucose Telemetry (AGP)
        </div>
      </div>
    `
  },

  // SCREEN 3: MEET GIA & MIA — MULTI-SPECIALIST AI COUNSELORS
  {
    id: '03_gia_mia_specialist_ai_counselors',
    headline: 'Meet Gia & Mia<br>Your 24/7 Specialist AIs',
    accentColor: '#8B5CF6',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.22) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.16) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '32px 30px' : '18px 18px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '16px' : '10px'};">
          <!-- Top Multi-AI Selector Tabs -->
          <div style="display: flex; background: #F1F5F9; padding: 4px; border-radius: 16px; gap: 4px;">
            <div style="flex: 1; background: white; border-radius: 12px; padding: ${isTablet ? '12px' : '8px'}; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #7C3AED;">🧬 Gia (Genetic AI)</div>
            </div>
            <div style="flex: 1; border-radius: 12px; padding: ${isTablet ? '12px' : '8px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">🌙 Mia (Mental & Sleep)</div>
            </div>
            <div style="flex: 1; border-radius: 12px; padding: ${isTablet ? '12px' : '8px'}; text-align: center;">
              <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 800; color: #64748B;">✨ Mito (Nutrition)</div>
            </div>
          </div>

          <!-- Gia Genetic AI Counselor Showcase Card -->
          <div style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%); border: 1.5px solid #DDD6FE; border-radius: 22px; padding: ${isTablet ? '20px' : '14px 16px'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: ${isTablet ? '20px' : '16px'};">🧬</span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #6D28D9; text-transform: uppercase;">Gia • Genetic AI Counselor</span>
              </div>
              <span style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #7C3AED; background: #EDE9FE; padding: 3px 8px; border-radius: 6px;">NCCN v2.2025 Guidelines</span>
            </div>
            <div style="font-size: ${isTablet ? '15px' : '12px'}; color: #4C1D95; font-weight: 700; line-height: 1.4;">
              "10% of cancers carry hereditary mutations. I evaluated your family pedigree tree: <strong>Low germline risk (BRCA1/2 / Lynch Syndrome Cleared)</strong>."
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <span style="background: white; border: 1px solid #C4B5FD; color: #6D28D9; font-size: ${isTablet ? '12px' : '9px'}; font-weight: 800; padding: 3px 8px; border-radius: 8px;">Pedigree Tree Audited</span>
              <span style="background: white; border: 1px solid #C4B5FD; color: #6D28D9; font-size: ${isTablet ? '12px' : '9px'}; font-weight: 800; padding: 3px 8px; border-radius: 8px;">Hereditary Risk: Tier 1 Cleared</span>
            </div>
          </div>

          <!-- Mia Mental Health & Sleep AI Showcase Card -->
          <div style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border: 1.5px solid #A7F3D0; border-radius: 22px; padding: ${isTablet ? '20px' : '14px 16px'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: ${isTablet ? '20px' : '16px'};">🌙</span>
                <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #065F46; text-transform: uppercase;">Mia • Sleep & Stress Specialist</span>
              </div>
              <span style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #059669; background: #D1FAE5; padding: 3px 8px; border-radius: 6px;">24/7 Available</span>
            </div>
            <div style="font-size: ${isTablet ? '15px' : '12px'}; color: #064E3B; font-weight: 700; line-height: 1.4;">
              "Your heart rate variability (HRV) is <strong>68 ms</strong> with balanced vagal tone. You had 1h 48m deep cellular sleep last night."
            </div>
            <div style="display: flex; gap: 6px; margin-top: 8px;">
              <span style="background: white; border: 1px solid #86EFAC; color: #047857; font-size: ${isTablet ? '12px' : '9px'}; font-weight: 800; padding: 3px 8px; border-radius: 8px;">HRV: 68 ms (High Tone)</span>
              <span style="background: white; border: 1px solid #86EFAC; color: #047857; font-size: ${isTablet ? '12px' : '9px'}; font-weight: 800; padding: 3px 8px; border-radius: 8px;">Cortisol Index: Low</span>
            </div>
          </div>

          <!-- Dual High-Polyphenol Recipe Recommendations -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${isTablet ? '14px' : '8px'};">
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; overflow: hidden; display: flex; flex-direction: column;">
              <img src="${imgDish2}" style="height: ${isTablet ? '110px' : '75px'}; width: 100%; object-fit: cover;" />
              <div style="padding: ${isTablet ? '12px' : '8px'};">
                <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A;">Chickpea Curry</div>
                <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #64748B; font-weight: 700;">22g Protein • Low GI</div>
              </div>
            </div>
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; overflow: hidden; display: flex; flex-direction: column;">
              <img src="${imgDish1}" style="height: ${isTablet ? '110px' : '75px'}; width: 100%; object-fit: cover;" />
              <div style="padding: ${isTablet ? '12px' : '8px'};">
                <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A;">Edamame Protein Bowl</div>
                <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #64748B; font-weight: 700;">26g Protein • Fasting Safe</div>
              </div>
            </div>
          </div>

          <!-- 10-Sec Quick Action Chips -->
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <span style="background: #FAF5FF; border: 1px solid #E9D5FF; color: #7C3AED; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; padding: 5px 12px; border-radius: 12px;">🧬 Ask Gia Genetic Risk</span>
            <span style="background: #F0FDF4; border: 1px solid #BBF7D0; color: #059669; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; padding: 5px 12px; border-radius: 12px;">🌙 2-Min Vagal Breathing</span>
            <span style="background: #EFF6FF; border: 1px solid #BFDBFE; color: #2563EB; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; padding: 5px 12px; border-radius: 12px;">⚡ 10-Sec Habit Log</span>
          </div>
        </div>

        <!-- Chat Input Bar -->
        <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 20px; padding: ${isTablet ? '16px 20px' : '10px 16px'}; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #7C3AED; font-size: ${isTablet ? '22px' : '16px'};">|</span>
            <span style="font-size: ${isTablet ? '16px' : '13px'}; color: #94A3B8; font-weight: 600;">Ask Gia or Mia anything 24/7...</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: ${isTablet ? '20px' : '16px'}; color: #64748B;">
            <span>➕</span>
            <span>🎙️</span>
            <span>▦</span>
          </div>
        </div>
      </div>
    `
  },

  // SCREEN 4: FUTURISTIC CELLULAR BIO-AGE & LONGEVITY REVERSAL (NO TEETH IMAGE!)
  {
    id: '04_reach_goals_social_proof',
    headline: 'Reverse Your Bio-Age &<br>Healthify for Good',
    accentColor: '#059669',
    bgGlow: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.22) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.16) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #0F172A; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '32px 30px' : '18px 18px'};">
        <!-- Ambient Glowing Cyber-Cellular Background (NO TEETH!) -->
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 80% 10%, rgba(16,185,129,0.3) 0%, transparent 50%), radial-gradient(circle at 20% 90%, rgba(59,130,246,0.25) 0%, transparent 50%), #0F172A;"></div>

        <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: ${isTablet ? '16px' : '10px'};">
          <!-- Top Futuristic Biological Age Clock -->
          <div style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(20px); border: 1.5px solid rgba(255,255,255,0.18); border-radius: 26px; padding: ${isTablet ? '24px' : '16px 18px'}; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #34D399; text-transform: uppercase; letter-spacing: 0.5px;">🧬 CELLULAR LONGEVITY TELEMETRY</span>
              <span style="background: rgba(16,185,129,0.2); color: #6EE7B7; border: 1px solid #10B981; font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; padding: 2px 8px; border-radius: 6px;">Clinically Validated</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: ${isTablet ? '48px' : '36px'}; font-weight: 900; color: white; line-height: 1;">34.6 <span style="font-size: ${isTablet ? '20px' : '15px'}; color: #34D399;">Yrs Bio-Age</span></div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #94A3B8; font-weight: 700; margin-top: 4px;">Chronological Age: 38.0 • <strong>-3.4 Years Reversed</strong></div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: ${isTablet ? '24px' : '18px'}; font-weight: 900; color: #60A5FA;">0.88x</div>
                <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #94A3B8;">Pace of Aging</div>
              </div>
            </div>
          </div>

          <!-- 4 Stacked Verified Outcome Hologram Cards (Healthify Style) -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${isTablet ? '14px' : '8px'};">
            <!-- Card 1 -->
            <div style="background: white; border-radius: 20px; padding: ${isTablet ? '18px' : '12px 14px'}; box-shadow: 0 10px 24px rgba(0,0,0,0.18);">
              <div style="font-size: ${isTablet ? '42px' : '28px'}; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: ${isTablet ? '18px' : '13px'}; color: #64748B;">lb</span></div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #475569; font-weight: 800; margin-top: 4px; line-height: 1.3;">
                avg weight lost per week by members
              </div>
            </div>

            <!-- Card 2 -->
            <div style="background: white; border-radius: 20px; padding: ${isTablet ? '18px' : '12px 14px'}; box-shadow: 0 10px 24px rgba(0,0,0,0.18);">
              <div style="font-size: ${isTablet ? '42px' : '28px'}; font-weight: 900; color: #059669; line-height: 1;">80 <span style="font-size: ${isTablet ? '18px' : '13px'}; color: #059669;">%</span></div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #475569; font-weight: 800; margin-top: 4px; line-height: 1.3;">
                sustained habit & dietary improvements
              </div>
            </div>

            <!-- Card 3 -->
            <div style="background: white; border-radius: 20px; padding: ${isTablet ? '18px' : '12px 14px'}; box-shadow: 0 10px 24px rgba(0,0,0,0.18);">
              <div style="font-size: ${isTablet ? '42px' : '28px'}; font-weight: 900; color: #2563EB; line-height: 1;">45 <span style="font-size: ${isTablet ? '18px' : '13px'}; color: #2563EB;">%</span></div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #475569; font-weight: 800; margin-top: 4px; line-height: 1.3;">
                increase in daily VO2 max & activity
              </div>
            </div>

            <!-- Card 4 -->
            <div style="background: white; border-radius: 20px; padding: ${isTablet ? '18px' : '12px 14px'}; box-shadow: 0 10px 24px rgba(0,0,0,0.18);">
              <div style="font-size: ${isTablet ? '42px' : '28px'}; font-weight: 900; color: #7C3AED; line-height: 1;">94 <span style="font-size: ${isTablet ? '18px' : '13px'}; color: #7C3AED;">%</span></div>
              <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #475569; font-weight: 800; margin-top: 4px; line-height: 1.3;">
                time in optimal autophagy repair band
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Verified Patient Cohort Testimonial (NO EMPTY SPACE) -->
        <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.12); backdrop-filter: blur(16px); border-radius: 22px; padding: ${isTablet ? '20px 24px' : '14px 16px'}; border: 1px solid rgba(255,255,255,0.22); color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 900; color: #34D399; text-transform: uppercase;">Verified Member Outcome</span>
            <span style="color: #FBBF24; font-size: ${isTablet ? '14px' : '11px'};">★★★★★</span>
          </div>
          <div style="font-size: ${isTablet ? '16px' : '13px'}; font-weight: 800; line-height: 1.35;">
            "My HbA1c reduced from 6.8% to 5.2% in 90 days. Mito_Reboot's multi-AI coaching gave me complete metabolic control."
          </div>
          <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #94A3B8; margin-top: 4px;">
            Priya V. • Age 38 • Active Mito_Reboot Clinical Care Cohort
          </div>
        </div>
      </div>
    `
  },

  // SCREEN 5: LOG 12 DAILY HABITS IN 10 SECONDS (10-SEC AI QUICK CHECK-IN)
  {
    id: '05_ten_second_ai_habit_checkin',
    headline: 'Log 12 Daily Habits in<br>10 Seconds with AI',
    accentColor: '#2563EB',
    bgGlow: 'radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.22) 0%, transparent 60%), radial-gradient(circle at 15% 80%, rgba(16, 185, 129, 0.16) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '32px 30px' : '18px 18px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '16px' : '10px'};">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: 24px; padding: ${isTablet ? '22px' : '14px 18px'}; color: white; box-shadow: 0 10px 24px rgba(37,99,235,0.25);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #93C5FD; text-transform: uppercase;">⚡ 10-SECOND RAPID AI LOGGING</span>
              <span style="background: rgba(255,255,255,0.2); font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; padding: 2px 8px; border-radius: 6px;">Voice & Vision</span>
            </div>
            <div style="font-size: ${isTablet ? '22px' : '16px'}; font-weight: 900; line-height: 1.25;">
              "Logged lunch, 500ml water, 20m walk & good mood"
            </div>
            <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #DBEAFE; margin-top: 4px;">
              AI parsed 4 habit categories automatically in 1.2 seconds
            </div>
          </div>

          <!-- 6-Grid Habits Display (ALL 12 CELLULAR HABITS COVERED) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${isTablet ? '12px' : '8px'};">
            <!-- 1. Diet -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🥗 NUTRITION</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">Quinoa Bowl</div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">350 kcal ✓</span>
            </div>

            <!-- 2. Water -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">💧 HYDRATION</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">2,250 ml</div>
              </div>
              <span style="background: #EFF6FF; color: #2563EB; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">75% Target</span>
            </div>

            <!-- 3. Movement -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🏃 MOVEMENT</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">8,420 Steps</div>
              </div>
              <span style="background: #FAF5FF; color: #7C3AED; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">Zone 2 ✓</span>
            </div>

            <!-- 4. Fasting -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">⚡ FASTING</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">15h 24m Active</div>
              </div>
              <span style="background: #FEF3C7; color: #D97706; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">Autophagy</span>
            </div>

            <!-- 5. Stress/Mia -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🧘 VAGAL BREATH</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">Mia Breathwork</div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">10m Done</span>
            </div>

            <!-- 6. Sleep -->
            <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 16px; padding: ${isTablet ? '14px' : '10px 12px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; color: #64748B;">🌙 SLEEP REPAIR</div>
                <div style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #0F172A; margin-top: 2px;">7h 45m Rest</div>
              </div>
              <span style="background: #EFF6FF; color: #2563EB; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; padding: 3px 8px; border-radius: 6px;">88% Quality</span>
            </div>
          </div>

          <!-- Cellular Defense Score Meter -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: ${isTablet ? '18px 22px' : '12px 16px'};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A;">Daily Cellular Defense Index</span>
              <span style="font-size: ${isTablet ? '16px' : '12px'}; font-weight: 900; color: #059669;">91 / 100 (+4 pts today)</span>
            </div>
            <div style="width: 100%; height: 10px; background: #E2E8F0; border-radius: 5px; overflow: hidden;">
              <div style="width: 91%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: 5px;"></div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="background: #2563EB; color: white; padding: ${isTablet ? '18px' : '13px'}; border-radius: 18px; font-size: ${isTablet ? '17px' : '13px'}; font-weight: 900; text-align: center; box-shadow: 0 8px 20px rgba(37,99,235,0.3); margin-top: 8px;">
          ⚡ Confirm & Save All 12 Habits in 10s
        </div>
      </div>
    `
  },

  // SCREEN 6: CONSULT CLINICAL ONCOLOGISTS & SPECIALIST TELEHEALTH CARE
  {
    id: '06_consult_top_specialists',
    headline: 'Consult Clinical<br>Specialists Anytime',
    accentColor: '#0284C7',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.22) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.16) 0%, transparent 60%)',
    renderScreen: (isTablet) => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${isTablet ? '32px 30px' : '18px 18px'}; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: ${isTablet ? '16px' : '10px'};">
          <!-- Doctor Video Call Profile Card -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 26px; padding: ${isTablet ? '22px' : '16px 18px'}; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
            <div style="display: flex; gap: ${isTablet ? '18px' : '14px'}; align-items: center; margin-bottom: 12px;">
              <img src="${imgDoctor}" style="width: ${isTablet ? '84px' : '62px'}; height: ${isTablet ? '84px' : '62px'}; border-radius: 20px; object-fit: cover; border: 3px solid #0284C7;" />
              <div>
                <div style="font-size: ${isTablet ? '22px' : '17px'}; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar MD</div>
                <div style="font-size: ${isTablet ? '14px' : '11px'}; color: #64748B; font-weight: 700;">Preventive Oncologist • 12+ Yrs Experience</div>
                <div style="font-size: ${isTablet ? '13px' : '10px'}; color: #059669; font-weight: 800; margin-top: 2px;">★ 4.9 (340+ Verified Consultations)</div>
              </div>
            </div>

            <!-- Next Teleconsultation Banner -->
            <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 16px; padding: ${isTablet ? '14px 18px' : '10px 14px'}; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${isTablet ? '12px' : '10px'}; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Video Teleconsult</div>
                <div style="font-size: ${isTablet ? '17px' : '13px'}; font-weight: 900; color: #0C4A6E; margin-top: 2px;">Today at 4:30 PM (Waiting Room Open)</div>
              </div>
              <span style="background: #0284C7; color: white; font-size: ${isTablet ? '13px' : '10px'}; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Ready</span>
            </div>
          </div>

          <!-- Comprehensive Clinical Deliverables (NO EMPTY SPACE!) -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 22px; padding: ${isTablet ? '18px 20px' : '12px 16px'};">
            <div style="font-size: ${isTablet ? '14px' : '11px'}; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 8px;">Active Clinical Care Plan</div>
            
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <!-- Item 1 -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '12px 16px' : '8px 12px'}; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: ${isTablet ? '20px' : '15px'};">📄</span>
                  <div>
                    <div style="font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; color: #0F172A;">Medical Prescription PDF</div>
                    <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #64748B;">Digitally signed & QR verified</div>
                  </div>
                </div>
                <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #0284C7;">Download ›</span>
              </div>

              <!-- Item 2 -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '12px 16px' : '8px 12px'}; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: ${isTablet ? '20px' : '15px'};">🧪</span>
                  <div>
                    <div style="font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; color: #0F172A;">Biomarker Lab Audit</div>
                    <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #059669; font-weight: 700;">HbA1c 5.1% • CEA 1.2 ng/mL (Optimal)</div>
                  </div>
                </div>
                <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #059669;">Verified ✓</span>
              </div>

              <!-- Item 3 (Gia Hereditary Review) -->
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: ${isTablet ? '12px 16px' : '8px 12px'}; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: ${isTablet ? '20px' : '15px'};">🧬</span>
                  <div>
                    <div style="font-size: ${isTablet ? '15px' : '12px'}; font-weight: 800; color: #0F172A;">Gia Genetic Pedigree Review</div>
                    <div style="font-size: ${isTablet ? '12px' : '9px'}; color: #7C3AED; font-weight: 700;">BRCA1/2 / Lynch Syndrome Cleared</div>
                  </div>
                </div>
                <span style="font-size: ${isTablet ? '13px' : '10px'}; font-weight: 900; color: #7C3AED;">Audited ✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Big Consultation Room CTA Button -->
        <div style="background: #0284C7; color: white; padding: ${isTablet ? '18px' : '13px'}; border-radius: 18px; font-size: ${isTablet ? '18px' : '14px'}; font-weight: 900; text-align: center; box-shadow: 0 10px 24px rgba(2,132,199,0.35); margin-top: 8px;">
          Join Secure Consultation Room
        </div>
      </div>
    `
  }
];

// ─── MASTER HTML TEMPLATE ───
function buildPageHtml({ screen, width, height, isTablet = false }) {
  const isAndroid = width === 1080 || (isTablet && width === 1600);
  
  // Dynamic scaling for clean responsive fit
  const headlineSize = isTablet ? (width === 2048 ? '86px' : '72px') : (isAndroid ? '54px' : '66px');
  const chassisWidth = isTablet ? (width === 2048 ? '1820px' : '1440px') : (isAndroid ? '960px' : '1140px');
  const topPadding = isTablet ? '64px' : (isAndroid ? '46px' : '74px');
  const headlineMargin = isTablet ? '34px' : '26px';

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
      padding: ${isTablet ? '18px 18px 0 18px' : '14px 14px 0 14px'};
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
      height: ${isTablet ? '54px' : '44px'};
      padding: ${isTablet ? '14px 36px 0 36px' : '10px 26px 0 26px'};
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
        radial-gradient(circle at 15% 80%, rgba(37, 99, 235, 0.16) 0%, transparent 60%);
      pointer-events: none;
    }
    .left-copy {
      max-width: 520px;
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
      font-size: 15px;
      color: #475569;
      font-weight: 600;
      line-height: 1.45;
      margin-top: 14px;
    }
    .chips {
      display: flex;
      gap: 8px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .chip {
      background: white;
      border: 1.5px solid #E2E8F0;
      padding: 6px 12px;
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
      top: 30px;
      left: 10px;
      width: 220px;
      height: 450px;
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
      top: 15px;
      right: 10px;
      width: 220px;
      height: 465px;
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
    <p class="sub">Continuous glucose monitoring, AI food vision, Gia genetic counseling, Mia sleep & mental AI, and specialist doctor telehealth.</p>
    <div class="chips">
      <div class="chip">📸 10-Sec AI Vision</div>
      <div class="chip">📈 Abbott CGM Synced</div>
      <div class="chip">🧬 Gia Genetic AI</div>
      <div class="chip">🌙 Mia Mental AI</div>
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
      <div style="width: 100%; height: 100%; border-radius: 28px 28px 0 0; overflow: hidden; background: white; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <span style="font-size: 10px; font-weight: 800; color: #059669;">ABBOTT LIVE CGM</span>
          <div style="font-size: 30px; font-weight: 900; color: #0F172A; margin: 4px 0;">108 <span style="font-size: 11px; color: #059669;">mg/dL</span></div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; padding: 8px; text-align: center; font-size: 11px; font-weight: 900; color: #065F46;">96% In Target Band</div>
        </div>
        <div style="background: #7C3AED; color: white; padding: 10px; border-radius: 12px; text-align: center; font-size: 11px; font-weight: 900;">
          🧬 Gia + 🌙 Mia AI
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── 4 MASTER DESKTOP WORKSTATIONS (1920 x 1080) ───
const desktopScreens = [
  {
    id: '01_desktop_snap_and_nutrition',
    title: 'Snap Food AI Vision & 10-Second Habit Log',
    subtitle: 'Automated calorie, macro & cellular repair classification across all meals in under 10 seconds',
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
                <span style="background: #ECFDF5; color: #059669; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 8px;">10-SEC RAPID LOG</span>
                <h3 style="font-size: 22px; font-weight: 900; color: #0F172A; margin-top: 6px;">Mediterranean Longevity Plate</h3>
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
                <div style="font-size: 16px; font-weight: 900; color: #065F46;">✨ Cellular Repair Score: 9.4 / 10</div>
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
              <div style="font-size: 12px; font-weight: 800; color: #64748B;">10-SEC LOGGING</div>
              <div style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 4px;">1 Tap AI</div>
              <div style="font-size: 11px; color: #64748B; font-weight: 700; margin-top: 2px;">All 12 Habits Saved</div>
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
            <span>Glycemic Variability: Low (11.8%)</span>
            <span>HbA1c Equivalent: 5.1%</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: white; border-radius: 28px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
              <div style="width: 72px; height: 72px; border-radius: 20px; overflow: hidden; border: 2.5px solid #0284C7; position: relative; flex-shrink: 0; background: #0F172A;">
                <img src="${imgDoctor}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.25);" />
                <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(2,132,199,0.9); color: white; font-size: 10px; font-weight: 900; padding: 1px 4px; border-radius: 4px;">MD</div>
              </div>
              <div>
                <div style="font-size: 18px; font-weight: 900; color: #0F172A;">Clinical Oncology Specialist</div>
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
    title: 'Gia & Mia Specialist Multi-AI Counselors',
    subtitle: 'NCCN genetic risk counseling with Gia & 24/7 sleep and mental health with Mia',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; height: 100%;">
        <div style="background: white; border-radius: 28px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; flex-direction: column; gap: 14px;">
            <!-- Gia Banner -->
            <div style="background: #FAF5FF; border: 1.5px solid #DDD6FE; border-radius: 18px; padding: 16px;">
              <div style="font-size: 12px; font-weight: 900; color: #6D28D9;">🧬 Gia (Genetic AI Counselor - NCCN v2.2025)</div>
              <div style="font-size: 14px; color: #4C1D95; font-weight: 700; margin-top: 4px;">
                Pedigree tree audited. BRCA1/2 and Lynch syndrome germline risk tier cleared.
              </div>
            </div>
            <!-- Mia Banner -->
            <div style="background: #F0FDF4; border: 1.5px solid #A7F3D0; border-radius: 18px; padding: 16px;">
              <div style="font-size: 12px; font-weight: 900; color: #065F46;">🌙 Mia (Mental & Sleep Health Expert)</div>
              <div style="font-size: 14px; color: #064E3B; font-weight: 700; margin-top: 4px;">
                HRV is 68 ms with high parasympathetic tone. 1h 48m deep cellular sleep recorded.
              </div>
            </div>
          </div>
          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 18px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; color: #94A3B8; font-weight: 600;">Ask Gia or Mia anything 24/7...</span>
            <span style="background: #7C3AED; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">↑</span>
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
    title: 'Biological Age Reversal & Clinical Longevity',
    subtitle: 'Clinically proven outcomes: -3.4 years bio-age reversal, 80% habit improvement & sustained autophagy',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; height: 100%;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: 22px; font-weight: 700; color: #64748B;">lb</span></div>
            <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 8px;">AVG WEEKLY WEIGHT LOSS</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Maintained across active Mito_Reboot members</div>
          </div>
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">80 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
            <div style="font-size: 14px; font-weight: 800; color: #2563EB; margin-top: 8px;">HABIT IMPROVEMENT</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Sustained dietary & cellular circadian improvements</div>
          </div>
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">45 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
            <div style="font-size: 14px; font-weight: 800; color: #7C3AED; margin-top: 8px;">INCREASE IN ACTIVITY</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Sustained VO2 max and zone 2 aerobic adherence</div>
          </div>
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 48px; font-weight: 900; color: #0F172A; line-height: 1;">94 <span style="font-size: 22px; font-weight: 700; color: #64748B;">%</span></div>
            <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 8px;">OPTIMAL AUTOPHAGY</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 4px;">Time in optimal cellular metabolic range</div>
          </div>
        </div>
        <div style="border-radius: 28px; overflow: hidden; position: relative; background: #0F172A; padding: 30px; display: flex; flex-direction: column; justify-content: space-between; color: white;">
          <div>
            <div style="font-size: 14px; font-weight: 900; color: #34D399; text-transform: uppercase;">CELLULAR BIO-AGE CLOCK</div>
            <div style="font-size: 46px; font-weight: 900; margin-top: 8px;">34.6 <span style="font-size: 20px; color: #34D399;">Yrs</span></div>
            <div style="font-size: 14px; color: #94A3B8; margin-top: 4px;">Chronological: 38.0 • <strong>-3.4 Years Reversed</strong></div>
          </div>
          <div style="background: rgba(255,255,255,0.1); border-radius: 18px; padding: 20px; border: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 16px; font-weight: 900;">"My HbA1c dropped from 6.8% to 5.2% in 90 days."</div>
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

// ─── MASTER GENERATOR FUNCTION ───
async function runGenerator() {
  console.log('================================================================');
  console.log('🚀 RENDERING FUTURISTIC, 100% CONTENT-PACKED STORE ASSETS');
  console.log('   (FEATURING GIA, MIA, 10-SEC LOG & ZERO EMPTY WHITESPACE)');
  console.log('================================================================');

  const tempDir = path.join('/tmp', 'futuristic_store_v3');
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

