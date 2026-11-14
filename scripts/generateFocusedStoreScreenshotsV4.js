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

// ─── 6 MASTER CONTENT-FOCUSED, HIGH-DENSITY SCREENS ───
// Large typography (30px-90px), large padding (30px-40px), large buttons (90px-110px).
// ZERO empty whitespace! Everything is bold, clear, and focused.

const screens = [
  // SCREEN 1: SNAP FOOD AI VISION & 10-SEC LOG
  {
    id: '01_snap_food_ai_scanner',
    headline: 'Snap a Meal or a Packet<br>& Track in 10 Seconds',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
        <!-- Top: Camera Viewfinder with AR Detection Boxes -->
        <div style="height: 48%; position: relative; overflow: hidden; background: #0F172A;">
          <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 65%, rgba(15,23,42,0.95) 100%);"></div>

          <!-- Top Camera Bar -->
          <div style="position: absolute; top: 32px; left: 36px; right: 36px; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">←</div>
            <div style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.6); backdrop-filter: blur(14px); padding: 12px 28px; border-radius: 36px; border: 2px solid rgba(255,255,255,0.3);">
              <span style="font-size: 24px;">📸</span>
              <span style="color: white; font-weight: 900; font-size: 24px;">AI Food Vision • Autofocus Locked</span>
            </div>
            <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #FBBF24; font-size: 28px;">⚡</div>
          </div>

          <!-- AR Bounding Box with Food Badges -->
          <div style="position: absolute; top: 22%; left: 10%; width: 80%; height: 60%; border: 4px solid rgba(255,255,255,0.95); border-radius: 40px; box-shadow: 0 0 0 2000px rgba(0,0,0,0.22), inset 0 0 40px rgba(16,185,129,0.4);">
            <div style="position: absolute; -top: 24px; left: 24px; background: white; color: #0F172A; font-size: 22px; font-weight: 900; padding: 10px 24px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 10px;">
              <span>🥗</span> Quinoa & Greens
            </div>
            <div style="position: absolute; top: 32%; right: -20px; background: white; color: #0F172A; font-size: 22px; font-weight: 900; padding: 10px 24px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 10px;">
              <span>🥑</span> Hass Avocado
            </div>
            <div style="position: absolute; bottom: 24%; left: -20px; background: white; color: #0F172A; font-size: 22px; font-weight: 900; padding: 10px 24px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 10px;">
              <span>🍗</span> Lean Protein
            </div>
            <div style="position: absolute; -bottom: 24px; right: 32px; background: white; color: #0F172A; font-size: 22px; font-weight: 900; padding: 10px 24px; border-radius: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 10px;">
              <span>🎃</span> Sprouted Seeds
            </div>
          </div>
        </div>

        <!-- Bottom: High-Density Content Panel (ZERO EMPTY SPACE) -->
        <div style="height: 52%; background: #FFFFFF; border-radius: 48px 48px 0 0; padding: 36px 40px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 -20px 50px rgba(0,0,0,0.25);">
          <!-- Match & Calories -->
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px;">
              <div>
                <span style="font-size: 20px; font-weight: 900; color: #059669; background: #ECFDF5; padding: 6px 18px; border-radius: 12px; text-transform: uppercase;">✨ 99% AI Food Match</span>
                <h3 style="font-size: 40px; font-weight: 900; color: #0F172A; margin-top: 10px; letter-spacing: -0.8px;">Mediterranean Longevity Plate</h3>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 64px; font-weight: 900; color: #0F172A; line-height: 1;">350 <span style="font-size: 28px; color: #64748B;">kcal</span></div>
                <div style="font-size: 22px; color: #059669; font-weight: 800; margin-top: 4px;">Cellular Score 9.4</div>
              </div>
            </div>

            <!-- 4 Macro Badges (Large & Bold) -->
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px;">
              <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 20px; padding: 16px 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🍗 Protein</div>
                <div style="font-size: 38px; font-weight: 900; color: #059669; margin-top: 4px;">30g</div>
              </div>
              <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 20px; padding: 16px 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">💧 Fat</div>
                <div style="font-size: 38px; font-weight: 900; color: #D97706; margin-top: 4px;">15g</div>
              </div>
              <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 20px; padding: 16px 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🌾 Carbs</div>
                <div style="font-size: 38px; font-weight: 900; color: #3B82F6; margin-top: 4px;">40g</div>
              </div>
              <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 20px; padding: 16px 10px; text-align: center;">
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🥦 Fibre</div>
                <div style="font-size: 38px; font-weight: 900; color: #10B981; margin-top: 4px;">8g</div>
              </div>
            </div>

            <!-- 10-Second Quick Habit Log Banner -->
            <div style="background: linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%); border: 2px solid #BFDBFE; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 16px;">
                <span style="font-size: 34px;">⚡</span>
                <div>
                  <div style="font-size: 26px; font-weight: 900; color: #1E40AF;">10-Sec AI Quick Logger Active</div>
                  <div style="font-size: 20px; color: #3B82F6; font-weight: 700; margin-top: 2px;">Logged calories, 500ml water & glycemic buffer in 1 tap</div>
                </div>
              </div>
              <span style="background: #2563EB; color: white; font-size: 20px; font-weight: 900; padding: 8px 18px; border-radius: 14px;">10s ✓</span>
            </div>

            <!-- Itemized Ingredients Log -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 24px; font-weight: 800; color: #334155;">🥗 Quinoa & Steamed Greens (Low GI)</span>
                <span style="font-size: 26px; font-weight: 900; color: #0F172A;">180 kcal</span>
              </div>
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 24px; font-weight: 800; color: #334155;">🥑 Hass Avocado + Sprouted Pumpkin Seeds</span>
                <span style="font-size: 26px; font-weight: 900; color: #0F172A;">120 kcal</span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons -->
          <div style="display: flex; gap: 16px; margin-top: 16px;">
            <div style="flex: 1; background: #ECFDF5; border: 2.5px solid #A7F3D0; color: #059669; padding: 24px; border-radius: 24px; font-size: 28px; font-weight: 900; text-align: center;">
              ✨ Quick AI Fix
            </div>
            <div style="flex: 1.4; background: #059669; color: white; padding: 24px; border-radius: 24px; font-size: 28px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(5,150,105,0.35);">
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
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.2) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Sensor Top Card -->
          <div style="background: white; border: 2px solid #E2E8F0; border-radius: 36px; padding: 32px 36px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="width: 16px; height: 16px; border-radius: 50%; background: #10B981; box-shadow: 0 0 16px #10B981;"></span>
                <span style="font-size: 22px; font-weight: 900; color: #059669; text-transform: uppercase;">Abbott Sensor Live • 24h Sync</span>
              </div>
              <span style="font-size: 22px; font-weight: 800; color: #64748B;">Synced 2m ago</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px;">
              <div>
                <div style="font-size: 96px; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                <div style="font-size: 24px; color: #059669; font-weight: 800; margin-top: 6px;">mg/dL • Optimal Target Range (→ Steady)</div>
              </div>
              <div style="text-align: right;">
                <span style="background: #ECFDF5; color: #059669; font-size: 26px; font-weight: 900; padding: 10px 24px; border-radius: 18px;">96% In Target Band</span>
              </div>
            </div>

            <!-- Futuristic Glowing CGM SVG Graph -->
            <svg viewBox="0 0 600 180" style="width: 100%; height: 230px; overflow: visible;">
              <defs>
                <linearGradient id="cgmNeon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.45"/>
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="45" width="600" height="90" fill="#F0FDF4" rx="14"/>
              <line x1="0" y1="45" x2="600" y2="45" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
              <line x1="0" y1="135" x2="600" y2="135" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
              
              <path d="M 0 110 C 60 100, 100 70, 160 52 C 220 35, 260 80, 330 92 C 400 105, 460 72, 530 62 L 600 66 L 600 180 L 0 180 Z" fill="url(#cgmNeon)"/>
              <path d="M 0 110 C 60 100, 100 70, 160 52 C 220 35, 260 80, 330 92 C 400 105, 460 72, 530 62 L 600 66" fill="none" stroke="#10B981" stroke-width="6" stroke-linecap="round"/>
              <circle cx="160" cy="52" r="10" fill="#10B981" stroke="white" stroke-width="4"/>
            </svg>

            <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #94A3B8; margin-top: 8px;">
              <span>6 AM</span>
              <span style="color: #059669; font-weight: 900;">12 PM (Lunch +18 mg/dL)</span>
              <span>6 PM</span>
              <span>12 AM</span>
            </div>
          </div>

          <!-- Post-Meal Glycemic Response Card -->
          <div style="background: white; border: 2px solid #E2E8F0; border-radius: 28px; padding: 24px 30px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 18px;">
              <span style="font-size: 40px;">🥑</span>
              <div>
                <div style="font-size: 28px; font-weight: 900; color: #0F172A;">Post-Lunch Glycemic Response</div>
                <div style="font-size: 22px; color: #059669; font-weight: 700; margin-top: 4px;">+18 mg/dL spike • Safe Postprandial Buffer</div>
              </div>
            </div>
            <span style="background: #ECFDF5; color: #059669; font-size: 24px; font-weight: 900; padding: 8px 18px; border-radius: 12px;">Optimal</span>
          </div>

          <!-- Autophagy Fasting Clock -->
          <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: 28px; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 20px; font-weight: 800; color: #34D399; text-transform: uppercase;">AUTOPHAGY CELLULAR REPAIR</div>
              <div style="font-size: 38px; font-weight: 900; margin-top: 4px;">⚡ 15h 24m Fasting Window</div>
              <div style="font-size: 22px; color: #94A3B8; margin-top: 4px;">Deep cellular recycling & mitophagy active</div>
            </div>
            <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.25); border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 36px;">🔥</div>
          </div>

          <!-- 4-Stat Futuristic Telemetry Grid -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 22px 26px;">
              <div style="font-size: 20px; font-weight: 800; color: #64748B;">AVG GLUCOSE</div>
              <div style="font-size: 36px; font-weight: 900; color: #0F172A; margin-top: 4px;">98 mg/dL</div>
            </div>
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 22px 26px;">
              <div style="font-size: 20px; font-weight: 800; color: #64748B;">EST. HbA1c</div>
              <div style="font-size: 36px; font-weight: 900; color: #059669; margin-top: 4px;">5.1% Equivalent</div>
            </div>
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 22px 26px;">
              <div style="font-size: 20px; font-weight: 800; color: #64748B;">VARIABILITY (CV)</div>
              <div style="font-size: 36px; font-weight: 900; color: #2563EB; margin-top: 4px;">11.8% (Very Low)</div>
            </div>
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 22px 26px;">
              <div style="font-size: 20px; font-weight: 800; color: #64748B;">METABOLIC SCORE</div>
              <div style="font-size: 36px; font-weight: 900; color: #10B981; margin-top: 4px;">94 / 100 Safe</div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="background: #10B981; color: white; padding: 26px; border-radius: 26px; font-size: 28px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(16,185,129,0.35); margin-top: 16px;">
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
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Top Multi-AI Selector Tabs -->
          <div style="display: flex; background: #F1F5F9; padding: 6px; border-radius: 24px; gap: 6px;">
            <div style="flex: 1; background: white; border-radius: 18px; padding: 18px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
              <div style="font-size: 24px; font-weight: 900; color: #7C3AED;">🧬 Gia (Genetic AI)</div>
            </div>
            <div style="flex: 1; border-radius: 18px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #64748B;">🌙 Mia (Mental & Sleep)</div>
            </div>
            <div style="flex: 1; border-radius: 18px; padding: 18px; text-align: center;">
              <div style="font-size: 24px; font-weight: 800; color: #64748B;">✨ Mito (Nutrition)</div>
            </div>
          </div>

          <!-- Gia Genetic AI Counselor Showcase Card -->
          <div style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%); border: 2.5px solid #DDD6FE; border-radius: 32px; padding: 28px 32px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">🧬</span>
                <span style="font-size: 24px; font-weight: 900; color: #6D28D9; text-transform: uppercase;">Gia • Genetic AI Counselor</span>
              </div>
              <span style="font-size: 20px; font-weight: 800; color: #7C3AED; background: #EDE9FE; padding: 6px 14px; border-radius: 10px;">NCCN v2.2025 Guidelines</span>
            </div>
            <div style="font-size: 26px; color: #4C1D95; font-weight: 700; line-height: 1.45;">
              "10% of cancers carry hereditary mutations. I evaluated your family pedigree tree: <strong>Low germline risk (BRCA1/2 / Lynch Syndrome Cleared)</strong>."
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px;">
              <span style="background: white; border: 1.5px solid #C4B5FD; color: #6D28D9; font-size: 20px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">Pedigree Tree Audited</span>
              <span style="background: white; border: 1.5px solid #C4B5FD; color: #6D28D9; font-size: 20px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">Hereditary Risk: Tier 1 Cleared</span>
            </div>
          </div>

          <!-- Mia Mental Health & Sleep AI Showcase Card -->
          <div style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border: 2.5px solid #A7F3D0; border-radius: 32px; padding: 28px 32px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 32px;">🌙</span>
                <span style="font-size: 24px; font-weight: 900; color: #065F46; text-transform: uppercase;">Mia • Sleep & Stress Specialist</span>
              </div>
              <span style="font-size: 20px; font-weight: 800; color: #059669; background: #D1FAE5; padding: 6px 14px; border-radius: 10px;">24/7 Available</span>
            </div>
            <div style="font-size: 26px; color: #064E3B; font-weight: 700; line-height: 1.45;">
              "Your heart rate variability (HRV) is <strong>68 ms</strong> with balanced vagal tone. You had 1h 48m deep cellular sleep last night."
            </div>
            <div style="display: flex; gap: 10px; margin-top: 14px;">
              <span style="background: white; border: 1.5px solid #86EFAC; color: #047857; font-size: 20px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">HRV: 68 ms (High Tone)</span>
              <span style="background: white; border: 1.5px solid #86EFAC; color: #047857; font-size: 20px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">Cortisol Index: Low</span>
            </div>
          </div>

          <!-- Dual High-Polyphenol Recipe Recommendations -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 26px; overflow: hidden; display: flex; flex-direction: column;">
              <img src="${imgDish2}" style="height: 140px; width: 100%; object-fit: cover;" />
              <div style="padding: 16px 20px;">
                <div style="font-size: 24px; font-weight: 900; color: #0F172A;">Chickpea Curry</div>
                <div style="font-size: 20px; color: #64748B; font-weight: 700; margin-top: 4px;">22g Protein • Low GI</div>
              </div>
            </div>
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 26px; overflow: hidden; display: flex; flex-direction: column;">
              <img src="${imgDish1}" style="height: 140px; width: 100%; object-fit: cover;" />
              <div style="padding: 16px 20px;">
                <div style="font-size: 24px; font-weight: 900; color: #0F172A;">Edamame Protein Bowl</div>
                <div style="font-size: 20px; color: #64748B; font-weight: 700; margin-top: 4px;">26g Protein • Fasting Safe</div>
              </div>
            </div>
          </div>

          <!-- 10-Sec Quick Action Chips -->
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <span style="background: #FAF5FF; border: 1.5px solid #E9D5FF; color: #7C3AED; font-size: 22px; font-weight: 800; padding: 8px 18px; border-radius: 16px;">🧬 Ask Gia Genetic Risk</span>
            <span style="background: #F0FDF4; border: 1.5px solid #BBF7D0; color: #059669; font-size: 22px; font-weight: 800; padding: 8px 18px; border-radius: 16px;">🌙 2-Min Vagal Breathing</span>
            <span style="background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #2563EB; font-size: 22px; font-weight: 800; padding: 8px 18px; border-radius: 16px;">⚡ 10-Sec Habit Log</span>
          </div>
        </div>

        <!-- Chat Input Bar -->
        <div style="background: #F8FAFC; border: 2px solid #CBD5E1; border-radius: 28px; padding: 22px 30px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 6px 18px rgba(0,0,0,0.04);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="color: #7C3AED; font-size: 32px;">|</span>
            <span style="font-size: 26px; color: #94A3B8; font-weight: 600;">Ask Gia or Mia anything 24/7...</span>
          </div>
          <div style="display: flex; align-items: center; gap: 16px; font-size: 30px; color: #64748B;">
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
    bgGlow: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #0F172A; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: 40px;">
        <!-- Glowing Cyber-Cellular Background -->
        <div style="position: absolute; inset: 0; background: radial-gradient(circle at 80% 10%, rgba(16,185,129,0.35) 0%, transparent 55%), radial-gradient(circle at 20% 90%, rgba(59,130,246,0.3) 0%, transparent 55%), #0F172A;"></div>

        <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: 20px;">
          <!-- Top Futuristic Biological Age Clock -->
          <div style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px); border: 2px solid rgba(255,255,255,0.22); border-radius: 36px; padding: 32px 36px; color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span style="font-size: 22px; font-weight: 900; color: #34D399; text-transform: uppercase; letter-spacing: 0.6px;">🧬 CELLULAR LONGEVITY TELEMETRY</span>
              <span style="background: rgba(16,185,129,0.25); color: #6EE7B7; border: 1.5px solid #10B981; font-size: 20px; font-weight: 800; padding: 4px 14px; border-radius: 10px;">Clinically Validated</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <div style="font-size: 88px; font-weight: 900; color: white; line-height: 1;">34.6 <span style="font-size: 34px; color: #34D399;">Yrs Bio-Age</span></div>
                <div style="font-size: 24px; color: #94A3B8; font-weight: 700; margin-top: 8px;">Chronological Age: 38.0 • <strong>-3.4 Years Reversed</strong></div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 44px; font-weight: 900; color: #60A5FA;">0.88x</div>
                <div style="font-size: 20px; color: #94A3B8;">Pace of Aging</div>
              </div>
            </div>
          </div>

          <!-- 4 Stacked Verified Outcome Hologram Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div style="background: white; border-radius: 28px; padding: 26px 30px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
              <div style="font-size: 64px; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: 26px; color: #64748B;">lb</span></div>
              <div style="font-size: 22px; color: #475569; font-weight: 800; margin-top: 8px; line-height: 1.35;">
                avg weight lost per week by members
              </div>
            </div>

            <div style="background: white; border-radius: 28px; padding: 26px 30px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
              <div style="font-size: 64px; font-weight: 900; color: #059669; line-height: 1;">80 <span style="font-size: 26px; color: #059669;">%</span></div>
              <div style="font-size: 22px; color: #475569; font-weight: 800; margin-top: 8px; line-height: 1.35;">
                sustained habit & dietary improvements
              </div>
            </div>

            <div style="background: white; border-radius: 28px; padding: 26px 30px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
              <div style="font-size: 64px; font-weight: 900; color: #2563EB; line-height: 1;">45 <span style="font-size: 26px; color: #2563EB;">%</span></div>
              <div style="font-size: 22px; color: #475569; font-weight: 800; margin-top: 8px; line-height: 1.35;">
                increase in daily VO2 max & activity
              </div>
            </div>

            <div style="background: white; border-radius: 28px; padding: 26px 30px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
              <div style="font-size: 64px; font-weight: 900; color: #7C3AED; line-height: 1;">94 <span style="font-size: 26px; color: #7C3AED;">%</span></div>
              <div style="font-size: 22px; color: #475569; font-weight: 800; margin-top: 8px; line-height: 1.35;">
                time in optimal autophagy repair band
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Verified Patient Cohort Testimonial -->
        <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border-radius: 30px; padding: 28px 32px; border: 1.5px solid rgba(255,255,255,0.25); color: white;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 22px; font-weight: 900; color: #34D399; text-transform: uppercase;">Verified Member Outcome</span>
            <span style="color: #FBBF24; font-size: 26px;">★★★★★</span>
          </div>
          <div style="font-size: 26px; font-weight: 800; line-height: 1.4;">
            "My HbA1c reduced from 6.8% to 5.2% in 90 days. Mito_Reboot's multi-AI coaching gave me complete metabolic control."
          </div>
          <div style="font-size: 22px; color: #94A3B8; margin-top: 6px;">
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
    bgGlow: 'radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Header Banner -->
          <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: 32px; padding: 28px 32px; color: white; box-shadow: 0 12px 30px rgba(37,99,235,0.28);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 22px; font-weight: 900; color: #93C5FD; text-transform: uppercase;">⚡ 10-SECOND RAPID AI LOGGING</span>
              <span style="background: rgba(255,255,255,0.2); font-size: 20px; font-weight: 800; padding: 4px 14px; border-radius: 10px;">Voice & Vision</span>
            </div>
            <div style="font-size: 34px; font-weight: 900; line-height: 1.3;">
              "Logged lunch, 500ml water, 20m walk & good mood"
            </div>
            <div style="font-size: 22px; color: #DBEAFE; margin-top: 6px;">
              AI parsed 4 habit categories automatically in 1.2 seconds
            </div>
          </div>

          <!-- 6-Grid Habits Display (ALL 12 HABITS COVERED) -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🥗 NUTRITION</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">Quinoa Bowl</div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">350 kcal ✓</span>
            </div>

            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">💧 HYDRATION</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">2,250 ml</div>
              </div>
              <span style="background: #EFF6FF; color: #2563EB; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">75% Target</span>
            </div>

            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🏃 MOVEMENT</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">8,420 Steps</div>
              </div>
              <span style="background: #FAF5FF; color: #7C3AED; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">Zone 2 ✓</span>
            </div>

            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">⚡ FASTING</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">15h 24m Active</div>
              </div>
              <span style="background: #FEF3C7; color: #D97706; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">Autophagy</span>
            </div>

            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🧘 VAGAL BREATH</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">Mia Breathwork</div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">10m Done</span>
            </div>

            <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #64748B;">🌙 SLEEP REPAIR</div>
                <div style="font-size: 26px; font-weight: 900; color: #0F172A; margin-top: 4px;">7h 45m Rest</div>
              </div>
              <span style="background: #EFF6FF; color: #2563EB; font-size: 20px; font-weight: 900; padding: 6px 14px; border-radius: 10px;">88% Quality</span>
            </div>
          </div>

          <!-- Cellular Defense Score Meter -->
          <div style="background: white; border: 2px solid #E2E8F0; border-radius: 28px; padding: 24px 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 24px; font-weight: 900; color: #0F172A;">Daily Cellular Defense Index</span>
              <span style="font-size: 28px; font-weight: 900; color: #059669;">91 / 100 (+4 pts today)</span>
            </div>
            <div style="width: 100%; height: 16px; background: #E2E8F0; border-radius: 8px; overflow: hidden;">
              <div style="width: 91%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: 8px;"></div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div style="background: #2563EB; color: white; padding: 26px; border-radius: 26px; font-size: 28px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(37,99,235,0.35); margin-top: 16px;">
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
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 60%)',
    renderScreen: () => `
      <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; overflow: hidden;">
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Doctor Video Call Profile Card -->
          <div style="background: white; border: 2px solid #E2E8F0; border-radius: 36px; padding: 30px 34px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
            <div style="display: flex; gap: 24px; align-items: center; margin-bottom: 20px;">
              <div style="width: 110px; height: 110px; border-radius: 28px; overflow: hidden; border: 3.5px solid #0284C7; position: relative; flex-shrink: 0; background: #0F172A;">
                <img src="${imgDoctor}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.25);" />
                <div style="position: absolute; bottom: 4px; right: 4px; background: rgba(2,132,199,0.9); color: white; font-size: 14px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">MD</div>
              </div>
              <div>
                <div style="font-size: 34px; font-weight: 900; color: #0F172A;">Clinical Oncology Specialist</div>
                <div style="font-size: 24px; color: #64748B; font-weight: 700; margin-top: 2px;">Preventive Oncology • 12+ Yrs Experience</div>
                <div style="font-size: 22px; color: #059669; font-weight: 800; margin-top: 4px;">★ 4.9 (340+ Verified Consultations)</div>
              </div>
            </div>

            <!-- Next Teleconsultation Banner -->
            <div style="background: #F0F9FF; border: 1.5px solid #BAE6FD; border-radius: 22px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 20px; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Video Teleconsult</div>
                <div style="font-size: 26px; font-weight: 900; color: #0C4A6E; margin-top: 4px;">Today at 4:30 PM (Waiting Room Open)</div>
              </div>
              <span style="background: #0284C7; color: white; font-size: 20px; font-weight: 800; padding: 6px 16px; border-radius: 12px;">Ready</span>
            </div>
          </div>

          <!-- Comprehensive Clinical Deliverables (NO EMPTY SPACE!) -->
          <div style="background: white; border: 2px solid #E2E8F0; border-radius: 32px; padding: 28px 32px;">
            <div style="font-size: 24px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: 16px;">Active Clinical Care Plan</div>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <!-- Item 1 -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="font-size: 30px;">📄</span>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #0F172A;">Medical Prescription PDF</div>
                    <div style="font-size: 20px; color: #64748B;">Digitally signed & QR verified</div>
                  </div>
                </div>
                <span style="font-size: 22px; font-weight: 900; color: #0284C7;">Download ›</span>
              </div>

              <!-- Item 2 -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="font-size: 30px;">🧪</span>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #0F172A;">Biomarker Lab Audit</div>
                    <div style="font-size: 20px; color: #059669; font-weight: 700;">HbA1c 5.1% • CEA 1.2 ng/mL (Optimal)</div>
                  </div>
                </div>
                <span style="font-size: 22px; font-weight: 900; color: #059669;">Verified ✓</span>
              </div>

              <!-- Item 3 -->
              <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex; align-items: center; gap: 14px;">
                  <span style="font-size: 30px;">🧬</span>
                  <div>
                    <div style="font-size: 24px; font-weight: 800; color: #0F172A;">Gia Genetic Pedigree Review</div>
                    <div style="font-size: 20px; color: #7C3AED; font-weight: 700;">BRCA1/2 / Lynch Syndrome Cleared</div>
                  </div>
                </div>
                <span style="font-size: 22px; font-weight: 900; color: #7C3AED;">Audited ✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Consultation Room CTA Button -->
        <div style="background: #0284C7; color: white; padding: 26px; border-radius: 26px; font-size: 28px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(2,132,199,0.35); margin-top: 16px;">
          Join Secure Video Consultation Room
        </div>
      </div>
    `
  }
];

// ─── MASTER HTML TEMPLATE WITH RESPONSIVE SCALING ───
// We use a CSS scale factor relative to the base 1290x2796 design so fonts and cards are ALWAYS proportional!

function buildPageHtml({ screen, width, height, isTablet = false }) {
  // Base scale calculation: The UI is designed for 1290x2796.
  // When rendering on 1080x1920 or tablets, we compute appropriate scale factor!
  const baseWidth = 1290;
  const baseHeight = 2796;
  const scale = width / baseWidth;

  const headlineSize = isTablet ? (width === 2048 ? '88px' : '76px') : (width === 1080 ? '64px' : '76px');
  const chassisWidth = isTablet ? (width === 2048 ? '1860px' : '1480px') : (width === 1080 ? '980px' : '1160px');
  const topPadding = isTablet ? '60px' : (width === 1080 ? '40px' : '64px');
  const headlineMargin = isTablet ? '36px' : '28px';

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
      max-width: ${isTablet ? '1600px' : '1120px'};
      padding: 0 40px;
      margin-bottom: ${headlineMargin};
    }

    .headline {
      font-size: ${headlineSize};
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -2px;
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
      padding: 16px 16px 0 16px;
      box-shadow: 
        0 -20px 80px rgba(15, 23, 42, 0.22),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
      border: 4.5px solid #1F2937;
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
      height: 54px;
      padding: 12px 36px 0 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      z-index: 30;
      color: #0F172A;
      font-weight: 800;
      font-size: 20px;
    }

    .dynamic-island {
      width: 130px;
      height: 30px;
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
          <span style="display: flex; gap: 8px; align-items: center;">📶 🔋</span>
        </div>
        <div class="screen-body">
          ${screen.renderScreen()}
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
  console.log('🚀 RENDERING 100% CONTENT-FOCUSED STORE ASSETS (V4 HIGH-DENSITY)');
  console.log('================================================================');

  const tempDir = path.join('/tmp', 'focused_store_v4');
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Phone Screenshots: iOS (1290x2796) & Android (1080x1920)
  console.log('\n📱 [1/4] Rendering Phone Screenshots (Google Play & Apple App Store)...');
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    console.log(`   📸 [${i + 1}/${screens.length}] ${s.id}...`);

    // iOS (1290x2796)
    const iosHtml = buildPageHtml({ screen: s, width: 1290, height: 2796, isTablet: false });
    const iosHtmlPath = path.join(tempDir, `${s.id}_ios.html`);
    const iosPngPath = path.join(iosDir, `${s.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=1290,2796 "${iosHtmlPath}"`, { stdio: 'pipe' });

    // Android (1080x1920)
    const androidHtml = buildPageHtml({ screen: s, width: 1080, height: 1920, isTablet: false });
    const androidHtmlPath = path.join(tempDir, `${s.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${s.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, { stdio: 'pipe' });
  }

  // 2. Tablet Screenshots: Android Tablet (1600x2560) & iPad Pro (2048x2732)
  console.log('\n📟 [2/4] Rendering Tablet Screenshots (iPad Pro 12.9" & Android Tablet)...');
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

  // 3. Desktop Blurred Clinical Care Screen
  console.log('\n💻 [3/4] Updating Desktop Clinical Care Screenshot with Blurred Doctor Privacy...');
  const deskCareHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 1920px; height: 1080px; background: #FFFFFF; font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; overflow: hidden; display: flex; flex-direction: column; align-items: center; position: relative; padding: 50px 80px 0 80px; }
    .ambient-glow { position: absolute; inset: 0; background: radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.12) 0%, transparent 60%), radial-gradient(circle at 15% 80%, rgba(37, 99, 235, 0.08) 0%, transparent 60%); pointer-events: none; }
    .headline-box { text-align: center; max-width: 1300px; margin-bottom: 36px; position: relative; z-index: 10; }
    .headline { font-size: 54px; font-weight: 900; color: #0F172A; letter-spacing: -1.2px; line-height: 1.15; }
    .subheadline { font-size: 20px; color: #64748B; font-weight: 600; margin-top: 8px; }
    .mac-window { width: 100%; flex: 1; background: #F8FAFC; border-radius: 28px 28px 0 0; border: 3.5px solid #1E293B; border-bottom: none; box-shadow: 0 -20px 80px rgba(15,23,42,0.18); display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 10; }
    .window-header { height: 48px; background: #FFFFFF; border-bottom: 1.5px solid #E2E8F0; display: flex; align-items: center; padding: 0 24px; gap: 12px; }
    .dots { display: flex; gap: 8px; }
    .dot { width: 13px; height: 13px; border-radius: 50%; }
    .dot-red { background: #EF4444; } .dot-yellow { background: #F59E0B; } .dot-green { background: #10B981; }
    .window-content { flex: 1; padding: 28px; overflow: hidden; }
  </style>
</head>
<body>
  <div class="ambient-glow"></div>
  <div class="headline-box">
    <h1 class="headline">Continuous Glucose Monitoring (CGM) & Oncology Telehealth</h1>
    <p class="subheadline">Abbott sensor live curves, meal spikes correlation, and direct specialist care</p>
  </div>
  <div class="mac-window">
    <div class="window-header">
      <div class="dots"><div class="dot dot-red"></div><div class="dot dot-yellow"></div><div class="dot dot-green"></div></div>
      <span style="font-size: 13px; font-weight: 800; color: #64748B; margin-left: 12px;">Mito_Reboot™ Clinical Workstation</span>
    </div>
    <div class="window-content">
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
                <div style="font-size: 13px; color: #64748B; font-weight: 700;">Preventive Oncology • 12+ Yrs</div>
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
    </div>
  </div>
</body>
</html>`;
  const deskCareHtmlPath = path.join(tempDir, '02_desktop_cgm_and_clinical_care.html');
  const deskCarePngPath = path.join(desktopDir, '02_desktop_cgm_and_clinical_care.png');
  fs.writeFileSync(deskCareHtmlPath, deskCareHtml, 'utf8');
  execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${deskCarePngPath}" --window-size=1920,1080 "${deskCareHtmlPath}"`, { stdio: 'pipe' });

  console.log('\n🎉 ALL STORE ASSETS GENERATED WITH LARGE, BOLD, CONTENT-FOCUSED SCALE!');
}

runGenerator().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

