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

// ─── DYNAMIC PROPORTIONAL SCALING HELPER ───
// Computes exact scaled pixels for Android (1080x1920), iOS (1290x2796), and Tablets
function getScale(platform) {
  if (platform === 'ios') return 1.36; // iOS is 1.456x taller than Android
  if (platform === 'tablet_ios') return 1.45;
  if (platform === 'tablet_android') return 1.30;
  return 1.0; // Android baseline
}

// ─── 6 PROPORTIONALLY SCALED SCREENS ───
const screens = [
  // 1. SNAP FOOD AI SCANNER & 10-SEC LOG
  {
    id: '01_snap_food_ai_scanner',
    headline: 'Snap a Meal or a Packet<br>& Track in 10 Seconds',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
          <!-- Top: Camera Viewfinder with AR Detection Boxes -->
          <div style="height: 46%; position: relative; overflow: hidden; background: #0F172A;">
            <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 65%, rgba(15,23,42,0.95) 100%);"></div>

            <!-- Top Camera Bar -->
            <div style="position: absolute; top: ${s(28)}px; left: ${s(32)}px; right: ${s(32)}px; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
              <div style="width: ${s(56)}px; height: ${s(56)}px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(24)}px;">←</div>
              <div style="display: flex; align-items: center; gap: ${s(10)}px; background: rgba(0,0,0,0.6); backdrop-filter: blur(14px); padding: ${s(10)}px ${s(24)}px; border-radius: ${s(32)}px; border: 2px solid rgba(255,255,255,0.3);">
                <span style="font-size: ${s(20)}px;">📸</span>
                <span style="color: white; font-weight: 900; font-size: ${s(20)}px;">AI Food Vision • Autofocus Locked</span>
              </div>
              <div style="width: ${s(56)}px; height: ${s(56)}px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #FBBF24; font-size: ${s(24)}px;">⚡</div>
            </div>

            <!-- AR Bounding Box with Food Badges -->
            <div style="position: absolute; top: 22%; left: 10%; width: 80%; height: 60%; border: 4px solid rgba(255,255,255,0.95); border-radius: ${s(36)}px; box-shadow: 0 0 0 2000px rgba(0,0,0,0.22), inset 0 0 40px rgba(16,185,129,0.4);">
              <div style="position: absolute; -top: ${s(20)}px; left: ${s(20)}px; background: white; color: #0F172A; font-size: ${s(18)}px; font-weight: 900; padding: ${s(8)}px ${s(20)}px; border-radius: ${s(16)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🥗</span> Quinoa & Greens
              </div>
              <div style="position: absolute; top: 32%; right: -${s(16)}px; background: white; color: #0F172A; font-size: ${s(18)}px; font-weight: 900; padding: ${s(8)}px ${s(20)}px; border-radius: ${s(16)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🥑</span> Hass Avocado
              </div>
              <div style="position: absolute; bottom: 24%; left: -${s(16)}px; background: white; color: #0F172A; font-size: ${s(18)}px; font-weight: 900; padding: ${s(8)}px ${s(20)}px; border-radius: ${s(16)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🍗</span> Lean Protein
              </div>
              <div style="position: absolute; -bottom: ${s(20)}px; right: ${s(28)}px; background: white; color: #0F172A; font-size: ${s(18)}px; font-weight: 900; padding: ${s(8)}px ${s(20)}px; border-radius: ${s(16)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🎃</span> Sprouted Seeds
              </div>
            </div>
          </div>

          <!-- Bottom: High-Density Content Panel (ZERO EMPTY SPACE) -->
          <div style="height: 54%; background: #FFFFFF; border-radius: ${s(44)}px ${s(44)}px 0 0; padding: ${s(32)}px ${s(36)}px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 -20px 50px rgba(0,0,0,0.25);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${s(16)}px;">
                <div>
                  <span style="font-size: ${s(18)}px; font-weight: 900; color: #059669; background: #ECFDF5; padding: ${s(6)}px ${s(16)}px; border-radius: ${s(10)}px; text-transform: uppercase;">✨ 99% AI Food Match</span>
                  <h3 style="font-size: ${s(36)}px; font-weight: 900; color: #0F172A; margin-top: ${s(8)}px; letter-spacing: -0.8px;">Mediterranean Longevity Plate</h3>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(58)}px; font-weight: 900; color: #0F172A; line-height: 1;">350 <span style="font-size: ${s(24)}px; color: #64748B;">kcal</span></div>
                  <div style="font-size: ${s(20)}px; color: #059669; font-weight: 800; margin-top: ${s(4)}px;">Cellular Score 9.4</div>
                </div>
              </div>

              <!-- 4 Macro Badges (Large & Bold) -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(14)}px; margin-bottom: ${s(20)}px;">
                <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🍗 Protein</div>
                  <div style="font-size: ${s(34)}px; font-weight: 900; color: #059669; margin-top: ${s(4)}px;">30g</div>
                </div>
                <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">💧 Fat</div>
                  <div style="font-size: ${s(34)}px; font-weight: 900; color: #D97706; margin-top: ${s(4)}px;">15g</div>
                </div>
                <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🌾 Carbs</div>
                  <div style="font-size: ${s(34)}px; font-weight: 900; color: #3B82F6; margin-top: ${s(4)}px;">40g</div>
                </div>
                <div style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🥦 Fibre</div>
                  <div style="font-size: ${s(34)}px; font-weight: 900; color: #10B981; margin-top: ${s(4)}px;">8g</div>
                </div>
              </div>

              <!-- 10-Second Quick Habit Log Banner -->
              <div style="background: linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%); border: 2px solid #BFDBFE; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(22)}px; display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(18)}px;">
                <div style="display: flex; align-items: center; gap: ${s(14)}px;">
                  <span style="font-size: ${s(30)}px;">⚡</span>
                  <div>
                    <div style="font-size: ${s(22)}px; font-weight: 900; color: #1E40AF;">10-Sec AI Quick Logger Active</div>
                    <div style="font-size: ${s(18)}px; color: #3B82F6; font-weight: 700; margin-top: ${s(2)}px;">Logged calories, 500ml water & glycemic buffer in 1 tap</div>
                  </div>
                </div>
                <span style="background: #2563EB; color: white; font-size: ${s(18)}px; font-weight: 900; padding: ${s(6)}px ${s(16)}px; border-radius: ${s(12)}px;">10s ✓</span>
              </div>

              <!-- Itemized Ingredients Log (3 ITEMS SO IT PERFECTLY FILLS THE HEIGHT) -->
              <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(22)}px; font-weight: 800; color: #334155;">🥗 Quinoa & Steamed Greens (Low GI)</span>
                  <span style="font-size: ${s(24)}px; font-weight: 900; color: #0F172A;">180 kcal</span>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(22)}px; font-weight: 800; color: #334155;">🥑 Hass Avocado & Sprouted Pumpkin Seeds</span>
                  <span style="font-size: ${s(24)}px; font-weight: 900; color: #0F172A;">120 kcal</span>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(22)}px; font-weight: 800; color: #334155;">🫒 Cold-Pressed EVOO (Polyphenols)</span>
                  <span style="font-size: ${s(24)}px; font-weight: 900; color: #0F172A;">50 kcal</span>
                </div>
              </div>
            </div>

            <!-- Bottom Action Buttons -->
            <div style="display: flex; gap: ${s(14)}px; margin-top: ${s(16)}px;">
              <div style="flex: 1; background: #ECFDF5; border: 2px solid #A7F3D0; color: #059669; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(24)}px; font-weight: 900; text-align: center;">
                ✨ Quick AI Fix
              </div>
              <div style="flex: 1.4; background: #059669; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(24)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(5,150,105,0.35);">
                Log Meal in 10s
              </div>
            </div>
          </div>
        </div>
      `;
    }
  },

  // 2. DECODE GLUCOSE CURVES & REAL-TIME CGM SPIKES
  {
    id: '02_continuous_glucose_cgm',
    headline: 'Decode Glucose Curves<br>& Real-Time CGM Spikes',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(14, 165, 233, 0.2) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(36)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(18)}px;">
            <!-- Sensor Top Card -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(32)}px; padding: ${s(28)}px ${s(32)}px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="width: ${s(14)}px; height: ${s(14)}px; border-radius: 50%; background: #10B981; box-shadow: 0 0 16px #10B981;"></span>
                  <span style="font-size: ${s(20)}px; font-weight: 900; color: #059669; text-transform: uppercase;">Abbott Sensor Live • 24h Sync</span>
                </div>
                <span style="font-size: ${s(20)}px; font-weight: 800; color: #64748B;">Synced 2m ago</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: ${s(14)}px;">
                <div>
                  <div style="font-size: ${s(88)}px; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                  <div style="font-size: ${s(22)}px; color: #059669; font-weight: 800; margin-top: ${s(4)}px;">mg/dL • Optimal Target Range (→ Steady)</div>
                </div>
                <div style="text-align: right;">
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(24)}px; font-weight: 900; padding: ${s(8)}px ${s(20)}px; border-radius: ${s(16)}px;">96% In Target Band</span>
                </div>
              </div>

              <!-- Futuristic Glowing CGM SVG Graph -->
              <svg viewBox="0 0 600 180" style="width: 100%; height: ${s(220)}px; overflow: visible;">
                <defs>
                  <linearGradient id="cgmNeonP" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.45"/>
                    <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="45" width="600" height="90" fill="#F0FDF4" rx="14"/>
                <line x1="0" y1="45" x2="600" y2="45" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
                <line x1="0" y1="135" x2="600" y2="135" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
                
                <path d="M 0 110 C 60 100, 100 70, 160 52 C 220 35, 260 80, 330 92 C 400 105, 460 72, 530 62 L 600 66 L 600 180 L 0 180 Z" fill="url(#cgmNeonP)"/>
                <path d="M 0 110 C 60 100, 100 70, 160 52 C 220 35, 260 80, 330 92 C 400 105, 460 72, 530 62 L 600 66" fill="none" stroke="#10B981" stroke-width="6" stroke-linecap="round"/>
                <circle cx="160" cy="52" r="10" fill="#10B981" stroke="white" stroke-width="4"/>
              </svg>

              <div style="display: flex; justify-content: space-between; font-size: ${s(18)}px; font-weight: 800; color: #94A3B8; margin-top: ${s(6)}px;">
                <span>6 AM</span>
                <span style="color: #059669; font-weight: 900;">12 PM (Lunch +18 mg/dL)</span>
                <span>6 PM</span>
                <span>12 AM</span>
              </div>
            </div>

            <!-- Post-Meal Glycemic Response Card -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(20)}px ${s(26)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(16)}px;">
                <span style="font-size: ${s(36)}px;">🥑</span>
                <div>
                  <div style="font-size: ${s(24)}px; font-weight: 900; color: #0F172A;">Post-Lunch Glycemic Response</div>
                  <div style="font-size: ${s(18)}px; color: #059669; font-weight: 700; margin-top: ${s(2)}px;">+18 mg/dL spike • Safe Postprandial Buffer</div>
                </div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: ${s(20)}px; font-weight: 900; padding: ${s(6)}px ${s(16)}px; border-radius: ${s(10)}px;">Optimal</span>
            </div>

            <!-- Autophagy Fasting Clock -->
            <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: ${s(24)}px; padding: ${s(24)}px ${s(28)}px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${s(18)}px; font-weight: 800; color: #34D399; text-transform: uppercase;">AUTOPHAGY CELLULAR REPAIR</div>
                <div style="font-size: ${s(34)}px; font-weight: 900; margin-top: ${s(4)}px;">⚡ 15h 24m Fasting Window</div>
                <div style="font-size: ${s(18)}px; color: #94A3B8; margin-top: ${s(4)}px;">Deep cellular recycling & mitophagy active</div>
              </div>
              <div style="width: ${s(64)}px; height: ${s(64)}px; border-radius: 50%; background: rgba(16,185,129,0.25); border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: ${s(32)}px;">🔥</div>
            </div>

            <!-- 4-Stat Telemetry Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s(14)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(22)}px;">
                <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">AVG GLUCOSE</div>
                <div style="font-size: ${s(32)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">98 mg/dL</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(22)}px;">
                <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">EST. HbA1c</div>
                <div style="font-size: ${s(32)}px; font-weight: 900; color: #059669; margin-top: ${s(2)}px;">5.1% Equivalent</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(22)}px;">
                <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">VARIABILITY (CV)</div>
                <div style="font-size: ${s(32)}px; font-weight: 900; color: #2563EB; margin-top: ${s(2)}px;">11.8% (Very Low)</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(22)}px;">
                <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">METABOLIC SCORE</div>
                <div style="font-size: ${s(32)}px; font-weight: 900; color: #10B981; margin-top: ${s(2)}px;">94 / 100 Safe</div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="background: #10B981; color: white; padding: ${s(22)}px; border-radius: ${s(22)}px; font-size: ${s(24)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(16,185,129,0.35); margin-top: ${s(14)}px;">
            Export Ambulatory Glucose Telemetry (AGP)
          </div>
        </div>
      `;
    }
  },

  // 3. MEET GIA & MIA — MULTI-SPECIALIST AI COUNSELORS
  {
    id: '03_gia_mia_specialist_ai_counselors',
    headline: 'Meet Gia & Mia<br>Your 24/7 Specialist AIs',
    accentColor: '#8B5CF6',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #FFFFFF; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(36)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(18)}px;">
            <!-- Top Multi-AI Selector Tabs -->
            <div style="display: flex; background: #F1F5F9; padding: ${s(6)}px; border-radius: ${s(22)}px; gap: ${s(6)}px;">
              <div style="flex: 1; background: white; border-radius: ${s(16)}px; padding: ${s(16)}px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #7C3AED;">🧬 Gia (Genetic AI)</div>
              </div>
              <div style="flex: 1; border-radius: ${s(16)}px; padding: ${s(16)}px; text-align: center;">
                <div style="font-size: ${s(22)}px; font-weight: 800; color: #64748B;">🌙 Mia (Mental & Sleep)</div>
              </div>
              <div style="flex: 1; border-radius: ${s(16)}px; padding: ${s(16)}px; text-align: center;">
                <div style="font-size: ${s(22)}px; font-weight: 800; color: #64748B;">✨ Mito (Nutrition)</div>
              </div>
            </div>

            <!-- Gia Genetic AI Counselor Showcase Card -->
            <div style="background: linear-gradient(135deg, #FAF5FF 0%, #F5F3FF 100%); border: 2.5px solid #DDD6FE; border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="font-size: ${s(28)}px;">🧬</span>
                  <span style="font-size: ${s(22)}px; font-weight: 900; color: #6D28D9; text-transform: uppercase;">Gia • Genetic AI Counselor</span>
                </div>
                <span style="font-size: ${s(18)}px; font-weight: 800; color: #7C3AED; background: #EDE9FE; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">NCCN v2.2025 Guidelines</span>
              </div>
              <div style="font-size: ${s(23)}px; color: #4C1D95; font-weight: 700; line-height: 1.45;">
                "10% of cancers carry hereditary mutations. I evaluated your family pedigree tree: <strong>Low germline risk (BRCA1/2 / Lynch Syndrome Cleared)</strong>."
              </div>
              <div style="display: flex; gap: ${s(8)}px; margin-top: ${s(12)}px;">
                <span style="background: white; border: 1.5px solid #C4B5FD; color: #6D28D9; font-size: ${s(18)}px; font-weight: 800; padding: ${s(6)}px ${s(12)}px; border-radius: ${s(10)}px;">Pedigree Tree Audited</span>
                <span style="background: white; border: 1.5px solid #C4B5FD; color: #6D28D9; font-size: ${s(18)}px; font-weight: 800; padding: ${s(6)}px ${s(12)}px; border-radius: ${s(10)}px;">Hereditary Risk: Tier 1 Cleared</span>
              </div>
            </div>

            <!-- Mia Mental Health & Sleep AI Showcase Card -->
            <div style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border: 2.5px solid #A7F3D0; border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="font-size: ${s(28)}px;">🌙</span>
                  <span style="font-size: ${s(22)}px; font-weight: 900; color: #065F46; text-transform: uppercase;">Mia • Sleep & Stress Specialist</span>
                </div>
                <span style="font-size: ${s(18)}px; font-weight: 800; color: #059669; background: #D1FAE5; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">24/7 Available</span>
              </div>
              <div style="font-size: ${s(23)}px; color: #064E3B; font-weight: 700; line-height: 1.45;">
                "Your heart rate variability (HRV) is <strong>68 ms</strong> with balanced vagal tone. You had 1h 48m deep cellular sleep last night."
              </div>
              <div style="display: flex; gap: ${s(8)}px; margin-top: ${s(12)}px;">
                <span style="background: white; border: 1.5px solid #86EFAC; color: #047857; font-size: ${s(18)}px; font-weight: 800; padding: ${s(6)}px ${s(12)}px; border-radius: ${s(10)}px;">HRV: 68 ms (High Tone)</span>
                <span style="background: white; border: 1.5px solid #86EFAC; color: #047857; font-size: ${s(18)}px; font-weight: 800; padding: ${s(6)}px ${s(12)}px; border-radius: ${s(10)}px;">Cortisol Index: Low</span>
              </div>
            </div>

            <!-- Dual High-Polyphenol Recipe Recommendations -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(14)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; overflow: hidden; display: flex; flex-direction: column;">
                <img src="${imgDish2}" style="height: ${s(130)}px; width: 100%; object-fit: cover;" />
                <div style="padding: ${s(14)}px ${s(18)}px;">
                  <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">Chickpea Curry</div>
                  <div style="font-size: ${s(18)}px; color: #64748B; font-weight: 700; margin-top: ${s(3)}px;">22g Protein • Low GI</div>
                </div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; overflow: hidden; display: flex; flex-direction: column;">
                <img src="${imgDish1}" style="height: ${s(130)}px; width: 100%; object-fit: cover;" />
                <div style="padding: ${s(14)}px ${s(18)}px;">
                  <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">Edamame Protein Bowl</div>
                  <div style="font-size: ${s(18)}px; color: #64748B; font-weight: 700; margin-top: ${s(3)}px;">26g Protein • Fasting Safe</div>
                </div>
              </div>
            </div>

            <!-- 10-Sec Quick Action Chips -->
            <div style="display: flex; gap: ${s(8)}px; flex-wrap: wrap;">
              <span style="background: #FAF5FF; border: 1.5px solid #E9D5FF; color: #7C3AED; font-size: ${s(19)}px; font-weight: 800; padding: ${s(7)}px ${s(16)}px; border-radius: ${s(14)}px;">🧬 Ask Gia Genetic Risk</span>
              <span style="background: #F0FDF4; border: 1.5px solid #BBF7D0; color: #059669; font-size: ${s(19)}px; font-weight: 800; padding: ${s(7)}px ${s(16)}px; border-radius: ${s(14)}px;">🌙 2-Min Vagal Breathing</span>
              <span style="background: #EFF6FF; border: 1.5px solid #BFDBFE; color: #2563EB; font-size: ${s(19)}px; font-weight: 800; padding: ${s(7)}px ${s(16)}px; border-radius: ${s(14)}px;">⚡ 10-Sec Habit Log</span>
            </div>
          </div>

          <!-- Chat Input Bar -->
          <div style="background: #F8FAFC; border: 2px solid #CBD5E1; border-radius: ${s(24)}px; padding: ${s(20)}px ${s(26)}px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 6px 18px rgba(0,0,0,0.04);">
            <div style="display: flex; align-items: center; gap: ${s(10)}px;">
              <span style="color: #7C3AED; font-size: ${s(28)}px;">|</span>
              <span style="font-size: ${s(24)}px; color: #94A3B8; font-weight: 600;">Ask Gia or Mia anything 24/7...</span>
            </div>
            <div style="display: flex; align-items: center; gap: ${s(14)}px; font-size: ${s(26)}px; color: #64748B;">
              <span>➕</span>
              <span>🎙️</span>
              <span>▦</span>
            </div>
          </div>
        </div>
      `;
    }
  },

  // 4. FUTURISTIC CELLULAR BIO-AGE & LONGEVITY REVERSAL (NO TEETH IMAGE!)
  {
    id: '04_reach_goals_social_proof',
    headline: 'Reverse Your Bio-Age &<br>Healthify for Good',
    accentColor: '#059669',
    bgGlow: 'radial-gradient(circle at 20% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #0F172A; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(36)}px;">
          <!-- Glowing Cyber-Cellular Background -->
          <div style="position: absolute; inset: 0; background: radial-gradient(circle at 80% 10%, rgba(16,185,129,0.35) 0%, transparent 55%), radial-gradient(circle at 20% 90%, rgba(59,130,246,0.3) 0%, transparent 55%), #0F172A;"></div>

          <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: ${s(18)}px;">
            <!-- Top Futuristic Biological Age Clock -->
            <div style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px); border: 2px solid rgba(255,255,255,0.22); border-radius: ${s(32)}px; padding: ${s(28)}px ${s(32)}px; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <span style="font-size: ${s(20)}px; font-weight: 900; color: #34D399; text-transform: uppercase; letter-spacing: 0.6px;">🧬 CELLULAR LONGEVITY TELEMETRY</span>
                <span style="background: rgba(16,185,129,0.25); color: #6EE7B7; border: 1.5px solid #10B981; font-size: ${s(18)}px; font-weight: 800; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">Clinically Validated</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <div style="font-size: ${s(82)}px; font-weight: 900; color: white; line-height: 1;">34.6 <span style="font-size: ${s(30)}px; color: #34D399;">Yrs Bio-Age</span></div>
                  <div style="font-size: ${s(22)}px; color: #94A3B8; font-weight: 700; margin-top: ${s(6)}px;">Chronological Age: 38.0 • <strong>-3.4 Years Reversed</strong></div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(40)}px; font-weight: 900; color: #60A5FA;">0.88x</div>
                  <div style="font-size: ${s(18)}px; color: #94A3B8;">Pace of Aging</div>
                </div>
              </div>
            </div>

            <!-- 4 Stacked Verified Outcome Hologram Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(14)}px;">
              <div style="background: white; border-radius: ${s(24)}px; padding: ${s(22)}px ${s(26)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(58)}px; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: ${s(24)}px; color: #64748B;">lb</span></div>
                <div style="font-size: ${s(20)}px; color: #475569; font-weight: 800; margin-top: ${s(6)}px; line-height: 1.35;">
                  avg weight lost per week by members
                </div>
              </div>

              <div style="background: white; border-radius: ${s(24)}px; padding: ${s(22)}px ${s(26)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(58)}px; font-weight: 900; color: #059669; line-height: 1;">80 <span style="font-size: ${s(24)}px; color: #059669;">%</span></div>
                <div style="font-size: ${s(20)}px; color: #475569; font-weight: 800; margin-top: ${s(6)}px; line-height: 1.35;">
                  sustained habit & dietary improvements
                </div>
              </div>

              <div style="background: white; border-radius: ${s(24)}px; padding: ${s(22)}px ${s(26)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(58)}px; font-weight: 900; color: #2563EB; line-height: 1;">45 <span style="font-size: ${s(24)}px; color: #2563EB;">%</span></div>
                <div style="font-size: ${s(20)}px; color: #475569; font-weight: 800; margin-top: ${s(6)}px; line-height: 1.35;">
                  increase in daily VO2 max & activity
                </div>
              </div>

              <div style="background: white; border-radius: ${s(24)}px; padding: ${s(22)}px ${s(26)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(58)}px; font-weight: 900; color: #7C3AED; line-height: 1;">94 <span style="font-size: ${s(24)}px; color: #7C3AED;">%</span></div>
                <div style="font-size: ${s(20)}px; color: #475569; font-weight: 800; margin-top: ${s(6)}px; line-height: 1.35;">
                  time in optimal autophagy repair band
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Verified Patient Cohort Testimonial -->
          <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border-radius: ${s(26)}px; padding: ${s(24)}px ${s(28)}px; border: 1.5px solid rgba(255,255,255,0.25); color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
              <span style="font-size: ${s(20)}px; font-weight: 900; color: #34D399; text-transform: uppercase;">Verified Member Outcome</span>
              <span style="color: #FBBF24; font-size: ${s(24)}px;">★★★★★</span>
            </div>
            <div style="font-size: ${s(23)}px; font-weight: 800; line-height: 1.4;">
              "My HbA1c reduced from 6.8% to 5.2% in 90 days. Mito_Reboot's multi-AI coaching gave me complete metabolic control."
            </div>
            <div style="font-size: ${s(19)}px; color: #94A3B8; margin-top: ${s(6)}px;">
              Priya V. • Age 38 • Active Mito_Reboot Clinical Care Cohort
            </div>
          </div>
        </div>
      `;
    }
  },

  // 5. LOG 12 DAILY HABITS IN 10 SECONDS (10-SEC AI QUICK CHECK-IN)
  {
    id: '05_ten_second_ai_habit_checkin',
    headline: 'Log 12 Daily Habits in<br>10 Seconds with AI',
    accentColor: '#2563EB',
    bgGlow: 'radial-gradient(circle at 85% 20%, rgba(37, 99, 235, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(36)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(18)}px;">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px; color: white; box-shadow: 0 12px 30px rgba(37,99,235,0.28);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
                <span style="font-size: ${s(20)}px; font-weight: 900; color: #93C5FD; text-transform: uppercase;">⚡ 10-SECOND RAPID AI LOGGING</span>
                <span style="background: rgba(255,255,255,0.2); font-size: ${s(18)}px; font-weight: 800; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">Voice & Vision</span>
              </div>
              <div style="font-size: ${s(30)}px; font-weight: 900; line-height: 1.3;">
                "Logged lunch, 500ml water, 20m walk & good mood"
              </div>
              <div style="font-size: ${s(20)}px; color: #DBEAFE; margin-top: ${s(4)}px;">
                AI parsed 4 habit categories automatically in 1.2 seconds
              </div>
            </div>

            <!-- 6-Grid Habits Display (ALL 12 HABITS COVERED) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s(14)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🥗 NUTRITION</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">Quinoa Bowl</div>
                </div>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">350 kcal ✓</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">💧 HYDRATION</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">2,250 ml</div>
                </div>
                <span style="background: #EFF6FF; color: #2563EB; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">75% Target</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🏃 MOVEMENT</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">8,420 Steps</div>
                </div>
                <span style="background: #FAF5FF; color: #7C3AED; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">Zone 2 ✓</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">⚡ FASTING</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">15h 24m Active</div>
                </div>
                <span style="background: #FEF3C7; color: #D97706; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">Autophagy</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🧘 VAGAL BREATH</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">Mia Breathwork</div>
                </div>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">10m Done</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">🌙 SLEEP REPAIR</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">7h 45m Rest</div>
                </div>
                <span style="background: #EFF6FF; color: #2563EB; font-size: ${s(18)}px; font-weight: 900; padding: ${s(5)}px ${s(12)}px; border-radius: ${s(8)}px;">88% Quality</span>
              </div>
            </div>

            <!-- Cellular Defense Score Meter -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(20)}px ${s(26)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(8)}px;">
                <span style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">Daily Cellular Defense Index</span>
                <span style="font-size: ${s(24)}px; font-weight: 900; color: #059669;">91 / 100 (+4 pts today)</span>
              </div>
              <div style="width: 100%; height: ${s(14)}px; background: #E2E8F0; border-radius: ${s(7)}px; overflow: hidden;">
                <div style="width: 91%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: ${s(7)}px;"></div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="background: #2563EB; color: white; padding: ${s(22)}px; border-radius: ${s(22)}px; font-size: ${s(24)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(37,99,235,0.35); margin-top: ${s(14)}px;">
            ⚡ Confirm & Save All 12 Habits in 10s
          </div>
        </div>
      `;
    }
  },

  // 6. CONSULT CLINICAL ONCOLOGISTS & SPECIALIST TELEHEALTH CARE
  {
    id: '06_consult_top_specialists',
    headline: 'Consult Clinical<br>Specialists Anytime',
    accentColor: '#0284C7',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.25) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(16, 185, 129, 0.18) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(36)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(18)}px;">
            <!-- Doctor Video Call Profile Card (WITH BLURRED DOCTOR PRIVACY PROTECTION) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(32)}px; padding: ${s(26)}px ${s(30)}px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
              <div style="display: flex; gap: ${s(20)}px; align-items: center; margin-bottom: ${s(16)}px;">
                <div style="width: ${s(96)}px; height: ${s(96)}px; border-radius: ${s(24)}px; overflow: hidden; border: 3px solid #0284C7; position: relative; flex-shrink: 0; background: #0F172A;">
                  <img src="${imgDoctor}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.25);" />
                  <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(2,132,199,0.9); color: white; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">MD</div>
                </div>
                <div>
                  <div style="font-size: ${s(30)}px; font-weight: 900; color: #0F172A;">Clinical Oncology Specialist</div>
                  <div style="font-size: ${s(22)}px; color: #64748B; font-weight: 700; margin-top: ${s(2)}px;">Preventive Oncology • 12+ Yrs Experience</div>
                  <div style="font-size: ${s(20)}px; color: #059669; font-weight: 800; margin-top: ${s(4)}px;">★ 4.9 (340+ Verified Consultations)</div>
                </div>
              </div>

              <!-- Next Teleconsultation Banner -->
              <div style="background: #F0F9FF; border: 1.5px solid #BAE6FD; border-radius: ${s(18)}px; padding: ${s(18)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(18)}px; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Video Teleconsult</div>
                  <div style="font-size: ${s(23)}px; font-weight: 900; color: #0C4A6E; margin-top: ${s(3)}px;">Today at 4:30 PM (Waiting Room Open)</div>
                </div>
                <span style="background: #0284C7; color: white; font-size: ${s(18)}px; font-weight: 800; padding: ${s(5)}px ${s(14)}px; border-radius: ${s(10)}px;">Ready</span>
              </div>
            </div>

            <!-- Comprehensive Clinical Deliverables (NO EMPTY SPACE!) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px;">
              <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: ${s(14)}px;">Active Clinical Care Plan</div>
              
              <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                <!-- Item 1 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(26)}px;">📄</span>
                    <div>
                      <div style="font-size: ${s(22)}px; font-weight: 800; color: #0F172A;">Medical Prescription PDF</div>
                      <div style="font-size: ${s(18)}px; color: #64748B;">Digitally signed & QR verified</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(20)}px; font-weight: 900; color: #0284C7;">Download ›</span>
                </div>

                <!-- Item 2 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(26)}px;">🧪</span>
                    <div>
                      <div style="font-size: ${s(22)}px; font-weight: 800; color: #0F172A;">Biomarker Lab Audit</div>
                      <div style="font-size: ${s(18)}px; color: #059669; font-weight: 700;">HbA1c 5.1% • CEA 1.2 ng/mL (Optimal)</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(20)}px; font-weight: 900; color: #059669;">Verified ✓</span>
                </div>

                <!-- Item 3 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(26)}px;">🧬</span>
                    <div>
                      <div style="font-size: ${s(22)}px; font-weight: 800; color: #0F172A;">Gia Genetic Pedigree Review</div>
                      <div style="font-size: ${s(18)}px; color: #7C3AED; font-weight: 700;">BRCA1/2 / Lynch Syndrome Cleared</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(20)}px; font-weight: 900; color: #7C3AED;">Audited ✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Consultation Room CTA Button -->
          <div style="background: #0284C7; color: white; padding: ${s(22)}px; border-radius: ${s(22)}px; font-size: ${s(24)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(2,132,199,0.35); margin-top: ${s(14)}px;">
            Join Secure Video Consultation Room
          </div>
        </div>
      `;
    }
  }
];

// ─── MASTER HTML TEMPLATE ───
function buildPageHtml({ screen, width, height, platform }) {
  const isTablet = platform === 'tablet_ios' || platform === 'tablet_android';
  const scale = getScale(platform);

  const headlineSize = isTablet ? (width === 2048 ? '88px' : '76px') : (width === 1080 ? '66px' : '84px');
  const chassisWidth = isTablet ? (width === 2048 ? '1880px' : '1500px') : (width === 1080 ? '1000px' : '1200px');
  const topPadding = isTablet ? '54px' : (width === 1080 ? '36px' : '56px');
  const headlineMargin = isTablet ? '32px' : '24px';

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
      max-width: ${isTablet ? '1600px' : '1140px'};
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
      height: ${Math.round(50 * scale)}px;
      padding: ${Math.round(10 * scale)}px 36px 0 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      z-index: 30;
      color: #0F172A;
      font-weight: 800;
      font-size: ${Math.round(20 * scale)}px;
    }

    .dynamic-island {
      width: ${Math.round(130 * scale)}px;
      height: ${Math.round(30 * scale)}px;
      background: #000000;
      border-radius: ${Math.round(18 * scale)}px;
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
          ${screen.renderScreen(scale)}
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
  console.log('🚀 RENDERING PROPORTIONALLY SCALED STORE ASSETS (V5 BOLD SCALE)');
  console.log('================================================================');

  const tempDir = path.join('/tmp', 'proportional_store_v5');
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Phone Screenshots: iOS (1290x2796) & Android (1080x1920)
  console.log('\n📱 [1/3] Rendering Phone Screenshots (iOS 1.36x scale & Android baseline)...');
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    console.log(`   📸 [${i + 1}/${screens.length}] ${s.id}...`);

    // iOS (1290x2796) with 1.36x scale factor
    const iosHtml = buildPageHtml({ screen: s, width: 1290, height: 2796, platform: 'ios' });
    const iosHtmlPath = path.join(tempDir, `${s.id}_ios.html`);
    const iosPngPath = path.join(iosDir, `${s.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=1290,2796 "${iosHtmlPath}"`, { stdio: 'pipe' });

    // Android (1080x1920) with 1.0x baseline scale factor
    const androidHtml = buildPageHtml({ screen: s, width: 1080, height: 1920, platform: 'android' });
    const androidHtmlPath = path.join(tempDir, `${s.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${s.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, { stdio: 'pipe' });
  }

  // 2. Tablet Screenshots: Android Tablet (1600x2560) & iPad Pro (2048x2732)
  console.log('\n📟 [2/3] Rendering Tablet Screenshots (iPad Pro 1.45x scale & Android Tablet 1.30x scale)...');
  for (let i = 0; i < screens.length; i++) {
    const s = screens[i];
    console.log(`   📸 [${i + 1}/${screens.length}] Tablet: ${s.id}...`);

    // Android Tablet (1600x2560)
    const tabletAndroidHtml = buildPageHtml({ screen: s, width: 1600, height: 2560, platform: 'tablet_android' });
    const tabletAndroidHtmlPath = path.join(tempDir, `${s.id}_tablet_android.html`);
    const tabletAndroidPngPath = path.join(tabletAndroidDir, `${s.id}.png`);
    fs.writeFileSync(tabletAndroidHtmlPath, tabletAndroidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletAndroidPngPath}" --window-size=1600,2560 "${tabletAndroidHtmlPath}"`, { stdio: 'pipe' });

    // Apple iPad Pro (2048x2732)
    const tabletIosHtml = buildPageHtml({ screen: s, width: 2048, height: 2732, platform: 'tablet_ios' });
    const tabletIosHtmlPath = path.join(tempDir, `${s.id}_tablet_ios.html`);
    const tabletIosPngPath = path.join(tabletIosDir, `${s.id}.png`);
    fs.writeFileSync(tabletIosHtmlPath, tabletIosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletIosPngPath}" --window-size=2048,2732 "${tabletIosHtmlPath}"`, { stdio: 'pipe' });
  }

  console.log('\n🎉 ALL STORE ASSETS PROPORTIONALLY BALANCED BETWEEN IOS AND ANDROID!');
}

runGenerator().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});

