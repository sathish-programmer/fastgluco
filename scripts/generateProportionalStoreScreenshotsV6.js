const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../app_store_screenshots');

// Target Directories for All Platforms
const iosDir = path.join(OUTPUT_DIR, 'ios'); // Default for iPhone with Dynamic Island (1179 x 2556)
const iosLargeDir = path.join(OUTPUT_DIR, 'ios_6.7_large'); // For iPhone 6.7" / 6.9" display (1290 x 2796)
const iosMediumScreensDir = path.join(OUTPUT_DIR, 'ios_medium_screens'); // 1179 x 2556
const androidDir = path.join(OUTPUT_DIR, 'android');
const featureGraphicDir = path.join(OUTPUT_DIR, 'feature_graphic');
const tabletIosDir = path.join(OUTPUT_DIR, 'tablet_ios');
const ipad13Dir = path.join(OUTPUT_DIR, 'ipad_13');
const tabletAndroidDir = path.join(OUTPUT_DIR, 'tablet_android');
const desktopDir = path.join(OUTPUT_DIR, 'desktop');

[iosDir, iosLargeDir, iosMediumScreensDir, androidDir, featureGraphicDir, tabletIosDir, ipad13Dir, tabletAndroidDir, desktopDir].forEach(d => {
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
// Android (1080x1920) is 1.0 baseline.
// iOS (1290x2796) is 2796/1920 = 1.456x taller -> 1.45 scale factor.
// Android Tablet (1600x2560) is 2560/1920 = 1.33x scale factor.
// iPad Pro (2048x2732) is 2732/1920 = 1.42x scale factor.
function getScale(platform) {
  if (platform === 'ios_large') return 1.45; // 1290x2796
  if (platform === 'ios') return 1.33; // 1179x2556 (iPhone with Dynamic Island medium display)
  if (platform === 'tablet_ios') return 1.42; // 2048x2732
  if (platform === 'tablet_android') return 1.33; // 1600x2560
  return 1.0; // Android baseline (1080x1920)
}

// ─── 6 PROPORTIONALLY SCALED FULL-DENSITY SCREENS ───
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
        <div style="width: 100%; height: 100%; background: #0F172A; display: flex; flex-direction: column; overflow: hidden;">
          <!-- Top: Camera Viewfinder with AR Detection Boxes -->
          <div style="height: 44%; position: relative; overflow: hidden; background: #0F172A; flex-shrink: 0;">
            <img src="${imgPlate}" style="width: 100%; height: 100%; object-fit: cover;" />
            <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 30%, transparent 65%, rgba(15,23,42,0.95) 100%);"></div>

            <!-- Top Camera Bar -->
            <div style="position: absolute; top: ${s(24)}px; left: ${s(28)}px; right: ${s(28)}px; display: flex; justify-content: space-between; align-items: center; z-index: 20;">
              <div style="width: ${s(52)}px; height: ${s(52)}px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(22)}px;">←</div>
              <div style="display: flex; align-items: center; gap: ${s(10)}px; background: rgba(0,0,0,0.6); backdrop-filter: blur(14px); padding: ${s(10)}px ${s(22)}px; border-radius: ${s(32)}px; border: 2px solid rgba(255,255,255,0.3);">
                <span style="font-size: ${s(20)}px;">📸</span>
                <span style="color: white; font-weight: 900; font-size: ${s(19)}px;">AI Food Vision • Autofocus Locked</span>
              </div>
              <div style="width: ${s(52)}px; height: ${s(52)}px; border-radius: 50%; background: rgba(0,0,0,0.5); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; color: #FBBF24; font-size: ${s(22)}px;">⚡</div>
            </div>

            <!-- AR Bounding Box with Food Badges -->
            <div style="position: absolute; top: 20%; left: 8%; width: 84%; height: 64%; border: 4px solid rgba(255,255,255,0.95); border-radius: ${s(32)}px; box-shadow: 0 0 0 2000px rgba(0,0,0,0.22), inset 0 0 40px rgba(16,185,129,0.4);">
              <div style="position: absolute; -top: ${s(18)}px; left: ${s(20)}px; background: white; color: #0F172A; font-size: ${s(17)}px; font-weight: 900; padding: ${s(8)}px ${s(18)}px; border-radius: ${s(14)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🥗</span> Quinoa & Greens
              </div>
              <div style="position: absolute; top: 32%; right: -${s(14)}px; background: white; color: #0F172A; font-size: ${s(17)}px; font-weight: 900; padding: ${s(8)}px ${s(18)}px; border-radius: ${s(14)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🥑</span> Hass Avocado
              </div>
              <div style="position: absolute; bottom: 24%; left: -${s(14)}px; background: white; color: #0F172A; font-size: ${s(17)}px; font-weight: 900; padding: ${s(8)}px ${s(18)}px; border-radius: ${s(14)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🍗</span> Lean Protein
              </div>
              <div style="position: absolute; -bottom: ${s(18)}px; right: ${s(24)}px; background: white; color: #0F172A; font-size: ${s(17)}px; font-weight: 900; padding: ${s(8)}px ${s(18)}px; border-radius: ${s(14)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: ${s(8)}px;">
                <span>🎃</span> Sprouted Seeds
              </div>
            </div>
          </div>

          <!-- Bottom: High-Density Content Panel (ZERO EMPTY SPACE) -->
          <div style="flex: 1; background: #FFFFFF; border-radius: ${s(40)}px ${s(40)}px 0 0; padding: ${s(28)}px ${s(32)}px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 -20px 50px rgba(0,0,0,0.25);">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: ${s(14)}px;">
                <div>
                  <span style="font-size: ${s(16)}px; font-weight: 800; color: #10B981; text-transform: uppercase; letter-spacing: 0.5px;">✨ 99% AI FOOD MATCH</span>
                  <div style="font-size: ${s(32)}px; font-weight: 900; color: #0F172A; margin-top: ${s(4)}px; line-height: 1.15;">Mediterranean Longevity Plate</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(38)}px; font-weight: 900; color: #0F172A; line-height: 1;">350 <span style="font-size: ${s(20)}px; color: #64748B;">kcal</span></div>
                  <div style="font-size: ${s(16)}px; color: #059669; font-weight: 800; margin-top: ${s(4)}px;">Cellular Score 9.4</div>
                </div>
              </div>

              <!-- 4 Macro Pills -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(10)}px; margin-bottom: ${s(16)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center;">
                  <div style="font-size: ${s(15)}px; color: #64748B; font-weight: 800;">🍗 Protein</div>
                  <div style="font-size: ${s(24)}px; font-weight: 900; color: #059669; margin-top: ${s(2)}px;">30g</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center;">
                  <div style="font-size: ${s(15)}px; color: #64748B; font-weight: 800;">💧 Fat</div>
                  <div style="font-size: ${s(24)}px; font-weight: 900; color: #D97706; margin-top: ${s(2)}px;">15g</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center;">
                  <div style="font-size: ${s(15)}px; color: #64748B; font-weight: 800;">🌾 Carbs</div>
                  <div style="font-size: ${s(24)}px; font-weight: 900; color: #2563EB; margin-top: ${s(2)}px;">40g</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center;">
                  <div style="font-size: ${s(15)}px; color: #64748B; font-weight: 800;">🥦 Fibre</div>
                  <div style="font-size: ${s(24)}px; font-weight: 900; color: #16A34A; margin-top: ${s(2)}px;">8g</div>
                </div>
              </div>

              <!-- 10-Sec AI Quick Logger Banner -->
              <div style="background: #EFF6FF; border: 2px solid #BFDBFE; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(16)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="font-size: ${s(24)}px;">⚡</span>
                  <div>
                    <div style="font-size: ${s(18)}px; font-weight: 900; color: #1E40AF;">10-Sec AI Quick Logger Active</div>
                    <div style="font-size: ${s(15)}px; color: #3B82F6; font-weight: 700;">Logged calories, 500ml hydration & glycemic buffer in 1 tap</div>
                  </div>
                </div>
                <span style="background: #2563EB; color: white; font-size: ${s(16)}px; font-weight: 800; padding: ${s(5)}px ${s(14)}px; border-radius: ${s(10)}px;">10s ✓</span>
              </div>

              <!-- Itemized Food Breakdown -->
              <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(20)}px; font-weight: 800; color: #334155;">🥗 Quinoa & Steamed Greens (Low GI)</span>
                  <span style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">180 kcal</span>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(20)}px; font-weight: 800; color: #334155;">🥑 Hass Avocado & Sprouted Pumpkin Seeds</span>
                  <span style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">120 kcal</span>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(20)}px; font-weight: 800; color: #334155;">🫒 Cold-Pressed EVOO (Polyphenols)</span>
                  <span style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">50 kcal</span>
                </div>
              </div>
            </div>

            <!-- Bottom Action Buttons -->
            <div style="display: flex; gap: ${s(12)}px; margin-top: ${s(16)}px;">
              <div style="flex: 1; background: #ECFDF5; border: 2px solid #A7F3D0; color: #059669; padding: ${s(18)}px; border-radius: ${s(18)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center;">
                ✨ Quick AI Fix
              </div>
              <div style="flex: 1.4; background: #059669; color: white; padding: ${s(18)}px; border-radius: ${s(18)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(5,150,105,0.35);">
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
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(30)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Sensor Top Card -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(8)}px;">
                <div style="display: flex; align-items: center; gap: ${s(8)}px;">
                  <span style="width: ${s(12)}px; height: ${s(12)}px; border-radius: 50%; background: #10B981; box-shadow: 0 0 16px #10B981;"></span>
                  <span style="font-size: ${s(18)}px; font-weight: 900; color: #059669; text-transform: uppercase;">Abbott Sensor Live • 24h Sync</span>
                </div>
                <span style="font-size: ${s(18)}px; font-weight: 800; color: #64748B;">Synced 2m ago</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: ${s(12)}px;">
                <div>
                  <div style="font-size: ${s(82)}px; font-weight: 900; color: #0F172A; line-height: 1;">108</div>
                  <div style="font-size: ${s(20)}px; color: #059669; font-weight: 800; margin-top: ${s(4)}px;">mg/dL • Optimal Target Range (→ Steady)</div>
                </div>
                <div style="text-align: right;">
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(22)}px; font-weight: 900; padding: ${s(8)}px ${s(18)}px; border-radius: ${s(14)}px;">96% In Target Band</span>
                </div>
              </div>

              <!-- Futuristic Glowing CGM SVG Graph -->
              <svg viewBox="0 0 600 160" style="width: 100%; height: ${s(190)}px; overflow: visible;">
                <defs>
                  <linearGradient id="cgmNeonV6" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.45"/>
                    <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="35" width="600" height="90" fill="#F0FDF4" rx="14"/>
                <line x1="0" y1="35" x2="600" y2="35" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
                <line x1="0" y1="125" x2="600" y2="125" stroke="#86EFAC" stroke-dasharray="6,6" stroke-width="2"/>
                
                <path d="M 0 100 C 60 90, 100 60, 160 42 C 220 28, 260 70, 330 82 C 400 95, 460 62, 530 52 L 600 56 L 600 160 L 0 160 Z" fill="url(#cgmNeonV6)"/>
                <path d="M 0 100 C 60 90, 100 60, 160 42 C 220 28, 260 70, 330 82 C 400 95, 460 62, 530 52 L 600 56" fill="none" stroke="#10B981" stroke-width="6" stroke-linecap="round"/>
                <circle cx="160" cy="42" r="10" fill="#10B981" stroke="white" stroke-width="4"/>
              </svg>

              <div style="display: flex; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #94A3B8; margin-top: ${s(6)}px;">
                <span>6 AM</span>
                <span style="color: #059669; font-weight: 900;">12 PM (Lunch +18 mg/dL)</span>
                <span>6 PM</span>
                <span>12 AM</span>
              </div>
            </div>

            <!-- Post-Meal Glycemic Response Card -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(14)}px;">
                <span style="font-size: ${s(32)}px;">🥑</span>
                <div>
                  <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A;">Post-Lunch Glycemic Response</div>
                  <div style="font-size: ${s(16)}px; color: #059669; font-weight: 700; margin-top: ${s(2)}px;">+18 mg/dL spike • Safe Postprandial Buffer</div>
                </div>
              </div>
              <span style="background: #ECFDF5; color: #059669; font-size: ${s(18)}px; font-weight: 900; padding: ${s(6)}px ${s(14)}px; border-radius: ${s(10)}px;">Optimal</span>
            </div>

            <!-- Autophagy Fasting Clock -->
            <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white; border-radius: ${s(22)}px; padding: ${s(20)}px ${s(24)}px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${s(16)}px; font-weight: 800; color: #34D399; text-transform: uppercase;">AUTOPHAGY CELLULAR REPAIR</div>
                <div style="font-size: ${s(30)}px; font-weight: 900; margin-top: ${s(3)}px;">⚡ 15h 24m Fasting Window</div>
                <div style="font-size: ${s(16)}px; color: #94A3B8; margin-top: ${s(3)}px;">Deep cellular recycling & mitophagy active</div>
              </div>
              <div style="width: ${s(56)}px; height: ${s(56)}px; border-radius: 50%; background: rgba(16,185,129,0.25); border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: ${s(28)}px;">🔥</div>
            </div>

            <!-- 4-Stat Telemetry Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s(12)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px;">
                <div style="font-size: ${s(16)}px; font-weight: 800; color: #64748B;">AVG GLUCOSE</div>
                <div style="font-size: ${s(28)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">98 mg/dL</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px;">
                <div style="font-size: ${s(16)}px; font-weight: 800; color: #64748B;">EST. HbA1c</div>
                <div style="font-size: ${s(28)}px; font-weight: 900; color: #059669; margin-top: ${s(2)}px;">5.1% Equivalent</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px;">
                <div style="font-size: ${s(16)}px; font-weight: 800; color: #64748B;">VARIABILITY (CV)</div>
                <div style="font-size: ${s(28)}px; font-weight: 900; color: #2563EB; margin-top: ${s(2)}px;">11.8% (Very Low)</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px;">
                <div style="font-size: ${s(16)}px; font-weight: 800; color: #64748B;">METABOLIC SCORE</div>
                <div style="font-size: ${s(28)}px; font-weight: 900; color: #10B981; margin-top: ${s(2)}px;">94 / 100 Safe</div>
              </div>
            </div>

            <!-- AI Glycemic Prediction Banner -->
            <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(18)}px; display: flex; align-items: center; gap: ${s(10)}px;">
              <span style="font-size: ${s(24)}px;">💡</span>
              <div style="font-size: ${s(17)}px; color: #065F46; font-weight: 700;">
                <strong>Mito AI Insight:</strong> Adding sprouted seeds buffered lunch insulin spike by <strong>42%</strong> vs yesterday.
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="background: #10B981; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(16,185,129,0.35); margin-top: ${s(12)}px;">
            Export Ambulatory Glucose Telemetry (AGP)
          </div>
        </div>
      `;
    }
  },

  // 3. MEET GIA & MIA — MULTI-SPECIALIST AI COUNSELORS (HEALTHIFYME STYLE CONVERSATIONAL UI)
  {
    id: '03_gia_mia_specialist_ai_counselors',
    headline: 'Meet Gia & Mia<br>Your 24/7 Specialist AIs',
    accentColor: '#8B5CF6',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.25) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.18) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(28)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Top Multi-AI Selector Tabs -->
            <div style="display: flex; background: #E2E8F0; padding: ${s(6)}px; border-radius: ${s(20)}px; gap: ${s(6)}px;">
              <div style="flex: 1; background: white; border-radius: ${s(14)}px; padding: ${s(12)}px; text-align: center; box-shadow: 0 4px 10px rgba(0,0,0,0.06);">
                <div style="font-size: ${s(20)}px; font-weight: 900; color: #7C3AED;">🧬 Gia (Genetic AI)</div>
              </div>
              <div style="flex: 1; border-radius: ${s(14)}px; padding: ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(20)}px; font-weight: 800; color: #64748B;">🌙 Mia (Mental & Sleep)</div>
              </div>
              <div style="flex: 1; border-radius: ${s(14)}px; padding: ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(20)}px; font-weight: 800; color: #64748B;">✨ Mito (Nutrition)</div>
              </div>
            </div>

            <!-- Healthify-Style User Question Chat Bubble -->
            <div style="align-self: flex-end; max-width: 86%; background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px ${s(24)}px ${s(6)}px ${s(24)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.04);">
              <div style="font-size: ${s(22)}px; font-weight: 800; color: #0F172A; line-height: 1.35;">
                "I'm struggling to meet my protein & fibre budgets with low glucose spikes. Help!"
              </div>
            </div>

            <!-- Gia Genetic AI Response Card with Recommendations -->
            <div style="background: white; border: 2.5px solid #DDD6FE; border-radius: ${s(26)}px; padding: ${s(22)}px ${s(24)}px; box-shadow: 0 8px 24px rgba(139,92,246,0.08);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <div style="width: ${s(40)}px; height: ${s(40)}px; border-radius: 50%; background: #EDE9FE; display: flex; align-items: center; justify-content: center; font-size: ${s(22)}px;">🧬</div>
                  <div>
                    <span style="font-size: ${s(21)}px; font-weight: 900; color: #6D28D9;">Gia • Genetic AI Counselor</span>
                    <span style="background: #F3E8FF; color: #7C3AED; font-size: ${s(14)}px; font-weight: 800; padding: 2px 8px; border-radius: 6px; margin-left: 6px;">NCCN v2.2025</span>
                  </div>
                </div>
                <span style="font-size: ${s(15)}px; font-weight: 800; color: #059669; background: #ECFDF5; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">Online</span>
              </div>

              <div style="font-size: ${s(20)}px; color: #334155; font-weight: 700; line-height: 1.45; margin-bottom: ${s(14)}px;">
                Based on your pedigree & glucose telemetry, add sprouted lentils, edamame and cold-pressed seeds for steady mitochondria energy. Here are 2 tailored recipes:
              </div>

              <!-- Dual High-Polyphenol Recipe Cards Side-by-Side (Healthify-Me Style) -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(12)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(20)}px; overflow: hidden; display: flex; flex-direction: column;">
                  <img src="${imgDish2}" style="height: ${s(140)}px; width: 100%; object-fit: cover;" />
                  <div style="padding: ${s(12)}px ${s(14)}px;">
                    <div style="font-size: ${s(20)}px; font-weight: 900; color: #0F172A;">Chickpea Curry</div>
                    <div style="font-size: ${s(16)}px; color: #059669; font-weight: 800; margin-top: ${s(2)}px;">22g Protein • Low GI</div>
                  </div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(20)}px; overflow: hidden; display: flex; flex-direction: column;">
                  <img src="${imgDish1}" style="height: ${s(140)}px; width: 100%; object-fit: cover;" />
                  <div style="padding: ${s(12)}px ${s(14)}px;">
                    <div style="font-size: ${s(20)}px; font-weight: 900; color: #0F172A;">Edamame Protein Bowl</div>
                    <div style="font-size: ${s(16)}px; color: #059669; font-weight: 800; margin-top: ${s(2)}px;">26g Protein • Fasting Safe</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Mia Mental Health & Sleep Companion Banner -->
            <div style="background: #F0FDF4; border: 2px solid #BBF7D0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                <span style="font-size: ${s(28)}px;">🌙</span>
                <div>
                  <div style="font-size: ${s(19)}px; font-weight: 900; color: #065F46;">Mia Sleep & Stress Intelligence</div>
                  <div style="font-size: ${s(16)}px; color: #047857; font-weight: 700;">HRV 68 ms (High Tone) • 1h 48m deep cellular sleep recorded</div>
                </div>
              </div>
              <span style="background: #059669; color: white; font-size: ${s(16)}px; font-weight: 900; padding: ${s(6)}px ${s(14)}px; border-radius: ${s(10)}px;">Active</span>
            </div>

            <!-- 10-Sec Quick Action Chips -->
            <div style="display: flex; gap: ${s(8)}px; flex-wrap: wrap;">
              <span style="background: white; border: 1.5px solid #DDD6FE; color: #7C3AED; font-size: ${s(17)}px; font-weight: 800; padding: ${s(8)}px ${s(16)}px; border-radius: ${s(14)}px;">🧬 Ask Gia Genetic Risk</span>
              <span style="background: white; border: 1.5px solid #BBF7D0; color: #059669; font-size: ${s(17)}px; font-weight: 800; padding: ${s(8)}px ${s(16)}px; border-radius: ${s(14)}px;">🌙 2-Min Vagal Breathing</span>
              <span style="background: white; border: 1.5px solid #BFDBFE; color: #2563EB; font-size: ${s(17)}px; font-weight: 800; padding: ${s(8)}px ${s(16)}px; border-radius: ${s(14)}px;">⚡ 10-Sec Habit Log</span>
            </div>
          </div>

          <!-- Bottom Chat Input Bar (Healthify-Me Style) -->
          <div style="background: white; border: 2px solid #CBD5E1; border-radius: ${s(24)}px; padding: ${s(18)}px ${s(24)}px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
            <div style="display: flex; align-items: center; gap: ${s(10)}px;">
              <span style="color: #7C3AED; font-size: ${s(26)}px; font-weight: 900;">|</span>
              <span style="font-size: ${s(22)}px; color: #94A3B8; font-weight: 700;">Ask Gia or Mia anything 24/7...</span>
            </div>
            <div style="display: flex; align-items: center; gap: ${s(16)}px; font-size: ${s(26)}px; color: #64748B;">
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
        <div style="width: 100%; height: 100%; background: #0F172A; position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(30)}px;">
          <!-- Glowing Cyber-Cellular Background -->
          <div style="position: absolute; inset: 0; background: radial-gradient(circle at 80% 10%, rgba(16,185,129,0.35) 0%, transparent 55%), radial-gradient(circle at 20% 90%, rgba(59,130,246,0.3) 0%, transparent 55%), #0F172A;"></div>

          <div style="position: relative; z-index: 10; display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Top Futuristic Biological Age Clock -->
            <div style="background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(24px); border: 2px solid rgba(255,255,255,0.22); border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px; color: white;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(8)}px;">
                <span style="font-size: ${s(18)}px; font-weight: 900; color: #34D399; text-transform: uppercase; letter-spacing: 0.6px;">🧬 CELLULAR LONGEVITY TELEMETRY</span>
                <span style="background: rgba(16,185,129,0.25); color: #6EE7B7; border: 1.5px solid #10B981; font-size: ${s(16)}px; font-weight: 800; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">Clinically Validated</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                <div>
                  <div style="font-size: ${s(76)}px; font-weight: 900; color: white; line-height: 1;">34.6 <span style="font-size: ${s(28)}px; color: #34D399;">Yrs Bio-Age</span></div>
                  <div style="font-size: ${s(20)}px; color: #94A3B8; font-weight: 700; margin-top: ${s(4)}px;">Chronological Age: 38.0 • <strong>-3.4 Years Reversed</strong></div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(38)}px; font-weight: 900; color: #60A5FA;">0.88x</div>
                  <div style="font-size: ${s(16)}px; color: #94A3B8;">Pace of Aging</div>
                </div>
              </div>
            </div>

            <!-- Epigenetic Bio-Age Trend Waveform -->
            <div style="background: rgba(255, 255, 255, 0.05); border: 1.5px solid rgba(255, 255, 255, 0.15); border-radius: ${s(22)}px; padding: ${s(16)}px ${s(22)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
                <span style="font-size: ${s(16)}px; font-weight: 800; color: #94A3B8;">12-MONTH EPIGENETIC TRAJECTORY</span>
                <span style="font-size: ${s(16)}px; font-weight: 900; color: #34D399;">-3.4 Yrs (DNAm PhenoAge)</span>
              </div>
              <svg viewBox="0 0 600 70" style="width: 100%; height: ${s(80)}px;">
                <path d="M 0 60 Q 150 50, 300 35 T 600 10" fill="none" stroke="#10B981" stroke-width="4"/>
                <circle cx="0" cy="60" r="5" fill="#64748B"/>
                <circle cx="300" cy="35" r="5" fill="#60A5FA"/>
                <circle cx="600" cy="10" r="7" fill="#34D399" stroke="white" stroke-width="3"/>
              </svg>
              <div style="display: flex; justify-content: space-between; font-size: ${s(14)}px; font-weight: 800; color: #64748B;">
                <span>Month 1 (38.0 Yrs)</span>
                <span>Month 6 (36.2 Yrs)</span>
                <span style="color: #34D399;">Current (34.6 Yrs)</span>
              </div>
            </div>

            <!-- 4 Stacked Verified Outcome Hologram Cards -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(12)}px;">
              <div style="background: white; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(50)}px; font-weight: 900; color: #0F172A; line-height: 1;">2.2 <span style="font-size: ${s(20)}px; color: #64748B;">lb</span></div>
                <div style="font-size: ${s(17)}px; color: #475569; font-weight: 800; margin-top: ${s(4)}px; line-height: 1.35;">
                  avg weight lost per week by members
                </div>
              </div>

              <div style="background: white; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(50)}px; font-weight: 900; color: #059669; line-height: 1;">80 <span style="font-size: ${s(20)}px; color: #059669;">%</span></div>
                <div style="font-size: ${s(17)}px; color: #475569; font-weight: 800; margin-top: ${s(4)}px; line-height: 1.35;">
                  sustained habit & dietary improvements
                </div>
              </div>

              <div style="background: white; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(50)}px; font-weight: 900; color: #2563EB; line-height: 1;">45 <span style="font-size: ${s(20)}px; color: #2563EB;">%</span></div>
                <div style="font-size: ${s(17)}px; color: #475569; font-weight: 800; margin-top: ${s(4)}px; line-height: 1.35;">
                  increase in daily VO2 max & activity
                </div>
              </div>

              <div style="background: white; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 14px 30px rgba(0,0,0,0.2);">
                <div style="font-size: ${s(50)}px; font-weight: 900; color: #7C3AED; line-height: 1;">94 <span style="font-size: ${s(20)}px; color: #7C3AED;">%</span></div>
                <div style="font-size: ${s(17)}px; color: #475569; font-weight: 800; margin-top: ${s(4)}px; line-height: 1.35;">
                  time in optimal autophagy repair band
                </div>
              </div>
            </div>

            <!-- Clinical Biomarker Improvement Grid -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${s(10)}px;">
              <div style="background: rgba(255,255,255,0.08); border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center; border: 1px solid rgba(255,255,255,0.15);">
                <div style="font-size: ${s(14)}px; color: #94A3B8; font-weight: 800;">hs-CRP</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #34D399; margin-top: 2px;">0.4 mg/L</div>
                <div style="font-size: ${s(12)}px; color: #6EE7B7;">↓ 65% Optimal</div>
              </div>
              <div style="background: rgba(255,255,255,0.08); border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center; border: 1px solid rgba(255,255,255,0.15);">
                <div style="font-size: ${s(14)}px; color: #94A3B8; font-weight: 800;">ApoB</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #60A5FA; margin-top: 2px;">78 mg/dL</div>
                <div style="font-size: ${s(12)}px; color: #93C5FD;">↓ 32% Cleared</div>
              </div>
              <div style="background: rgba(255,255,255,0.08); border-radius: ${s(16)}px; padding: ${s(12)}px; text-align: center; border: 1px solid rgba(255,255,255,0.15);">
                <div style="font-size: ${s(14)}px; color: #94A3B8; font-weight: 800;">Fasting Insulin</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #C084FC; margin-top: 2px;">4.8 uIU</div>
                <div style="font-size: ${s(12)}px; color: #E9D5FF;">Sensitized ✓</div>
              </div>
            </div>
          </div>

          <!-- Bottom Verified Patient Cohort Testimonial -->
          <div style="position: relative; z-index: 10; background: rgba(255,255,255,0.12); backdrop-filter: blur(20px); border-radius: ${s(22)}px; padding: ${s(20)}px ${s(24)}px; border: 1.5px solid rgba(255,255,255,0.25); color: white;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
              <span style="font-size: ${s(17)}px; font-weight: 900; color: #34D399; text-transform: uppercase;">Verified Member Outcome</span>
              <span style="color: #FBBF24; font-size: ${s(20)}px;">★★★★★</span>
            </div>
            <div style="font-size: ${s(20)}px; font-weight: 800; line-height: 1.4;">
              "My HbA1c reduced from 6.8% to 5.2% in 90 days. Mito_Reboot's multi-AI coaching gave me complete metabolic control."
            </div>
            <div style="font-size: ${s(16)}px; color: #94A3B8; margin-top: ${s(4)}px;">
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
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(30)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); border-radius: ${s(26)}px; padding: ${s(22)}px ${s(26)}px; color: white; box-shadow: 0 12px 30px rgba(37,99,235,0.28);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(4)}px;">
                <span style="font-size: ${s(17)}px; font-weight: 900; color: #93C5FD; text-transform: uppercase;">⚡ 10-SECOND RAPID AI LOGGING</span>
                <span style="background: rgba(255,255,255,0.2); font-size: ${s(15)}px; font-weight: 800; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">Voice & Vision</span>
              </div>
              <div style="font-size: ${s(26)}px; font-weight: 900; line-height: 1.3;">
                "Logged lunch, 500ml water, 20m walk & good mood"
              </div>
              <div style="font-size: ${s(17)}px; color: #DBEAFE; margin-top: ${s(4)}px;">
                AI parsed 4 habit categories automatically in 1.2 seconds
              </div>
            </div>

            <!-- 6-Grid Habits Display (ALL 12 HABITS COVERED) -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s(12)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">🥗 NUTRITION</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">Quinoa Bowl</div>
                </div>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">350 kcal ✓</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">💧 HYDRATION</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">2,250 ml</div>
                </div>
                <span style="background: #EFF6FF; color: #2563EB; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">75% Target</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">🏃 MOVEMENT</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">8,420 Steps</div>
                </div>
                <span style="background: #FAF5FF; color: #7C3AED; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">Zone 2 ✓</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">⚡ FASTING</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">15h 24m Active</div>
                </div>
                <span style="background: #FEF3C7; color: #D97706; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">Autophagy</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">🧘 VAGAL BREATH</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">Mia Breathwork</div>
                </div>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">10m Done</span>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">🌙 SLEEP REPAIR</div>
                  <div style="font-size: ${s(21)}px; font-weight: 900; color: #0F172A; margin-top: ${s(2)}px;">7h 45m Rest</div>
                </div>
                <span style="background: #EFF6FF; color: #2563EB; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(10)}px; border-radius: ${s(8)}px;">88% Quality</span>
              </div>
            </div>

            <!-- Cellular Defense Score Meter -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(22)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
                <span style="font-size: ${s(19)}px; font-weight: 900; color: #0F172A;">Daily Cellular Defense Index</span>
                <span style="font-size: ${s(21)}px; font-weight: 900; color: #059669;">91 / 100 (+4 pts today)</span>
              </div>
              <div style="width: 100%; height: ${s(12)}px; background: #E2E8F0; border-radius: ${s(6)}px; overflow: hidden;">
                <div style="width: 91%; height: 100%; background: linear-gradient(90deg, #10B981, #059669); border-radius: ${s(6)}px;"></div>
              </div>
            </div>

            <!-- Streak & Milestone Banner -->
            <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                <span style="font-size: ${s(24)}px;">🔥</span>
                <div>
                  <div style="font-size: ${s(17)}px; font-weight: 900; color: #92400E;">21-Day Consecutive Habit Streak</div>
                  <div style="font-size: ${s(14)}px; color: #B45309;">Metabolic flexibility improved by 28%</div>
                </div>
              </div>
              <span style="background: #F59E0B; color: white; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">Top 5%</span>
            </div>
          </div>

          <!-- Action Button -->
          <div style="background: #2563EB; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(37,99,235,0.35); margin-top: ${s(12)}px;">
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
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(30)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Doctor Video Call Profile Card (WITH HEAVILY BLURRED DOCTOR PRIVACY PROTECTION) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(28)}px; padding: ${s(22)}px ${s(26)}px; box-shadow: 0 12px 36px rgba(0,0,0,0.06);">
              <div style="display: flex; gap: ${s(16)}px; align-items: center; margin-bottom: ${s(14)}px;">
                <div style="width: ${s(88)}px; height: ${s(88)}px; border-radius: ${s(22)}px; overflow: hidden; border: 3px solid #0284C7; position: relative; flex-shrink: 0; background: #0F172A;">
                  <img src="${imgDoctor}" style="width: 100%; height: 100%; object-fit: cover; filter: blur(14px); transform: scale(1.25);" />
                  <div style="position: absolute; bottom: 2px; right: 2px; background: rgba(2,132,199,0.9); color: white; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 4px;">MD</div>
                </div>
                <div>
                  <div style="font-size: ${s(26)}px; font-weight: 900; color: #0F172A;">Clinical Oncology Specialist</div>
                  <div style="font-size: ${s(19)}px; color: #64748B; font-weight: 700; margin-top: ${s(2)}px;">Preventive Oncology • 12+ Yrs Experience</div>
                  <div style="font-size: ${s(18)}px; color: #059669; font-weight: 800; margin-top: ${s(3)}px;">★ 4.9 (340+ Verified Consultations)</div>
                </div>
              </div>

              <!-- Next Teleconsultation Banner -->
              <div style="background: #F0F9FF; border: 1.5px solid #BAE6FD; border-radius: ${s(16)}px; padding: ${s(16)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="font-size: ${s(15)}px; font-weight: 800; color: #0369A1; text-transform: uppercase;">Next Video Teleconsult</div>
                  <div style="font-size: ${s(20)}px; font-weight: 900; color: #0C4A6E; margin-top: ${s(2)}px;">Today at 4:30 PM (Waiting Room Open)</div>
                </div>
                <span style="background: #0284C7; color: white; font-size: ${s(16)}px; font-weight: 800; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">Ready</span>
              </div>
            </div>

            <!-- Comprehensive Clinical Deliverables (NO EMPTY SPACE!) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(20)}px ${s(24)}px;">
              <div style="font-size: ${s(19)}px; font-weight: 900; color: #0F172A; text-transform: uppercase; margin-bottom: ${s(12)}px;">Active Clinical Care Plan</div>
              
              <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                <!-- Item 1 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                    <span style="font-size: ${s(24)}px;">📄</span>
                    <div>
                      <div style="font-size: ${s(19)}px; font-weight: 800; color: #0F172A;">Medical Prescription PDF</div>
                      <div style="font-size: ${s(15)}px; color: #64748B;">Digitally signed & QR verified</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #0284C7;">Download ›</span>
                </div>

                <!-- Item 2 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                    <span style="font-size: ${s(24)}px;">🧪</span>
                    <div>
                      <div style="font-size: ${s(19)}px; font-weight: 800; color: #0F172A;">Biomarker Lab Audit</div>
                      <div style="font-size: ${s(15)}px; color: #059669; font-weight: 700;">HbA1c 5.1% • CEA 1.2 ng/mL (Optimal)</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #059669;">Verified ✓</span>
                </div>

                <!-- Item 3 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                    <span style="font-size: ${s(24)}px;">🧬</span>
                    <div>
                      <div style="font-size: ${s(19)}px; font-weight: 800; color: #0F172A;">Gia Genetic Pedigree Review</div>
                      <div style="font-size: ${s(15)}px; color: #7C3AED; font-weight: 700;">BRCA1/2 / Lynch Syndrome Cleared</div>
                    </div>
                  </div>
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #7C3AED;">Audited ✓</span>
                </div>
              </div>
            </div>

            <!-- Specialist Care Team Roster Card -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: ${s(15)}px; font-weight: 800; color: #64748B; text-transform: uppercase;">Multidisciplinary Cohort</div>
                <div style="font-size: ${s(18)}px; font-weight: 900; color: #0F172A; margin-top: 2px;">Oncologist + Longevity Nutritionist + AI Coaches</div>
              </div>
              <span style="background: #EFF6FF; color: #0284C7; font-size: ${s(15)}px; font-weight: 900; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(8)}px;">3 Specialists</span>
            </div>
          </div>

          <!-- Consultation Room CTA Button -->
          <div style="background: #0284C7; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(2,132,199,0.35); margin-top: ${s(12)}px;">
            Join Secure Video Consultation Room
          </div>
        </div>
      `;
    }
  },

  // 7. CELLULAR REPAIR VS DAMAGE FORCES
  {
    id: '07_cellular_repair_vs_damage',
    headline: 'Track Cellular Repair &<br>Neutralize Damage Forces',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.28) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(244, 63, 94, 0.22) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(28)}px ${s(30)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Top Hero Card: Net Cellular Forces Live Balance -->
            <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px; color: white; box-shadow: 0 14px 40px rgba(15,23,42,0.25); position: relative; overflow: hidden;">
              <div style="position: absolute; -right: ${s(30)}px; -bottom: ${s(30)}px; width: ${s(160)}px; height: ${s(160)}px; background: radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%); pointer-events: none;"></div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(8)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="width: ${s(12)}px; height: ${s(12)}px; border-radius: 50%; background: #10B981; box-shadow: 0 0 14px #10B981;"></span>
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #34D399; text-transform: uppercase; letter-spacing: 0.8px;">CELLULAR FORCE AUDIT • LIVE</span>
                </div>
                <span style="background: rgba(16,185,129,0.2); color: #6EE7B7; border: 1.5px solid #10B981; font-size: ${s(15)}px; font-weight: 800; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(10)}px;">High Anabolic Repair</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: ${s(16)}px;">
                <div>
                  <div style="font-size: ${s(76)}px; font-weight: 900; color: #10B981; line-height: 1;">+6 <span style="font-size: ${s(30)}px; color: white;">Net Repair</span></div>
                  <div style="font-size: ${s(18)}px; color: #94A3B8; font-weight: 700; margin-top: ${s(6)}px;">9 Repair Forces Active • 3 Stressors Neutralized</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(36)}px; font-weight: 900; color: #34D399;">75%</div>
                  <div style="font-size: ${s(15)}px; color: #94A3B8;">Repair Dominance</div>
                </div>
              </div>

              <!-- Dual Split Progress Bar -->
              <div style="width: 100%; height: ${s(15)}px; background: rgba(255,255,255,0.1); border-radius: ${s(8)}px; overflow: hidden; display: flex; gap: 3px;">
                <div style="width: 75%; height: 100%; background: linear-gradient(90deg, #10B981, #34D399); border-radius: ${s(6)}px 0 0 ${s(6)}px;"></div>
                <div style="width: 25%; height: 100%; background: linear-gradient(90deg, #F43F5E, #FB7185); border-radius: 0 ${s(6)}px ${s(6)}px 0;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: ${s(14)}px; font-weight: 800; margin-top: ${s(8)}px;">
                <span style="color: #34D399;">+9 Repair Stimuli (Autophagy, Diet, Sleep)</span>
                <span style="color: #FB7185;">-3 Damage Mitigated</span>
              </div>
            </div>

            <!-- Daily Check-ins Forces Timeline -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(12)}px;">
                <span style="font-size: ${s(17)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Today's Check-in Forces</span>
                <span style="font-size: ${s(15)}px; font-weight: 800; color: #64748B;">4 Logs Completed</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(10)}px;">
                <!-- Checkin 1 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(8)}px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                  <span style="font-size: ${s(13)}px; font-weight: 800; color: #64748B;">7:30 AM</span>
                  <span style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A; margin: ${s(3)}px 0 ${s(8)}px;">Fasting</span>
                  <div style="height: ${s(115)}px; width: ${s(34)}px; background: #E2E8F0; border-radius: ${s(12)}px; display: flex; align-items: flex-end; overflow: hidden; padding: 2px;">
                    <div style="height: 80%; width: 100%; background: linear-gradient(180deg, #34D399, #10B981); border-radius: ${s(10)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(15)}px; font-weight: 900;">+4</div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px; margin-top: ${s(8)}px;">+4 Net</span>
                </div>

                <!-- Checkin 2 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(8)}px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                  <span style="font-size: ${s(13)}px; font-weight: 800; color: #64748B;">1:15 PM</span>
                  <span style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A; margin: ${s(3)}px 0 ${s(8)}px;">Lunch</span>
                  <div style="height: ${s(115)}px; width: ${s(40)}px; background: #E2E8F0; border-radius: ${s(12)}px; display: flex; align-items: flex-end; gap: 2px; overflow: hidden; padding: 2px;">
                    <div style="height: 60%; width: 50%; background: linear-gradient(180deg, #34D399, #10B981); border-radius: ${s(8)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(13)}px; font-weight: 900;">+3</div>
                    <div style="height: 40%; width: 50%; background: linear-gradient(180deg, #FB7185, #F43F5E); border-radius: ${s(8)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(13)}px; font-weight: 900;">-2</div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px; margin-top: ${s(8)}px;">+1 Net</span>
                </div>

                <!-- Checkin 3 -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(8)}px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                  <span style="font-size: ${s(13)}px; font-weight: 800; color: #64748B;">6:00 PM</span>
                  <span style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A; margin: ${s(3)}px 0 ${s(8)}px;">Move</span>
                  <div style="height: ${s(115)}px; width: ${s(40)}px; background: #E2E8F0; border-radius: ${s(12)}px; display: flex; align-items: flex-end; gap: 2px; overflow: hidden; padding: 2px;">
                    <div style="height: 85%; width: 60%; background: linear-gradient(180deg, #34D399, #10B981); border-radius: ${s(8)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(13)}px; font-weight: 900;">+5</div>
                    <div style="height: 25%; width: 40%; background: linear-gradient(180deg, #FB7185, #F43F5E); border-radius: ${s(8)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(13)}px; font-weight: 900;">-1</div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px; margin-top: ${s(8)}px;">+4 Net</span>
                </div>

                <!-- Checkin 4 (Active Selected) -->
                <div style="background: #ECFDF5; border: 2.5px solid #10B981; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(8)}px; display: flex; flex-direction: column; align-items: center; text-align: center; box-shadow: 0 6px 18px rgba(16,185,129,0.18);">
                  <span style="font-size: ${s(13)}px; font-weight: 800; color: #059669;">10:00 PM</span>
                  <span style="font-size: ${s(16)}px; font-weight: 900; color: #065F46; margin: ${s(3)}px 0 ${s(8)}px;">Autophagy</span>
                  <div style="height: ${s(115)}px; width: ${s(34)}px; background: #D1FAE5; border-radius: ${s(12)}px; display: flex; align-items: flex-end; overflow: hidden; padding: 2px;">
                    <div style="height: 100%; width: 100%; background: linear-gradient(180deg, #34D399, #059669); border-radius: ${s(10)}px; display: flex; align-items: center; justify-content: center; color: white; font-size: ${s(15)}px; font-weight: 900;">+6</div>
                  </div>
                  <span style="background: #10B981; color: white; font-size: ${s(12)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px; margin-top: ${s(8)}px;">+6 Net ✓</span>
                </div>
              </div>
            </div>

            <!-- Dual Forces Breakdown Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(12)}px;">
              <!-- Left: Repair Forces -->
              <div style="background: white; border: 2px solid #A7F3D0; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(20)}px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${s(12)}px;">
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #065F46;">🌱 REPAIR FORCES</span>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(15)}px; font-weight: 900; padding: 3px 9px; border-radius: 6px;">+9 Total</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>⚡ 16h Mitophagy Fast</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Autophagosomes active</div>
                    </div>
                    <span style="color: #059669; font-size: ${s(18)}px; font-weight: 900;">+2</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>🥗 Polyphenol Plate</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Berries, amla, greens</div>
                    </div>
                    <span style="color: #059669; font-size: ${s(18)}px; font-weight: 900;">+2</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>🧘 Vagal Breathwork</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">High parasympathetic tone</div>
                    </div>
                    <span style="color: #059669; font-size: ${s(18)}px; font-weight: 900;">+2</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>🌙 1h 48m Deep Sleep</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Glymphatic brain flush</div>
                    </div>
                    <span style="color: #059669; font-size: ${s(18)}px; font-weight: 900;">+3</span>
                  </div>
                </div>
              </div>

              <!-- Right: Damage Forces Mitigated -->
              <div style="background: white; border: 2px solid #FECDD3; border-radius: ${s(22)}px; padding: ${s(18)}px ${s(20)}px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: ${s(12)}px;">
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #9F1239;">🛡️ STRESS SHIELD</span>
                  <span style="background: #FFF1F2; color: #E11D48; font-size: ${s(15)}px; font-weight: 900; padding: 3px 9px; border-radius: 6px;">-3 Managed</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: ${s(10)}px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>📈 Glucose Surge</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Buffered via sprouted fiber</div>
                    </div>
                    <span style="color: #E11D48; font-size: ${s(16)}px; font-weight: 900;">Shielded ✓</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>☕ Work Cortisol</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Cooled via 2m breathing</div>
                    </div>
                    <span style="color: #E11D48; font-size: ${s(16)}px; font-weight: 900;">Cooled ✓</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>🚗 PM2.5 Exposure</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Antioxidant defense active</div>
                    </div>
                    <span style="color: #E11D48; font-size: ${s(16)}px; font-weight: 900;">Defended ✓</span>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between; font-size: ${s(16)}px; font-weight: 800; color: #334155;">
                    <div>
                      <div>🍷 Zero Alcohol</div>
                      <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 600;">Zero DNA adduct damage</div>
                    </div>
                    <span style="color: #059669; font-size: ${s(16)}px; font-weight: 900;">Pure ✓</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4-Card Organ Protection & Biomarker Telemetry Grid -->
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: ${s(12)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(14)}px ${s(18)}px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(14)}px; font-weight: 800; color: #64748B;">🫀 CARDIO SHIELD</span>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(13)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">Optimal</span>
                </div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">94% Defended</div>
                <div style="font-size: ${s(13)}px; color: #059669; font-weight: 700; margin-top: 2px;">hs-CRP 0.4 mg/L • Elastic</div>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(14)}px ${s(18)}px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(14)}px; font-weight: 800; color: #64748B;">🧠 NEURAL DEFENSE</span>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(13)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">Peak</span>
                </div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">96% Protected</div>
                <div style="font-size: ${s(13)}px; color: #2563EB; font-weight: 700; margin-top: 2px;">BDNF High • Glymphatic Cleared</div>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(14)}px ${s(18)}px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(14)}px; font-weight: 800; color: #64748B;">⚡ MITOCHONDRIA</span>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(13)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">Active</span>
                </div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">98% Rejuvenated</div>
                <div style="font-size: ${s(13)}px; color: #D97706; font-weight: 700; margin-top: 2px;">Mitophagy Peak (+6 Forces)</div>
              </div>

              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(20)}px; padding: ${s(14)}px ${s(18)}px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: ${s(14)}px; font-weight: 800; color: #64748B;">🧬 DNA INTEGRITY</span>
                  <span style="background: #ECFDF5; color: #059669; font-size: ${s(13)}px; font-weight: 900; padding: 2px 6px; border-radius: 6px;">Safe</span>
                </div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #0F172A; margin-top: ${s(3)}px;">92% Guarded</div>
                <div style="font-size: ${s(13)}px; color: #7C3AED; font-weight: 700; margin-top: 2px;">Zero Double-Strand Breaks</div>
              </div>
            </div>

            <!-- 7-Day Cellular Repair Waveform Trend -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(6)}px;">
                <span style="font-size: ${s(15)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">7-Day Net Cellular Repair Trajectory</span>
                <span style="font-size: ${s(14)}px; font-weight: 800; color: #059669;">+31 Net Points This Week</span>
              </div>
              <svg viewBox="0 0 500 80" style="width: 100%; height: ${s(95)}px;">
                <defs>
                  <linearGradient id="repairWaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10B981" stop-opacity="0.38"/>
                    <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                  </linearGradient>
                </defs>
                <path d="M 0 55 Q 80 44, 160 34 T 320 24 T 500 12 L 500 80 L 0 80 Z" fill="url(#repairWaveGrad)"/>
                <path d="M 0 55 Q 80 44, 160 34 T 320 24 T 500 12" fill="none" stroke="#10B981" stroke-width="4.5" stroke-linecap="round"/>
                <circle cx="0" cy="55" r="4.5" fill="#10B981"/>
                <circle cx="160" cy="34" r="4.5" fill="#10B981"/>
                <circle cx="320" cy="24" r="4.5" fill="#10B981"/>
                <circle cx="500" cy="12" r="7" fill="#059669" stroke="white" stroke-width="3"/>
              </svg>
              <div style="display: flex; justify-content: space-between; font-size: ${s(13)}px; font-weight: 800; color: #94A3B8;">
                <span>Mon (+3)</span>
                <span>Wed (+5)</span>
                <span>Fri (+6)</span>
                <span style="color: #059669; font-weight: 900;">Today (+6 Peak)</span>
              </div>
            </div>

            <!-- AI Clinical Guidance Banner -->
            <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(18)}px; display: flex; align-items: center; gap: ${s(12)}px;">
              <span style="font-size: ${s(26)}px;">💡</span>
              <div style="font-size: ${s(15)}px; color: #1E40AF; font-weight: 700; line-height: 1.35;">
                <strong>Mito AI Clinical Insight:</strong> Autophagy window + low glycemic lunch shifted your body into high repair (+6). Mitochondria are in peak rejuvenation.
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="background: #10B981; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(16,185,129,0.35); margin-top: ${s(12)}px;">
            ⚡ View Full Cellular Repair & Forces Audit
          </div>
        </div>
      `;
    }
  },

  // 8. DECADE LONGEVITY PROTOCOL & TARGETED ORGAN DEFENSE
  {
    id: '08_decade_longevity_organ_defense',
    headline: 'Decade Longevity Protocol<br>& Targeted Organ Defense',
    accentColor: '#4F46E5',
    bgGlow: 'radial-gradient(circle at 80% 15%, rgba(79, 70, 229, 0.28) 0%, transparent 60%), radial-gradient(circle at 20% 85%, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(28)}px ${s(30)}px; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(14)}px;">
            <!-- Hero Longevity Protocol Header Card (Matches AgeingModule.tsx exactly) -->
            <div style="background: linear-gradient(135deg, #1D4ED8 0%, #4F46E5 50%, #7C3AED 100%); border-radius: ${s(28)}px; padding: ${s(24)}px ${s(28)}px; color: white; box-shadow: 0 14px 40px rgba(79,70,229,0.3); position: relative; overflow: hidden;">
              <div style="position: absolute; -right: ${s(20)}px; -top: ${s(20)}px; width: ${s(130)}px; height: ${s(130)}px; background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%); pointer-events: none;"></div>

              <div style="display: flex; align-items: center; gap: ${s(10)}px; margin-bottom: ${s(6)}px;">
                <span style="font-size: ${s(22)}px;">✨</span>
                <span style="font-size: ${s(17)}px; font-weight: 900; color: #DBEAFE; text-transform: uppercase; letter-spacing: 0.8px;">LONGEVITY PROTOCOL</span>
              </div>

              <div style="font-size: ${s(34)}px; font-weight: 900; line-height: 1.15; color: white;">
                Healthy Ageing & Longevity
              </div>
              <div style="font-size: ${s(17)}px; color: #E0E7FF; font-weight: 700; margin-top: ${s(4)}px; line-height: 1.35;">
                Decade-specific organ defense and foundational cellular longevity habits.
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: ${s(16)}px; padding-top: ${s(14)}px; border-top: 1.5px solid rgba(255,255,255,0.25);">
                <div>
                  <span style="font-size: ${s(18)}px; font-weight: 800; color: #DBEAFE;">Overall Longevity Score:</span>
                  <div style="font-size: ${s(14)}px; color: #C7D2FE; font-weight: 600; margin-top: 2px;">Mitochondrial vitality & NAD+ primed</div>
                </div>
                <span style="background: rgba(255,255,255,0.22); backdrop-filter: blur(10px); border: 1.5px solid rgba(255,255,255,0.4); color: white; font-size: ${s(26)}px; font-weight: 900; padding: ${s(6)}px ${s(18)}px; border-radius: ${s(14)}px;">88% Optimal</span>
              </div>
            </div>

            <!-- Decade Selector Tabs (30-40, 40-50 Active, 50-60, 60-70) -->
            <div>
              <span style="font-size: ${s(15)}px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: ${s(8)}px;">
                SELECT YOUR DECADE:
              </span>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(10)}px;">
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(13)}px 0; text-align: center; font-size: ${s(19)}px; font-weight: 900; color: #475569;">
                  30-40
                </div>
                <div style="background: #2563EB; border: 2px solid #1D4ED8; border-radius: ${s(16)}px; padding: ${s(13)}px 0; text-align: center; font-size: ${s(19)}px; font-weight: 900; color: white; box-shadow: 0 8px 20px rgba(37,99,235,0.35); transform: translateY(-1px);">
                  40-50 ✓
                </div>
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(13)}px 0; text-align: center; font-size: ${s(19)}px; font-weight: 900; color: #475569;">
                  50-60
                </div>
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(13)}px 0; text-align: center; font-size: ${s(19)}px; font-weight: 900; color: #475569;">
                  60-70
                </div>
              </div>
            </div>

            <!-- Targeted 40-50 Decade Organ Defense Factors (All 4 vital organs) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(18)}px ${s(22)}px; box-shadow: 0 8px 24px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(12)}px;">
                <span style="font-size: ${s(17)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">40-50 Decade Organ Defense</span>
                <span style="background: #EEF2FF; color: #4F46E5; font-size: ${s(15)}px; font-weight: 900; padding: 3px 9px; border-radius: 6px;">Targeted Protocols</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(10)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(16)}px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: ${s(24)}px;">🧠</span>
                    <span style="background: #ECFDF5; color: #059669; font-size: ${s(14)}px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">94% Shielded</span>
                  </div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #0F172A; margin-top: ${s(6)}px;">Neuro & Cognition</div>
                  <div style="font-size: ${s(14)}px; color: #64748B; font-weight: 700; margin-top: 2px;">BDNF Stimulation • Deep Flush</div>
                </div>

                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(16)}px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: ${s(24)}px;">🫀</span>
                    <span style="background: #EFF6FF; color: #2563EB; font-size: ${s(14)}px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">90% Elastic</span>
                  </div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #0F172A; margin-top: ${s(6)}px;">Cardio & Endothelium</div>
                  <div style="font-size: ${s(14)}px; color: #64748B; font-weight: 700; margin-top: 2px;">Arterial Compliance • ApoB Defended</div>
                </div>

                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(16)}px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: ${s(24)}px;">⚡</span>
                    <span style="background: #FEF3C7; color: #D97706; font-size: ${s(14)}px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">92% Vital</span>
                  </div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #0F172A; margin-top: ${s(6)}px;">Mitochondrial Peak</div>
                  <div style="font-size: ${s(14)}px; color: #64748B; font-weight: 700; margin-top: 2px;">NAD+ Vitality Buffer Active</div>
                </div>

                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(16)}px;">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: ${s(24)}px;">🧬</span>
                    <span style="background: #FAF5FF; color: #7C3AED; font-size: ${s(14)}px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">88% Guarded</span>
                  </div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #0F172A; margin-top: ${s(6)}px;">DNA Telomere Guard</div>
                  <div style="font-size: ${s(14)}px; color: #64748B; font-weight: 700; margin-top: 2px;">Sirtuin Epigenetic Activation</div>
                </div>
              </div>
            </div>

            <!-- Foundational Longevity Habits Checked List (6 Core Habits) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(24)}px; padding: ${s(18)}px ${s(22)}px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <div style="display: flex; align-items: center; gap: ${s(8)}px;">
                  <span style="font-size: ${s(18)}px;">✨</span>
                  <span style="font-size: ${s(17)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Foundational Longevity Habits</span>
                </div>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(15)}px; font-weight: 900; padding: 3px 9px; border-radius: 6px;">100% Completed</span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: ${s(9)}px;">
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">🏃 Zone 2 Cardio & Strength</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">45 mins completed</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">🌙 8h Restorative Sleep</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">1h 48m deep wave</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">🥗 30+ Plant Polyphenols</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">Longevity micronutrients</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">⚡ 15h Autophagy Fast</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">Mitophagy activated</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">💧 Electrolyte Hydration</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">2,250 ml mineral rich</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(12)}px ${s(14)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <div style="font-size: ${s(15)}px; font-weight: 900; color: #065F46;">🧘 Vagal Parasympathetic</div>
                    <div style="font-size: ${s(12)}px; color: #047857; margin-top: 1px;">10 mins breathing done</div>
                  </div>
                  <span style="background: #059669; color: white; width: ${s(22)}px; height: ${s(22)}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${s(13)}px; font-weight: 900;">✓</span>
                </div>
              </div>
            </div>

            <!-- Clinical Healthspan Milestone Banner -->
            <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                <span style="font-size: ${s(24)}px;">🏆</span>
                <div>
                  <div style="font-size: ${s(16)}px; font-weight: 900; color: #065F46;">40-50 Decade Clinical Trajectory: Excellent</div>
                  <div style="font-size: ${s(13)}px; color: #047857; font-weight: 700;">On track to sustain 0.84x pace of biological aging for decade defense.</div>
                </div>
              </div>
              <span style="background: #059669; color: white; font-size: ${s(14)}px; font-weight: 900; padding: 4px 10px; border-radius: 8px;">Top 3%</span>
            </div>

            <!-- Healthspan Telemetry Row -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${s(10)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">PACE OF AGING</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #2563EB; margin-top: 3px;">0.84x (Slow)</div>
                <div style="font-size: ${s(12)}px; color: #059669; font-weight: 700; margin-top: 2px;">-3.4 Yrs Delta</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">NAD+ STATUS</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #059669; margin-top: 3px;">92 / 100</div>
                <div style="font-size: ${s(12)}px; color: #059669; font-weight: 700; margin-top: 2px;">Vital Pool High</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">TELOMERES</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #7C3AED; margin-top: 3px;">Protected ✓</div>
                <div style="font-size: ${s(12)}px; color: #7C3AED; font-weight: 700; margin-top: 2px;">Sirtuin Guarded</div>
              </div>
            </div>

            <!-- AI Robot Quick-Log Helper Badge (Matches user screenshot 7) -->
            <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                <span style="font-size: ${s(24)}px;">🤖</span>
                <span style="font-size: ${s(15)}px; font-weight: 800; color: #1E40AF;">Too tired to log? Let the robo do with AI Voice & Vision</span>
              </div>
              <span style="background: #2563EB; color: white; font-size: ${s(13)}px; font-weight: 800; padding: 4px 12px; border-radius: 8px;">1-Tap ✓</span>
            </div>
          </div>

          <!-- Bottom Action Button -->
          <div style="background: #059669; color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(5,150,105,0.35); margin-top: ${s(12)}px;">
            ✓ Update Today's Longevity Entry (Saved 11:05)
          </div>
        </div>
      `;
    }
  },

  // 9. PRECISION CANCER SCREENING & AIR QUALITY DEFENSE
  {
    id: '09_cancer_screening_air_quality',
    headline: 'Early Cancer Screening &<br>Live Air Quality Defense',
    accentColor: '#0284C7',
    bgGlow: 'radial-gradient(circle at 85% 15%, rgba(2, 132, 199, 0.28) 0%, transparent 60%), radial-gradient(circle at 15% 85%, rgba(16, 185, 129, 0.22) 0%, transparent 60%)',
    renderScreen: (scale) => {
      const s = (val) => Math.round(val * scale);
      return `
        <div style="width: 100%; height: 100%; background: #F8FAFC; display: flex; flex-direction: column; justify-content: space-between; padding: ${s(24)}px ${s(26)}px; box-sizing: border-box; overflow: hidden;">
          <div style="display: flex; flex-direction: column; gap: ${s(12)}px;">
            <!-- Top Hero Card: Preventive Oncology & Air Shield Live -->
            <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: ${s(26)}px; padding: ${s(22)}px ${s(26)}px; color: white; box-shadow: 0 14px 40px rgba(15,23,42,0.25); position: relative; overflow: hidden;">
              <div style="position: absolute; -right: ${s(30)}px; -bottom: ${s(30)}px; width: ${s(160)}px; height: ${s(160)}px; background: radial-gradient(circle, rgba(2,132,199,0.3) 0%, transparent 70%); pointer-events: none;"></div>

              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(8)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="width: ${s(12)}px; height: ${s(12)}px; border-radius: 50%; background: #38BDF8; box-shadow: 0 0 14px #38BDF8;"></span>
                  <span style="font-size: ${s(16)}px; font-weight: 900; color: #38BDF8; text-transform: uppercase; letter-spacing: 0.8px;">PREVENTIVE ONCOLOGY & AIR SHIELD</span>
                </div>
                <span style="background: rgba(2,132,199,0.2); color: #7DD3FC; border: 1.5px solid #0284C7; font-size: ${s(14)}px; font-weight: 800; padding: ${s(4)}px ${s(12)}px; border-radius: ${s(10)}px;">100% Adherence</span>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: ${s(14)}px;">
                <div>
                  <div style="font-size: ${s(64)}px; font-weight: 900; color: #38BDF8; line-height: 1;">All Clear <span style="font-size: ${s(26)}px; color: white;">• Guarded</span></div>
                  <div style="font-size: ${s(16)}px; color: #94A3B8; font-weight: 700; margin-top: ${s(5)}px;">NCCN v2.2025 Protocols Active • Carcinogen Shield Engaged</div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: ${s(36)}px; font-weight: 900; color: #34D399;">4 of 4</div>
                  <div style="font-size: ${s(14)}px; color: #94A3B8;">Screenings Verified</div>
                </div>
              </div>

              <!-- Dual Split Progress Bar -->
              <div style="width: 100%; height: ${s(14)}px; background: rgba(255,255,255,0.1); border-radius: ${s(7)}px; overflow: hidden; display: flex; gap: 3px;">
                <div style="width: 100%; height: 100%; background: linear-gradient(90deg, #0284C7, #38BDF8, #34D399); border-radius: ${s(6)}px;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: ${s(14)}px; font-weight: 800; margin-top: ${s(8)}px;">
                <span style="color: #7DD3FC;">Early Detection: 100% Up to Date</span>
                <span style="color: #34D399;">Live Air Quality: Safe (AQI 42)</span>
              </div>
            </div>

            <!-- Personalized Risk Cohort Selector (Matches real app CancerScreeningScreen.tsx) -->
            <div>
              <div style="font-size: ${s(14)}px; font-weight: 900; color: #64748B; letter-spacing: 0.8px; margin-bottom: ${s(8)}px; text-transform: uppercase;">
                SELECT RISK COHORT & AGE GROUP:
              </div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(8)}px;">
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center; font-size: ${s(14)}px; font-weight: 800; color: #64748B;">
                  Age 20-40
                </div>
                <div style="background: #0284C7; color: white; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center; font-size: ${s(14)}px; font-weight: 900; box-shadow: 0 4px 14px rgba(2,132,199,0.35);">
                  Age 40-50 ✓
                </div>
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center; font-size: ${s(14)}px; font-weight: 800; color: #64748B;">
                  High AQI / Smoke
                </div>
                <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center; font-size: ${s(14)}px; font-weight: 800; color: #64748B;">
                  Age 50+
                </div>
              </div>
            </div>

            <!-- Live GPS Air Quality Telemetry Card (Derived from LiveAQIWidget.tsx) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(12)}px;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="font-size: ${s(22)}px;">📍</span>
                  <div>
                    <div style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A;">LIVE GPS AIR TELEMETRY</div>
                    <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 700;">Bangalore Urban (12.97° N) • CPCB / US AQI</div>
                  </div>
                </div>
                <div style="background: #ECFDF5; border: 1.5px solid #10B981; border-radius: ${s(12)}px; padding: ${s(6)}px ${s(14)}px; text-align: right;">
                  <div style="font-size: ${s(20)}px; font-weight: 900; color: #059669; line-height: 1;">42 AQI</div>
                  <div style="font-size: ${s(12)}px; font-weight: 800; color: #047857;">Good Air Quality</div>
                </div>
              </div>

              <!-- 4 Pollutant Telemetry Pills -->
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: ${s(8)}px; margin-bottom: ${s(12)}px;">
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center;">
                  <div style="font-size: ${s(11)}px; font-weight: 800; color: #64748B;">PM2.5</div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #059669; margin: 2px 0;">12 <span style="font-size: ${s(11)}px; color: #64748B;">µg/m³</span></div>
                  <div style="font-size: ${s(10)}px; font-weight: 800; color: #059669; background: #ECFDF5; border-radius: 4px; padding: 2px 4px;">WHO Std ✓</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center;">
                  <div style="font-size: ${s(11)}px; font-weight: 800; color: #64748B;">PM10</div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #059669; margin: 2px 0;">28 <span style="font-size: ${s(11)}px; color: #64748B;">µg/m³</span></div>
                  <div style="font-size: ${s(10)}px; font-weight: 800; color: #059669; background: #ECFDF5; border-radius: 4px; padding: 2px 4px;">Lung Safe ✓</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center;">
                  <div style="font-size: ${s(11)}px; font-weight: 800; color: #64748B;">NO2</div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #0284C7; margin: 2px 0;">16 <span style="font-size: ${s(11)}px; color: #64748B;">ppb</span></div>
                  <div style="font-size: ${s(10)}px; font-weight: 800; color: #0284C7; background: #EFF6FF; border-radius: 4px; padding: 2px 4px;">Low Toxic</div>
                </div>
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(6)}px; text-align: center;">
                  <div style="font-size: ${s(11)}px; font-weight: 800; color: #64748B;">VOC / O3</div>
                  <div style="font-size: ${s(18)}px; font-weight: 900; color: #059669; margin: 2px 0;">0.02 <span style="font-size: ${s(11)}px; color: #64748B;">ppm</span></div>
                  <div style="font-size: ${s(10)}px; font-weight: 800; color: #059669; background: #ECFDF5; border-radius: 4px; padding: 2px 4px;">Minimal ✓</div>
                </div>
              </div>

              <!-- 24-Hour Diurnal Sparkline -->
              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(16)}px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                  <span style="font-size: ${s(18)}px;">📈</span>
                  <div>
                    <div style="font-size: ${s(14)}px; font-weight: 900; color: #065F46;">24h Diurnal Air Quality Curve</div>
                    <div style="font-size: ${s(12)}px; color: #047857; font-weight: 700;">Safe outdoor exercise window: 6:00 AM – 11:00 AM</div>
                  </div>
                </div>
                <span style="background: #059669; color: white; font-size: ${s(13)}px; font-weight: 900; padding: 3px 10px; border-radius: 6px;">Optimal</span>
              </div>
            </div>

            <!-- Active Early Cancer Screening Protocols (4 clinical tests) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(12)}px;">
                <span style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">EARLY CANCER SCREENING ROADMAP (NCCN v2.2025)</span>
                <span style="background: #ECFDF5; color: #059669; font-size: ${s(14)}px; font-weight: 900; padding: 3px 10px; border-radius: 6px;">4 Cleared ✓</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: ${s(9)}px;">
                <!-- Test 1: Lung LDCT -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(11)}px ${s(16)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(22)}px;">🫁</span>
                    <div>
                      <div style="font-size: ${s(15)}px; font-weight: 900; color: #0F172A;">Low-Dose CT (LDCT) Lung Screen</div>
                      <div style="font-size: ${s(12)}px; color: #64748B; font-weight: 700;">Urban AQI & smoke exposure safeguard • Baseline scan clear</div>
                    </div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; border: 1.5px solid #10B981; font-size: ${s(13)}px; font-weight: 900; padding: ${s(3)}px ${s(9)}px; border-radius: 6px;">Cleared ✓</span>
                </div>

                <!-- Test 2: Mammogram -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(11)}px ${s(16)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(22)}px;">🩺</span>
                    <div>
                      <div style="font-size: ${s(15)}px; font-weight: 900; color: #0F172A;">Digital Mammogram & Breast Ultrasound</div>
                      <div style="font-size: ${s(12)}px; color: #64748B; font-weight: 700;">NCCN Preventive Guideline • High-resolution imaging clear</div>
                    </div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; border: 1.5px solid #10B981; font-size: ${s(13)}px; font-weight: 900; padding: ${s(3)}px ${s(9)}px; border-radius: 6px;">Documented ✓</span>
                </div>

                <!-- Test 3: Cervical HPV -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(11)}px ${s(16)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(22)}px;">🔬</span>
                    <div>
                      <div style="font-size: ${s(15)}px; font-weight: 900; color: #0F172A;">Pap Smear & HPV Co-Testing</div>
                      <div style="font-size: ${s(12)}px; color: #64748B; font-weight: 700;">3-Year preventive oncology cycle • Lab verified negative</div>
                    </div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; border: 1.5px solid #10B981; font-size: ${s(13)}px; font-weight: 900; padding: ${s(3)}px ${s(9)}px; border-radius: 6px;">Negative ✓</span>
                </div>

                <!-- Test 4: Genetics & Biomarkers -->
                <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: ${s(16)}px; padding: ${s(11)}px ${s(16)}px; display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: ${s(12)}px;">
                    <span style="font-size: ${s(22)}px;">🩸</span>
                    <div>
                      <div style="font-size: ${s(15)}px; font-weight: 900; color: #0F172A;">Genetic Pedigree & Tumor Markers (BRCA1/2)</div>
                      <div style="font-size: ${s(12)}px; color: #64748B; font-weight: 700;">Lynch syndrome negative • CEA, CA-125, PSA baseline verified</div>
                    </div>
                  </div>
                  <span style="background: #ECFDF5; color: #059669; border: 1.5px solid #10B981; font-size: ${s(13)}px; font-weight: 900; padding: ${s(3)}px ${s(9)}px; border-radius: 6px;">Specialist Signed ✓</span>
                </div>
              </div>
            </div>

            <!-- Environmental Carcinogen Shield Matrix (6 Hazards Covered - From EnvironmentalExposuresLogScreen.tsx) -->
            <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(22)}px; padding: ${s(16)}px ${s(20)}px; box-shadow: 0 6px 20px rgba(0,0,0,0.03);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: ${s(10)}px;">
                <span style="font-size: ${s(16)}px; font-weight: 900; color: #0F172A; text-transform: uppercase;">ENVIRONMENTAL CARCINOGEN DEFENSE</span>
                <span style="font-size: ${s(13)}px; font-weight: 800; color: #059669;">6 Active Shields</span>
              </div>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${s(8)}px;">
                <div style="background: #ECFDF5; border: 1.5px solid #A7F3D0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">🛡️</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #065F46; margin-top: 2px;">PM2.5 Lung Barrier</div>
                  <div style="font-size: ${s(11)}px; color: #047857; font-weight: 700;">HEPA 13 Guarded</div>
                </div>
                <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">💧</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #1E40AF; margin-top: 2px;">Pure Water</div>
                  <div style="font-size: ${s(11)}px; color: #2563EB; font-weight: 700;">Microplastics Free</div>
                </div>
                <div style="background: #FEF3C7; border: 1.5px solid #FDE68A; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">☀️</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #92400E; margin-top: 2px;">UV Shield</div>
                  <div style="font-size: ${s(11)}px; color: #B45309; font-weight: 700;">SPF 50+ Broad</div>
                </div>
                <div style="background: #FDF2F8; border: 1.5px solid #FBCFE8; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">🍳</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #9D174D; margin-top: 2px;">Clean Kitchen</div>
                  <div style="font-size: ${s(11)}px; color: #BE185D; font-weight: 700;">Zero PFOA Non-Stick</div>
                </div>
                <div style="background: #F5F3FF; border: 1.5px solid #DDD6FE; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">🚫</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #5B21B6; margin-top: 2px;">Zero VOC</div>
                  <div style="font-size: ${s(11)}px; color: #6D28D9; font-weight: 700;">Radon & Benzene Safe</div>
                </div>
                <div style="background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: ${s(14)}px; padding: ${s(10)}px ${s(8)}px; text-align: center;">
                  <div style="font-size: ${s(20)}px;">🥬</div>
                  <div style="font-size: ${s(13)}px; font-weight: 900; color: #166534; margin-top: 2px;">Pesticide Wash</div>
                  <div style="font-size: ${s(11)}px; color: #15803D; font-weight: 700;">Ozone Micro-Flush</div>
                </div>
              </div>
            </div>

            <!-- Healthspan Telemetry Row (3 boxes) -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: ${s(10)}px;">
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">LUNG EPITHELIUM</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #0284C7; margin-top: 3px;">96% Guarded</div>
                <div style="font-size: ${s(12)}px; color: #059669; font-weight: 700; margin-top: 2px;">Alveolar Barrier OK</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">TOXIC BURDEN</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #059669; margin-top: 3px;">0.04 (Low)</div>
                <div style="font-size: ${s(12)}px; color: #059669; font-weight: 700; margin-top: 2px;">Hepatic Detox High</div>
              </div>
              <div style="background: white; border: 2px solid #E2E8F0; border-radius: ${s(18)}px; padding: ${s(14)}px ${s(12)}px; text-align: center;">
                <div style="font-size: ${s(13)}px; color: #64748B; font-weight: 800;">NCCN ROADMAP</div>
                <div style="font-size: ${s(22)}px; font-weight: 900; color: #7C3AED; margin-top: 3px;">100% Current</div>
                <div style="font-size: ${s(12)}px; color: #7C3AED; font-weight: 700; margin-top: 2px;">Next Cycle 2027</div>
              </div>
            </div>

            <!-- AI Robot Clinical Oncology Guidance Banner -->
            <div style="background: #EFF6FF; border: 1.5px solid #BFDBFE; border-radius: ${s(18)}px; padding: ${s(12)}px ${s(18)}px; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: ${s(10)}px;">
                <span style="font-size: ${s(24)}px;">🤖</span>
                <span style="font-size: ${s(15)}px; font-weight: 800; color: #1E40AF;">💡 Mito AI: AQI 42 is optimal. Cancer screenings 100% up to date. Outdoor Zone 2 window open until 11 AM.</span>
              </div>
              <span style="background: #0284C7; color: white; font-size: ${s(13)}px; font-weight: 800; padding: 4px 12px; border-radius: 8px;">Audited ✓</span>
            </div>
          </div>

          <!-- Bottom Action Button -->
          <div style="background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: white; padding: ${s(20)}px; border-radius: ${s(20)}px; font-size: ${s(22)}px; font-weight: 900; text-align: center; box-shadow: 0 10px 30px rgba(2,132,199,0.35); margin-top: ${s(12)}px;">
            ✓ View Full Screening Roadmap & Air Quality Defense ›
          </div>
        </div>
      `;
    }
  }
];

// ─── MASTER HTML TEMPLATE ───
function buildPageHtml({ screen, width, height, platform }) {
  const isTablet = platform === 'tablet_ios' || platform === 'tablet_android';
  const isIOSLarge = platform === 'ios_large';
  const isIOS = platform === 'ios';
  const scale = getScale(platform);

  // Proportional headline and phone chassis dimensions
  const headlineSize = isTablet 
    ? (width === 2048 ? '92px' : '80px') 
    : (isIOSLarge ? '88px' : (isIOS ? '78px' : '68px'));

  const chassisWidth = isTablet 
    ? (width === 2048 ? '1860px' : '1480px') 
    : (isIOSLarge ? '1200px' : (isIOS ? '1090px' : '1000px'));

  const topPadding = isTablet ? '48px' : (isIOSLarge ? '60px' : (isIOS ? '50px' : '40px'));
  const headlineMargin = isTablet ? '32px' : (isIOSLarge ? '30px' : (isIOS ? '24px' : '22px'));

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
      max-width: ${isTablet ? '1600px' : (platform === 'ios' ? '1180px' : '980px')};
      padding: 0 30px;
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
      height: ${Math.round(48 * scale)}px;
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
  console.log('🚀 RENDERING PROPORTIONALLY SCALED STORE ASSETS (V6 HARMONIZED)');
  console.log('================================================================');

  const onlyNew = process.argv.includes('--only-new');
  const targetScreens = onlyNew
    ? screens.filter(s => s.id.startsWith('07') || s.id.startsWith('08') || s.id.startsWith('09'))
    : screens;

  console.log(`Targeting ${targetScreens.length} screens (onlyNew: ${onlyNew})`);

  const tempDir = path.join('/tmp', 'proportional_store_v6');
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Phone Screenshots: iOS Medium (1179x2556), iOS Large (1290x2796) & Android (1080x1920)
  console.log('\n📱 [1/4] Rendering Phone Screenshots (iOS Dynamic Island 1179x2556, iOS Large 1290x2796 & Android 1080x1920)...');
  for (let i = 0; i < targetScreens.length; i++) {
    const s = targetScreens[i];
    console.log(`   📸 [${i + 1}/${targetScreens.length}] ${s.id}...`);

    // iOS Dynamic Island Medium Display (1179x2556) - EXACT App Store Connect specification
    const iosHtml = buildPageHtml({ screen: s, width: 1179, height: 2556, platform: 'ios' });
    const iosHtmlPath = path.join(tempDir, `${s.id}_ios_1179.html`);
    const iosPngPath = path.join(iosDir, `${s.id}.png`);
    const iosMediumPngPath = path.join(iosMediumScreensDir, `${s.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${iosPngPath}" --window-size=1179,2556 "${iosHtmlPath}"`, { stdio: 'pipe' });
    fs.copyFileSync(iosPngPath, iosMediumPngPath);

    // iOS Large Display (1290x2796) - For iPhone 6.7" / 6.9" display
    const iosLargeHtml = buildPageHtml({ screen: s, width: 1290, height: 2796, platform: 'ios_large' });
    const iosLargeHtmlPath = path.join(tempDir, `${s.id}_ios_1290.html`);
    const iosLargePngPath = path.join(iosLargeDir, `${s.id}.png`);
    fs.writeFileSync(iosLargeHtmlPath, iosLargeHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${iosLargePngPath}" --window-size=1290,2796 "${iosLargeHtmlPath}"`, { stdio: 'pipe' });

    // Android (1080x1920) with 1.0x baseline scale factor
    const androidHtml = buildPageHtml({ screen: s, width: 1080, height: 1920, platform: 'android' });
    const androidHtmlPath = path.join(tempDir, `${s.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${s.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, { stdio: 'pipe' });
  }

  // 2. Tablet Screenshots: Android Tablet (1600x2560) & iPad Pro (2048x2732)
  console.log('\n📟 [2/4] Rendering Tablet Screenshots (iPad Pro 1.42x & Android Tablet 1.33x)...');
  for (let i = 0; i < targetScreens.length; i++) {
    const s = targetScreens[i];
    console.log(`   📸 [${i + 1}/${targetScreens.length}] Tablet: ${s.id}...`);

    // Android Tablet (1600x2560)
    const tabletAndroidHtml = buildPageHtml({ screen: s, width: 1600, height: 2560, platform: 'tablet_android' });
    const tabletAndroidHtmlPath = path.join(tempDir, `${s.id}_tablet_android.html`);
    const tabletAndroidPngPath = path.join(tabletAndroidDir, `${s.id}.png`);
    fs.writeFileSync(tabletAndroidHtmlPath, tabletAndroidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${tabletAndroidPngPath}" --window-size=1600,2560 "${tabletAndroidHtmlPath}"`, { stdio: 'pipe' });

    // Apple iPad Pro (2048x2732)
    const tabletIosHtml = buildPageHtml({ screen: s, width: 2048, height: 2732, platform: 'tablet_ios' });
    const tabletIosHtmlPath = path.join(tempDir, `${s.id}_tablet_ios.html`);
    const tabletIosPngPath = path.join(tabletIosDir, `${s.id}.png`);
    const ipad13PngPath = path.join(ipad13Dir, `${s.id}.png`);
    fs.writeFileSync(tabletIosHtmlPath, tabletIosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${tabletIosPngPath}" --window-size=2048,2732 "${tabletIosHtmlPath}"`, { stdio: 'pipe' });
    fs.copyFileSync(tabletIosPngPath, ipad13PngPath);
  }

  // 3. Desktop / Web Screenshots: 1920x1080
  console.log('\n💻 [3/4] Rendering Desktop Showcase Screenshots (1920x1080)...');
  const desktopScreens = onlyNew ? targetScreens : screens.slice(0, 3);
  for (let i = 0; i < desktopScreens.length; i++) {
    const s = desktopScreens[i];
    const desktopHtml = buildPageHtml({ screen: s, width: 1920, height: 1080, platform: 'desktop' });
    const desktopHtmlPath = path.join(tempDir, `${s.id}_desktop.html`);
    const desktopPngPath = path.join(desktopDir, `${s.id}.png`);
    fs.writeFileSync(desktopHtmlPath, desktopHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${desktopPngPath}" --window-size=1920,1080 "${desktopHtmlPath}"`, { stdio: 'pipe' });
  }

  // 4. Feature Graphic: Google Play 1024x500 (only when rendering all)
  if (!onlyNew) {
    console.log('\n🎨 [4/4] Rendering Play Store Feature Graphic (1024x500)...');
  const fgHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px;
      height: 500px;
      background: #0F172A;
      font-family: 'Plus Jakarta Sans', sans-serif;
      overflow: hidden;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 60px;
    }
    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 75% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 60%),
                  radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.25) 0%, transparent 50%);
    }
    .left {
      position: relative;
      z-index: 10;
      max-width: 540px;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.15);
      border: 1.5px solid #10B981;
      color: #34D399;
      font-size: 14px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 20px;
      margin-bottom: 16px;
    }
    h1 {
      color: #FFFFFF;
      font-size: 42px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
    }
    h1 span {
      background: linear-gradient(135deg, #34D399, #60A5FA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: #94A3B8;
      font-size: 16px;
      font-weight: 600;
      margin-top: 14px;
      line-height: 1.4;
    }
    .pills {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }
    .pill {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: white;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 12px;
    }
    .right {
      position: relative;
      z-index: 10;
      width: 380px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .card {
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(20px);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 18px;
      padding: 16px 20px;
      color: white;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="left">
    <div class="tag">⚡ CLINICAL LONGEVITY & AI MEDICINE</div>
    <h1>Mito_Reboot<br><span>Your AI Longevity Clinic</span></h1>
    <p>Continuous Glucose Telemetry (CGM), Gia Genetic AI Counselor, Mia Sleep Companion, and Clinical Oncology Telehealth.</p>
    <div class="pills">
      <span class="pill">📈 Live CGM Sync</span>
      <span class="pill">🧬 Bio-Age Reversal</span>
      <span class="pill">⚡ 10-Sec AI Log</span>
    </div>
  </div>
  <div class="right">
    <div class="card" style="border-color: rgba(16, 185, 129, 0.4);">
      <div style="font-size: 12px; color: #34D399; font-weight: 800; text-transform: uppercase;">CELLULAR LONGEVITY</div>
      <div style="font-size: 28px; font-weight: 900; margin-top: 2px;">34.6 <span style="font-size: 14px; color: #94A3B8;">Yrs Bio-Age (-3.4 Yrs)</span></div>
      <div style="font-size: 12px; color: #60A5FA; margin-top: 2px;">0.88x Pace of Aging • Epigenetic Proof</div>
    </div>
    <div class="card" style="border-color: rgba(139, 92, 246, 0.4);">
      <div style="font-size: 12px; color: #C084FC; font-weight: 800; text-transform: uppercase;">AI SPECIALIST COUNSELORS</div>
      <div style="font-size: 18px; font-weight: 900; margin-top: 2px;">🧬 Gia (Genetic AI) + 🌙 Mia (Sleep AI)</div>
      <div style="font-size: 12px; color: #A78BFA; margin-top: 2px;">NCCN v2.2025 Clinical Guidelines Integrated</div>
    </div>
  </div>
</body>
</html>`;
  const fgHtmlPath = path.join(tempDir, 'feature_graphic.html');
  const fgPngPath = path.join(featureGraphicDir, 'feature_graphic.png');
  fs.writeFileSync(fgHtmlPath, fgHtml, 'utf8');
  execSync(`"${CHROME_PATH}" --headless --no-sandbox --disable-gpu --user-data-dir="${path.join(tempDir, 'user-data')}" --screenshot="${fgPngPath}" --window-size=1024,500 "${fgHtmlPath}"`, { stdio: 'pipe' });
  }

  console.log('\n🎉 ALL STORE ASSETS GENERATED WITH BALANCED PROPORTIONS & ZERO EMPTY SPACE!');
}

runGenerator().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
