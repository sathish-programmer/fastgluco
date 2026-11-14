const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../app_store_screenshots');

// Ensure output directories exist
const iosDir = path.join(OUTPUT_DIR, 'ios');
const androidDir = path.join(OUTPUT_DIR, 'android');
const featureGraphicDir = path.join(OUTPUT_DIR, 'feature_graphic');
fs.mkdirSync(iosDir, { recursive: true });
fs.mkdirSync(androidDir, { recursive: true });
fs.mkdirSync(featureGraphicDir, { recursive: true });

// High-impact, modern app store screens
const screens = [
  {
    id: '01_cellular_rhythm',
    badge: '🌿 CELLULAR HEALTH & LONGEVITY',
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
    title: 'Track Your Cellular Rhythm',
    subtitle: 'Balance lifestyle stress load against restorative cellular defense',
    gradient: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 35%, #EDE9FE 100%)',
    accentColor: '#10B981',
    activeTab: 'Home',
    cards: [
      `
      <!-- Cellular Balance Summary Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 48px; height: 48px; border-radius: 16px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 6px 14px rgba(16,185,129,0.25);">⚖️</div>
            <div>
              <div style="font-size: 20px; font-weight: 900; color: #0F172A; letter-spacing: -0.3px;">Cellular Balance</div>
              <div style="font-size: 13px; color: #64748B; font-weight: 600;">Lifestyle Stress vs Restorative Defense</div>
            </div>
          </div>
          <div style="background: #ECFDF5; color: #047857; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 20px; border: 1.5px solid #A7F3D0;">
            🔥 7d Streak
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div style="background: linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%); border: 1.5px solid #86EFAC; border-radius: 20px; padding: 16px 12px; text-align: left;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 8px #10B981;"></span>
              <span style="font-size: 12px; font-weight: 900; color: #065F46; text-transform: uppercase;">Repair</span>
            </div>
            <div style="font-size: 38px; font-weight: 900; color: #059669; margin: 4px 0 2px 0; line-height: 1;">6</div>
            <div style="font-size: 12px; color: #047857; font-weight: 700;">Habits active</div>
          </div>

          <div style="background: linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%); border: 1.5px solid #FDA4AF; border-radius: 20px; padding: 16px 12px; text-align: left;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #F43F5E; box-shadow: 0 0 8px #F43F5E;"></span>
              <span style="font-size: 12px; font-weight: 900; color: #9F1239; text-transform: uppercase;">Stress</span>
            </div>
            <div style="font-size: 38px; font-weight: 900; color: #E11D48; margin: 4px 0 2px 0; line-height: 1;">2</div>
            <div style="font-size: 12px; color: #BE123C; font-weight: 700;">Triggers active</div>
          </div>

          <div style="background: linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #A5B4FC; border-radius: 20px; padding: 16px 12px; text-align: left;">
            <div style="font-size: 12px; font-weight: 900; color: #3730A3; text-transform: uppercase;">Net Margin</div>
            <div style="font-size: 38px; font-weight: 900; color: #4F46E5; margin: 4px 0 2px 0; line-height: 1;">+4</div>
            <div style="font-size: 12px; color: #4338CA; font-weight: 700;">Net Repair</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- 7-Day Cellular Rhythm Capsules Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 12px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">7-Day Trajectory</div>
            <div style="font-size: 18px; font-weight: 900; color: #0F172A; margin-top: 2px;">Cellular Rhythm Capsules</div>
          </div>
          <div style="display: flex; gap: 6px; background: #F1F5F9; padding: 4px; border-radius: 12px;">
            <span style="background: white; color: #0F172A; font-size: 12px; font-weight: 900; padding: 5px 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">Capsules</span>
            <span style="color: #64748B; font-size: 12px; font-weight: 700; padding: 5px 10px;">Bars</span>
            <span style="color: #64748B; font-size: 12px; font-weight: 700; padding: 5px 10px;">Line</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 8px; align-items: flex-end; height: 180px; padding: 8px 0;">
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">SAT<br/><strong style="font-size: 14px; color: #0F172A;">7</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 14px; color: #CBD5E1; font-weight: 900;">—</span>
              <span style="font-size: 9px; color: #94A3B8; font-weight: 800; text-transform: uppercase;">Rest</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 800;">•</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">SUN<br/><strong style="font-size: 14px; color: #0F172A;">8</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 14px; color: #CBD5E1; font-weight: 900;">—</span>
              <span style="font-size: 9px; color: #94A3B8; font-weight: 800; text-transform: uppercase;">Rest</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8; font-weight: 800;">•</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">MON<br/><strong style="font-size: 14px; color: #0F172A;">9</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F1F5F9; border: 1.5px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 60%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">2</div>
              <div style="width: 16px; height: 35%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">1</div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">+1</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">TUE<br/><strong style="font-size: 14px; color: #0F172A;">10</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F1F5F9; border: 1.5px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 45%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">1</div>
              <div style="width: 16px; height: 75%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">3</div>
            </div>
            <div style="background: #FFF1F2; color: #BE123C; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">-2</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">WED<br/><strong style="font-size: 14px; color: #0F172A;">11</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F1F5F9; border: 1.5px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 80%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">4</div>
              <div style="width: 16px; height: 25%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">1</div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">+3</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B; text-align: center;">THU<br/><strong style="font-size: 14px; color: #0F172A;">12</strong></div>
            <div style="width: 44px; height: 110px; border-radius: 22px; background: #F1F5F9; border: 1.5px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 70%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">3</div>
              <div style="width: 16px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: 900;">1</div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 8px;">+2</div>
          </div>

          <!-- Fri (Selected Today) -->
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%; transform: translateY(-4px);">
            <div style="font-size: 12px; font-weight: 900; color: #4F46E5; text-align: center;">FRI<br/><strong style="font-size: 15px; color: #4F46E5;">13</strong></div>
            <div style="width: 48px; height: 118px; border-radius: 24px; background: #EEF2FF; border: 2.5px solid #6366F1; box-shadow: 0 6px 18px rgba(99,102,241,0.25); padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 18px; height: 95%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900;">6</div>
              <div style="width: 18px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900;">2</div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 900; padding: 2px 8px; border-radius: 8px; border: 1px solid #A7F3D0;">+4</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Today's Check-ins & Forces Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-size: 14px; font-weight: 900; color: #0F172A; text-transform: uppercase; letter-spacing: 0.5px;">Today's Check-ins (2 Logged)</div>
          <span style="font-size: 12px; font-weight: 800; color: #2563EB; background: #EFF6FF; padding: 4px 10px; border-radius: 8px;">Next in 2h</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
          <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 14px; font-weight: 900; color: #0F172A;">Check-in #1</span>
              <span style="font-size: 11px; color: #64748B; font-weight: 800;">0:59 AM</span>
            </div>
            <div style="font-size: 13px; color: #059669; font-weight: 800;">✓ 1 Repair / 1 Trigger</div>
            <div style="font-size: 11px; color: #64748B; margin-top: 2px;">0 Balanced State</div>
          </div>

          <div style="background: #EEF2FF; border: 2px solid #818CF8; border-radius: 18px; padding: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 14px; font-weight: 900; color: #3730A3;">Check-in #2</span>
              <span style="font-size: 11px; color: #4338CA; font-weight: 800;">7:36 AM</span>
            </div>
            <div style="font-size: 13px; color: #E11D48; font-weight: 800;">⚡ 1 Repair / 3 Stress</div>
            <div style="font-size: 11px; color: #4338CA; margin-top: 2px;">-2 Net Stress Margin</div>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
            <span>🌿</span> 20m Post-Meal Walk (+1 Repair)
          </div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
            <span>🧘</span> 15m Stillness & Breath (+1 Repair)
          </div>
          <div style="background: #FFF1F2; border: 1px solid #FECDD3; color: #9F1239; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 800; display: flex; align-items: center; gap: 6px;">
            <span>⚠️</span> Late Screen Time (+1 Stress)
          </div>
        </div>
      </div>
      `,
      `
      <!-- Clinical Action Plan & Habits Tracker Card -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 28px; padding: 22px 24px; color: white; box-shadow: 0 14px 34px rgba(15,23,42,0.12);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">🎯</span>
            <span style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #38BDF8;">Today's Recovery Targets</span>
          </div>
          <span style="font-size: 11px; font-weight: 800; background: rgba(56,189,248,0.2); color: #7DD3FC; padding: 3px 10px; border-radius: 8px;">4 of 5 Complete</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div style="background: rgba(255,255,255,0.08); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">🚶</span>
            <div>
              <div style="font-size: 13px; font-weight: 800;">8,420 Steps</div>
              <div style="font-size: 10px; color: #94A3B8;">Goal: 10,000</div>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.08); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px;">💧</span>
            <div>
              <div style="font-size: 13px; font-weight: 800;">2.4L Water</div>
              <div style="font-size: 10px; color: #94A3B8;">Goal: 3.0L</div>
            </div>
          </div>
        </div>
      </div>
      `
    ]
  },
  {
    id: '02_smart_diet_food_scanner',
    badge: '🥗 AI FOOD SCANNER & MACROS',
    badgeColor: '#2563EB',
    badgeBg: '#EFF6FF',
    title: 'AI Food & Glycemic Logger',
    subtitle: 'Snap meals, view macro breakdown, and predict glucose spikes',
    gradient: 'linear-gradient(180deg, #EFF6FF 0%, #F8FAFC 35%, #E0E7FF 100%)',
    accentColor: '#2563EB',
    activeTab: 'Home',
    cards: [
      `
      <!-- Camera Food Scanner Hero Card -->
      <div style="background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%); border-radius: 28px; padding: 26px; color: white; box-shadow: 0 14px 34px rgba(37,99,235,0.25); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="background: rgba(255,255,255,0.22); backdrop-blur-md; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase;">
            📸 AI Food Scanner
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #BFDBFE;">Instant Calorie & Macro AI</div>
        </div>
        <div style="font-size: 24px; font-weight: 900; margin-bottom: 6px; letter-spacing: -0.5px;">Grilled Salmon Quinoa Bowl</div>
        <div style="font-size: 14px; color: #DBEAFE; line-height: 1.45; margin-bottom: 18px;">
          Detected: Atlantic salmon fillet, steamed quinoa, avocado, broccoli florets & extra virgin olive oil vinaigrette.
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Calories</div>
            <div style="font-size: 24px; font-weight: 900; margin-top: 3px;">480</div>
            <div style="font-size: 11px; color: #DBEAFE;">kcal</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Protein</div>
            <div style="font-size: 24px; font-weight: 900; margin-top: 3px;">42g</div>
            <div style="font-size: 11px; color: #A7F3D0; font-weight: 800;">High</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Carbs</div>
            <div style="font-size: 24px; font-weight: 900; margin-top: 3px;">34g</div>
            <div style="font-size: 11px; color: #DBEAFE;">Complex</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Fiber</div>
            <div style="font-size: 24px; font-weight: 900; margin-top: 3px;">12g</div>
            <div style="font-size: 11px; color: #A7F3D0; font-weight: 800;">Rich</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Glycemic Impact Forecast Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-size: 17px; font-weight: 900; color: #0F172A;">Glycemic Impact Forecast</div>
          <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: 1px solid #A7F3D0;">
            ✓ Safe Zone
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 18px;">
          <div style="width: 66px; height: 66px; border-radius: 50%; background: #ECFDF5; border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #059669; box-shadow: 0 4px 14px rgba(16,185,129,0.25);">
            98
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 900; color: #0F172A;">Expected Peak: 114 mg/dL (+16 mg/dL)</div>
            <div style="font-size: 13px; color: #64748B; margin-top: 3px; line-height: 1.45;">Healthy omega-3 fatty acids and soluble fiber buffer postprandial glucose perfectly.</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Logged Meals Today -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 14px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Logged Meals (Today)</div>
          <span style="font-size: 12px; font-weight: 800; color: #059669;">1,180 / 2,100 kcal</span>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
            <div>
              <div style="font-size: 14px; font-weight: 800; color: #0F172A;">🥣 Chia Pudding with Wild Berries</div>
              <div style="font-size: 11px; color: #64748B;">Breakfast • 8:30 AM • 280 kcal</div>
            </div>
            <span style="font-size: 12px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 3px 10px; border-radius: 8px;">+8 mg/dL</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0;">
            <div>
              <div style="font-size: 14px; font-weight: 800; color: #0F172A;">🥗 Grilled Salmon Quinoa Bowl</div>
              <div style="font-size: 11px; color: #64748B;">Lunch • 1:15 PM • 480 kcal</div>
            </div>
            <span style="font-size: 12px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 3px 10px; border-radius: 8px;">+16 mg/dL</span>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Doctor Recommended Pairings -->
      <div style="background: white; border-radius: 28px; padding: 20px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06);">
        <div style="font-size: 12px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 10px;">Doctor-Endorsed Pairings</div>
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1; padding: 10px 12px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; font-size: 12px; font-weight: 800; color: #065F46;">
            🥗 Sprouted Fenugreek (-14% Spike)
          </div>
          <div style="flex: 1; padding: 10px 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; font-size: 12px; font-weight: 800; color: #1E40AF;">
            🚶 10m Post-Meal Walk (Blunter)
          </div>
        </div>
      </div>
      `
    ]
  },
  {
    id: '03_continuous_glucose_cgm',
    badge: '📈 METABOLIC INTELLIGENCE & CGM',
    badgeColor: '#7C3AED',
    badgeBg: '#F5F3FF',
    title: 'Continuous Glucose Insights',
    subtitle: 'Abbott sensor sync, metabolic stability score, and curve analysis',
    gradient: 'linear-gradient(180deg, #F5F3FF 0%, #F8FAFC 35%, #EDE9FE 100%)',
    accentColor: '#7C3AED',
    activeTab: 'Home',
    cards: [
      `
      <!-- Sensor Live Reading & Stability Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #7C3AED; text-transform: uppercase;">Abbott FreeStyle Libre Sync</div>
            <div style="font-size: 24px; font-weight: 900; color: #0F172A; margin-top: 2px;">Good day, Sathish Kumar</div>
          </div>
          <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 20px; border: 1.5px solid #A7F3D0; display: flex; align-items: center; gap: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981; box-shadow: 0 0 8px #10B981;"></span> Live Sensor
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 18px; padding: 18px; background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 22px;">
          <div style="position: relative; width: 84px; height: 84px; border-radius: 50%; background: conic-gradient(#7C3AED 0% 94%, #E9D5FF 94% 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 18px rgba(124,58,237,0.22);">
            <div style="width: 68px; height: 68px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 22px; font-weight: 900; color: #7C3AED; line-height: 1;">94%</span>
              <span style="font-size: 8px; color: #6B7280; font-weight: 800; text-transform: uppercase;">Score</span>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 17px; font-weight: 900; color: #0F172A;">Metabolic Stability: Optimal</div>
            <div style="font-size: 13px; color: #6B7280; margin-top: 3px; line-height: 1.45;">22.6 hours within target range (70–140 mg/dL) with low glycemic variability.</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- 24H Live Glucose Curve SVG Graph -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div>
            <div style="font-size: 17px; font-weight: 900; color: #0F172A;">24-Hour Continuous Trace</div>
            <div style="font-size: 12px; color: #64748B;">Target Range: 70 – 140 mg/dL</div>
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #059669; background: #ECFDF5; padding: 5px 12px; border-radius: 8px; border: 1px solid #A7F3D0;">
            Avg: 98 mg/dL
          </div>
        </div>

        <svg viewBox="0 0 500 160" style="width: 100%; height: 150px; overflow: visible;">
          <defs>
            <linearGradient id="cgmGrad4" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="35" width="500" height="85" fill="#10B981" fill-opacity="0.08" rx="10"/>
          <line x1="0" y1="35" x2="500" y2="35" stroke="#F59E0B" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
          <line x1="0" y1="120" x2="500" y2="120" stroke="#10B981" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
          
          <path d="M 0 95 Q 70 90, 120 72 T 220 54 T 310 110 T 400 78 T 500 84 L 500 150 L 0 150 Z" fill="url(#cgmGrad4)"/>
          <path d="M 0 95 Q 70 90, 120 72 T 220 54 T 310 110 T 400 78 T 500 84" fill="none" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
          
          <circle cx="220" cy="54" r="6" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="220" y="40" text-anchor="middle" font-size="11" font-weight="900" fill="#7C3AED">Peak 124 mg/dL</text>
          
          <circle cx="310" cy="110" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
          <text x="310" y="130" text-anchor="middle" font-size="10" font-weight="900" fill="#059669">Fasting 86</text>
        </svg>

        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #94A3B8; margin-top: 8px;">
          <span>12 AM</span>
          <span>4 AM</span>
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>NOW</span>
        </div>
      </div>
      `,
      `
      <!-- Quick Metrics 4-Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px;">
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 10px; color: #64748B; font-weight: 800; text-transform: uppercase;">In Range</div>
          <div style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 3px;">94%</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 10px; color: #64748B; font-weight: 800; text-transform: uppercase;">Average</div>
          <div style="font-size: 24px; font-weight: 900; color: #7C3AED; margin-top: 3px;">98</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 10px; color: #64748B; font-weight: 800; text-transform: uppercase;">Est. HbA1c</div>
          <div style="font-size: 24px; font-weight: 900; color: #2563EB; margin-top: 3px;">5.1%</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 10px; color: #64748B; font-weight: 800; text-transform: uppercase;">Variability</div>
          <div style="font-size: 24px; font-weight: 900; color: #10B981; margin-top: 3px;">12%</div>
        </div>
      </div>
      `,
      `
      <!-- Clinical Sensor Status Card -->
      <div style="background: #FAF5FF; border: 1.5px solid #E9D5FF; border-radius: 20px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 38px; height: 38px; border-radius: 12px; background: #7C3AED; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px;">🩺</div>
          <div>
            <div style="font-size: 13px; font-weight: 900; color: #0F172A;">Abbott Sensor Calibration</div>
            <div style="font-size: 11px; color: #6B7280;">11 Days remaining • Signal Strength: Strong</div>
          </div>
        </div>
        <span style="background: white; color: #7C3AED; font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 8px; border: 1px solid #D8B4FE;">Sync Now</span>
      </div>
      `
    ]
  },
  {
    id: '04_specialist_doctor_teleconsult',
    badge: '👩‍⚕️ CLINICAL ONCOLOGY CARE',
    badgeColor: '#0284C7',
    badgeBg: '#F0F9FF',
    title: 'Consult Top Cancer Specialists',
    subtitle: 'Direct video appointments & Ministry-compliant digital prescriptions',
    gradient: 'linear-gradient(180deg, #F0F9FF 0%, #F8FAFC 35%, #E0F2FE 100%)',
    accentColor: '#0284C7',
    activeTab: 'Book Appointment',
    cards: [
      `
      <!-- Verified Doctor Profile Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
          <div style="width: 76px; height: 76px; border-radius: 22px; background: linear-gradient(135deg, #0284C7, #38BDF8); display: flex; align-items: center; justify-content: center; font-size: 38px; color: white; box-shadow: 0 8px 20px rgba(2,132,199,0.25);">
            👩‍⚕️
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 22px; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar</span>
              <span style="background: #E0F2FE; color: #0369A1; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">✓ Verified MD</span>
            </div>
            <div style="font-size: 14px; color: #0284C7; font-weight: 800; margin-top: 3px;">
              Radiation Oncology MD • 12+ Yrs Clinical Experience
            </div>
            <div style="font-size: 12px; color: #64748B; font-weight: 600;">
              Mito Reboot Specialist Panel • Basavanagudi
            </div>
          </div>
        </div>

        <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Specialist Focus</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Radiation Oncology</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Metabolic Fasting</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Active Cancer Care</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Mitophagy Protocols</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <button style="flex: 1; background: #0284C7; color: white; border: none; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 900; box-shadow: 0 4px 16px rgba(2,132,199,0.3); display: flex; align-items: center; justify-content: center; gap: 8px;">
            <span>📹</span> Book Video Consult
          </button>
          <button style="background: #F1F5F9; color: #334155; border: none; padding: 14px 20px; border-radius: 16px; font-size: 14px; font-weight: 800;">
            View Profile
          </button>
        </div>
      </div>
      `,
      `
      <!-- Verified Digital Prescription Sample -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 13px; font-weight: 900; color: #0284C7; letter-spacing: 0.5px;">℞ DIGITAL TELEMEDICINE PRESCRIPTION</div>
          <div style="font-size: 12px; color: #0284C7; font-weight: 800; background: #E0F2FE; padding: 3px 10px; border-radius: 8px;">RX-2ADD3BA3</div>
        </div>
        <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">Cellular Protective Protocol & Targeted Lifestyle Regimen</div>
        <div style="font-size: 13px; color: #64748B; line-height: 1.45; margin-bottom: 12px;">
          Personalized Curcumin + Piperine protocol, 16:8 circadian feeding window, and targeted mitochondrial antioxidant schedule.
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1.5px solid #F1F5F9;">
          <span style="font-size: 12px; color: #059669; font-weight: 800;">✓ Telemedicine Guidelines Compliant</span>
          <span style="font-size: 12px; font-weight: 800; color: #2563EB;">📄 Download Official PDF</span>
        </div>
      </div>
      `,
      `
      <!-- Available Consultation Slots -->
      <div style="background: #F0F9FF; border: 1.5px solid #BAE6FD; border-radius: 20px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-size: 13px; font-weight: 900; color: #0369A1;">Next Available Video Consultation</div>
          <div style="font-size: 12px; color: #0284C7; margin-top: 2px;">Today, 4:30 PM (30 min slot)</div>
        </div>
        <span style="background: #0284C7; color: white; font-size: 12px; font-weight: 800; padding: 8px 16px; border-radius: 10px;">Reserve Slot</span>
      </div>
      `
    ]
  },
  {
    id: '05_educational_video_library',
    badge: '🎙️ ONCOLOGY & WELLNESS LIBRARY',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    title: '57+ Curated Masterclasses',
    subtitle: 'Podcasts, video lessons & scientific mechanisms from leading oncologists',
    gradient: 'linear-gradient(180deg, #FEF3C7 0%, #F8FAFC 35%, #FFEDD5 100%)',
    accentColor: '#D97706',
    activeTab: 'Learn',
    cards: [
      `
      <!-- Featured Topic Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <div style="font-size: 17px; font-weight: 900; color: #0F172A;">Clinical Knowledge Hub</div>
          <div style="background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 10px;">57 Masterclasses</div>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto;">
          <span style="background: #0F172A; color: white; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">All (57)</span>
          <span style="background: #FFF1F2; color: #BE123C; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">🔥 Damage Load</span>
          <span style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">🌿 Repair Defenses</span>
        </div>

        <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 20px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase;">Topic #1 • Cortisol & Inflammation</div>
            <div style="background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">👑 PRO Masterclass</div>
          </div>
          <div style="font-size: 16px; font-weight: 900; color: #78350F; margin-bottom: 6px;">
            How Chronic Stress Shapes Cancer Risk & Cellular Recovery
          </div>
          <div style="font-size: 13px; color: #92400E; line-height: 1.45; margin-bottom: 14px;">
            Dr. Krithikaa Sekar breaks down sympathetic overdrive and mitochondrial survival pathways.
          </div>
          <div style="display: flex; gap: 10px;">
            <span style="background: #2563EB; color: white; font-size: 12px; font-weight: 800; padding: 8px 14px; border-radius: 10px; display: flex; align-items: center; gap: 6px;">
              <span>🎙️</span> Listen on Buzzsprout
            </span>
            <span style="background: white; border: 1.5px solid #CBD5E1; color: #334155; font-size: 12px; font-weight: 800; padding: 8px 12px; border-radius: 10px;">
              ▶️ Watch (24m)
            </span>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Curated Video List -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06);">
        <div style="font-size: 13px; font-weight: 900; color: #64748B; text-transform: uppercase; margin-bottom: 12px;">Trending Oncology Series</div>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="padding: 12px 14px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #BE123C; text-transform: uppercase;">Sleep Debt & Glymphatics</div>
              <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin: 2px 0;">Circadian Melatonin & Cellular DNA Repair</div>
              <div style="font-size: 11px; color: #64748B;">Understanding deep REM autophagy triggers.</div>
            </div>
            <span style="background: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">👑 PRO</span>
          </div>

          <div style="padding: 12px 14px; background: #F8FAFC; border-radius: 16px; border: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase;">Metabolic Nutrition</div>
              <div style="font-size: 14px; font-weight: 900; color: #0F172A; margin: 2px 0;">Basal Insulin Control vs Fasting Glucose Spikes</div>
              <div style="font-size: 11px; color: #64748B;">How tumor microenvironments respond to glucose deprivation.</div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">Free</span>
          </div>
        </div>
      </div>
      `
    ]
  },
  {
    id: '06_daily_habits_cellular_defense',
    badge: '⚡ HOLISTIC CELLULAR DEFENSE',
    badgeColor: '#4F46E5',
    badgeBg: '#EEF2FF',
    title: 'Autophagy & Recovery Protocols',
    subtitle: 'Circadian fasting clock, vagus nerve breathwork & habit streaks',
    gradient: 'linear-gradient(180deg, #EEF2FF 0%, #F8FAFC 35%, #E0E7FF 100%)',
    accentColor: '#4F46E5',
    activeTab: 'Profile',
    cards: [
      `
      <!-- Intermittent Fasting Window Card -->
      <div style="background: white; border-radius: 28px; padding: 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: #4F46E5; text-transform: uppercase;">Autophagy Protocol</div>
            <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 2px;">Circadian 16:8 Fasting Window</div>
          </div>
          <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 12px; border: 1.5px solid #A7F3D0;">
            ⚡ Peak Autophagy
          </div>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-around; padding: 6px 0;">
          <div style="text-align: center;">
            <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase;">Fast Began</div>
            <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 2px;">8:00 PM</div>
          </div>
          <div style="position: relative; width: 120px; height: 120px; border-radius: 50%; background: conic-gradient(#4F46E5 0% 88%, #EEF2FF 88% 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 22px rgba(79,70,229,0.22);">
            <div style="width: 96px; height: 96px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 22px; font-weight: 900; color: #4F46E5;">14h 22m</span>
              <span style="font-size: 9px; font-weight: 800; color: #10B981;">Autophagy Active</span>
            </div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase;">Daily Goal</div>
            <div style="font-size: 20px; font-weight: 900; color: #0F172A; margin-top: 2px;">16h 00m</div>
          </div>
        </div>
      </div>
      `,
      `
      <!-- Vagus Nerve Breathwork Calmer -->
      <div style="background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); border-radius: 28px; padding: 22px; color: white; box-shadow: 0 14px 32px rgba(67,56,202,0.25); margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-size: 11px; font-weight: 800; color: #C7D2FE; text-transform: uppercase;">Vagus Tone Mode</div>
          <div style="font-size: 11px; font-weight: 700; color: #A5B4FC;">4-7-8 Parasympathetic Reset</div>
        </div>
        <div style="font-size: 18px; font-weight: 900; margin-bottom: 4px;">De-Stress Vagal Tone Breathwork</div>
        <div style="font-size: 13px; color: #C7D2FE; line-height: 1.45; margin-bottom: 14px;">
          Proven parasympathetic stimulation to suppress cortisol surges and trigger cellular repair cascades.
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="background: rgba(255,255,255,0.22); backdrop-blur-md; padding: 8px 14px; border-radius: 12px; font-size: 12px; font-weight: 800;">
            ▶️ Start 5-Min Session
          </span>
          <span style="font-size: 12px; color: #C7D2FE;">🎵 432 Hz Binaural Waveform</span>
        </div>
      </div>
      `,
      `
      <!-- Habit Consistency 4 Pillars -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06);">
        <div style="font-size: 13px; font-weight: 900; color: #0F172A; margin-bottom: 12px;">Daily Restorative Checkpoints (4 Pillars)</div>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div style="text-align: center; background: #F8FAFC; border-radius: 16px; padding: 12px 6px; border: 1px solid #E2E8F0;">
            <div style="width: 44px; height: 44px; border-radius: 14px; background: #ECFDF5; color: #059669; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">🚶</div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">Movement</div>
            <div style="font-size: 11px; color: #059669; font-weight: 700;">8,420 steps</div>
          </div>
          <div style="text-align: center; background: #F8FAFC; border-radius: 16px; padding: 12px 6px; border: 1px solid #E2E8F0;">
            <div style="width: 44px; height: 44px; border-radius: 14px; background: #EEF2FF; color: #4F46E5; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">🧘</div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">Stillness</div>
            <div style="font-size: 11px; color: #4F46E5; font-weight: 700;">15 mins</div>
          </div>
          <div style="text-align: center; background: #F8FAFC; border-radius: 16px; padding: 12px 6px; border: 1px solid #E2E8F0;">
            <div style="width: 44px; height: 44px; border-radius: 14px; background: #FEF3C7; color: #D97706; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">💧</div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">Hydration</div>
            <div style="font-size: 11px; color: #D97706; font-weight: 700;">2.4L logged</div>
          </div>
          <div style="text-align: center; background: #F8FAFC; border-radius: 16px; padding: 12px 6px; border: 1px solid #E2E8F0;">
            <div style="width: 44px; height: 44px; border-radius: 14px; background: #F3E8FF; color: #9333EA; font-size: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 4px;">🌙</div>
            <div style="font-size: 12px; font-weight: 800; color: #0F172A;">Deep Rest</div>
            <div style="font-size: 11px; color: #9333EA; font-weight: 700;">7h 45m</div>
          </div>
        </div>
      </div>
      `
    ]
  }
];

function getBottomNavHtml(activeTab) {
  const tabs = [
    {
      name: 'Home',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
    },
    {
      name: 'Learn',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
    },
    {
      name: 'Book Appt',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`
    },
    {
      name: 'Shop',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
    },
    {
      name: 'Profile',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`
    }
  ];

  return `
    <div class="bottom-nav">
      ${tabs.map(tab => {
        const isActive = tab.name.toLowerCase() === (activeTab || 'home').toLowerCase();
        const color = isActive ? '#2563EB' : '#94A3B8';
        return `
          <div class="nav-item" style="color: ${color};">
            <div style="display: flex; align-items: center; justify-content: center;">
              ${tab.icon}
            </div>
            <span style="font-size: 11px; font-weight: ${isActive ? '900' : '700'}; text-transform: uppercase; margin-top: 3px; letter-spacing: 0.5px;">${tab.name}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Builds screenshot HTML where the phone mockup fills the frame nicely without empty space
function buildHtmlTemplate({ screen, width, height }) {
  const isAndroid = width === 1080;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${screen.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      background: ${screen.gradient};
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding-top: ${isAndroid ? '50px' : '70px'};
    }

    /* Ambient Soft Radial Glows in background */
    .glow-top {
      position: absolute;
      top: -150px;
      left: 50%;
      transform: translateX(-50%);
      width: 1000px;
      height: 1000px;
      background: radial-gradient(circle, ${screen.accentColor}25 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    /* Marketing Header Section */
    .header-box {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: ${isAndroid ? '940px' : '1100px'};
      padding: 0 30px;
      margin-bottom: ${isAndroid ? '24px' : '32px'};
    }

    .badge {
      display: inline-block;
      padding: ${isAndroid ? '8px 20px' : '10px 24px'};
      background: ${screen.badgeBg};
      color: ${screen.badgeColor};
      font-size: ${isAndroid ? '16px' : '19px'};
      font-weight: 900;
      letter-spacing: 1.5px;
      border-radius: 40px;
      margin-bottom: ${isAndroid ? '10px' : '14px'};
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
      border: 1.5px solid rgba(0,0,0,0.06);
    }

    .headline {
      font-size: ${isAndroid ? '46px' : '56px'};
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: ${isAndroid ? '8px' : '12px'};
    }

    .subheadline {
      font-size: ${isAndroid ? '21px' : '25px'};
      font-weight: 600;
      color: #475569;
      line-height: 1.35;
      max-width: 860px;
      margin: 0 auto;
    }

    /* Device Mockup Showcase Frame */
    .device-container {
      position: relative;
      z-index: 10;
      width: ${isAndroid ? '880px' : '1000px'};
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .phone-body {
      width: 100%;
      height: 100%;
      background: #0B0F19;
      border-radius: 56px 56px 0 0;
      padding: 16px 16px 0 16px;
      box-shadow: 
        0 -20px 80px rgba(15, 23, 42, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
      border: 3.5px solid #1E293B;
      border-bottom: none;
      display: flex;
      flex-direction: column;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      border-radius: 44px 44px 0 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      border: 1px solid rgba(0,0,0,0.06);
    }

    /* Status Bar with Dynamic Island */
    .status-bar {
      height: 50px;
      padding: 12px 30px 0 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      z-index: 30;
      color: #0F172A;
      font-weight: 800;
      font-size: 15px;
    }

    .dynamic-island {
      width: 120px;
      height: 30px;
      background: #000000;
      border-radius: 18px;
      margin: 0 auto;
      position: absolute;
      left: 50%;
      top: 12px;
      transform: translateX(-50%);
    }

    /* App Internal Header */
    .app-nav {
      padding: 12px 24px 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.94);
      backdrop-blur-md: 10px;
      border-bottom: 1.5px solid #E2E8F0;
    }

    .app-logo {
      font-size: 22px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .app-logo span { color: #2563EB; }

    /* Screen Dynamic Content */
    .screen-content {
      padding: 20px 24px 0 24px;
      overflow: hidden;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    /* Pinned Bottom Navigation Menu */
    .bottom-nav {
      height: 80px;
      background: white;
      border-top: 1.5px solid #E2E8F0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding-bottom: 10px;
      box-shadow: 0 -6px 24px rgba(0,0,0,0.04);
      z-index: 20;
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="glow-top"></div>

  <!-- Top Marketing Headline & Tagline -->
  <div class="header-box">
    <div class="badge">${screen.badge}</div>
    <h1 class="headline">${screen.title}</h1>
    <p class="subheadline">${screen.subtitle}</p>
  </div>

  <!-- Sleek Modern Phone Showcase Mockup -->
  <div class="device-container">
    <div class="phone-body">
      <div class="phone-screen">
        <!-- Status Bar -->
        <div class="status-bar">
          <span>9:41</span>
          <div class="dynamic-island"></div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 13px; font-weight: 800;">5G</span>
            <div style="width: 22px; height: 11px; border: 2px solid #0F172A; border-radius: 4px; padding: 1.5px; display: flex;">
              <div style="width: 100%; height: 100%; background: #0F172A; border-radius: 2px;"></div>
            </div>
          </div>
        </div>

        <!-- App Nav Bar -->
        <div class="app-nav">
          <div class="app-logo">Mito<span>Reboot</span></div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: #EEF2FF; display: flex; align-items: center; justify-content: center; font-size: 16px;">🔔</div>
            <div style="width: 34px; height: 34px; border-radius: 50%; background: #2563EB; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900;">SK</div>
          </div>
        </div>

        <!-- Realistic Full-Height Screen Content -->
        <div class="screen-content">
          ${screen.cards.join('')}
        </div>

        <!-- Authentic App Bottom Tab Bar -->
        ${getBottomNavHtml(screen.activeTab)}
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Builds the Google Play Store Feature Graphic (1024 x 500 px)
function buildFeatureGraphicHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MitoReboot Feature Graphic</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1024px;
      height: 500px;
      overflow: hidden;
      background: #0B0F19;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      position: relative;
      display: flex;
      align-items: center;
      color: white;
    }

    /* Ambient glowing orbs */
    .orb-1 {
      position: absolute;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 70%);
      top: -100px;
      left: 200px;
      filter: blur(40px);
      pointer-events: none;
    }

    .orb-2 {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.4) 0%, transparent 70%);
      bottom: -150px;
      right: -50px;
      filter: blur(50px);
      pointer-events: none;
    }

    .orb-3 {
      position: absolute;
      width: 350px;
      height: 350px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(124, 58, 237, 0.3) 0%, transparent 70%);
      top: 50px;
      right: 300px;
      filter: blur(45px);
      pointer-events: none;
    }

    /* Content Layout */
    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      height: 100%;
      padding: 48px 56px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .left-side {
      max-width: 540px;
    }

    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 30px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #34D399;
      margin-bottom: 16px;
    }

    .brand-title {
      font-size: 42px;
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 12px;
    }

    .brand-title span {
      background: linear-gradient(135deg, #34D399, #60A5FA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-desc {
      font-size: 15px;
      color: #94A3B8;
      line-height: 1.5;
      font-weight: 500;
      margin-bottom: 24px;
    }

    .pills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .feature-pill {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 12px;
      padding: 8px 14px;
      font-size: 12px;
      font-weight: 700;
      color: #E2E8F0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Right Mockup Preview Showcase */
    .right-side {
      position: relative;
      width: 360px;
      height: 420px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    /* Main Phone Showcase (Angled Perspective) */
    .mockup-main {
      width: 250px;
      height: 400px;
      background: #111827;
      border-radius: 36px;
      border: 3.5px solid #334155;
      box-shadow: 
        -20px 20px 50px rgba(0, 0, 0, 0.6),
        0 0 30px rgba(52, 211, 153, 0.2);
      padding: 10px;
      display: flex;
      flex-direction: column;
      transform: rotate(3deg);
      position: relative;
      z-index: 5;
    }

    .mockup-screen {
      width: 100%;
      height: 100%;
      background: #FFFFFF;
      border-radius: 26px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      color: #0F172A;
      overflow: hidden;
    }

    /* Floating Metric Badges */
    .floating-pill-1 {
      position: absolute;
      top: 40px;
      left: -25px;
      background: white;
      color: #065F46;
      border: 1.5px solid #A7F3D0;
      padding: 8px 14px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 900;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .floating-pill-2 {
      position: absolute;
      bottom: 50px;
      right: -20px;
      background: white;
      color: #3730A3;
      border: 1.5px solid #C7D2FE;
      padding: 8px 14px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 900;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 6px;
    }
  </style>
</head>
<body>
  <div class="orb-1"></div>
  <div class="orb-2"></div>
  <div class="orb-3"></div>

  <div class="container">
    <!-- Left Hero Copy -->
    <div class="left-side">
      <div class="brand-pill">
        <span>🌿</span> CLINICAL CELLULAR HEALTH & LONGEVITY
      </div>
      <h1 class="brand-title">
        Master Your Cellular Rhythm with <span>MitoReboot</span>
      </h1>
      <p class="brand-desc">
        Balance restorative habits vs lifestyle stress load, sync continuous glucose (CGM), log meals with AI, and consult top cancer specialists.
      </p>

      <div class="pills-grid">
        <div class="feature-pill">
          <span>⚖️</span> Cellular Balance
        </div>
        <div class="feature-pill">
          <span>📈</span> Continuous CGM Sync
        </div>
        <div class="feature-pill">
          <span>📸</span> AI Macro Scanner
        </div>
        <div class="feature-pill">
          <span>👩‍⚕️</span> Specialist Consults
        </div>
      </div>
    </div>

    <!-- Right Dynamic Preview Showcase -->
    <div class="right-side">
      <!-- Floating Badge 1 -->
      <div class="floating-pill-1">
        <span>🔥</span> 7-Day Streak (+4 Margin)
      </div>

      <!-- Main Phone Mockup -->
      <div class="mockup-main">
        <div class="mockup-screen">
          <!-- App Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 6px; border-bottom: 1px solid #E2E8F0;">
            <div style="font-size: 13px; font-weight: 900; color: #0F172A;">Mito<span style="color:#2563EB;">Reboot</span></div>
            <div style="font-size: 9px; font-weight: 800; background: #ECFDF5; color: #047857; padding: 2px 6px; border-radius: 6px;">Live CGM</div>
          </div>

          <!-- Mini Balance Card -->
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px;">
            <div style="font-size: 11px; font-weight: 900; color: #0F172A; margin-bottom: 6px;">Cellular Balance Today</div>
            <div style="display: flex; justify-content: space-between;">
              <div style="text-align: center;">
                <div style="font-size: 8px; color: #059669; font-weight: 800; text-transform: uppercase;">Repair</div>
                <div style="font-size: 16px; font-weight: 900; color: #059669;">6</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 8px; color: #E11D48; font-weight: 800; text-transform: uppercase;">Stress</div>
                <div style="font-size: 16px; font-weight: 900; color: #E11D48;">2</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 8px; color: #4F46E5; font-weight: 800; text-transform: uppercase;">Net</div>
                <div style="font-size: 16px; font-weight: 900; color: #4F46E5;">+4</div>
              </div>
            </div>
          </div>

          <!-- Mini CGM Chart -->
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; font-weight: 800; color: #0F172A;">Glucose Trace</span>
              <span style="font-size: 9px; font-weight: 800; color: #059669;">94% In Range</span>
            </div>
            <svg viewBox="0 0 200 60" style="width: 100%; height: 45px;">
              <path d="M 0 40 Q 30 38, 50 25 T 90 20 T 130 45 T 170 30 T 200 35 L 200 60 L 0 60 Z" fill="rgba(124, 58, 237, 0.2)"/>
              <path d="M 0 40 Q 30 38, 50 25 T 90 20 T 130 45 T 170 30 T 200 35" fill="none" stroke="#7C3AED" stroke-width="2.5"/>
              <circle cx="90" cy="20" r="3.5" fill="#7C3AED"/>
            </svg>
          </div>

          <!-- Fasting Timer Pill -->
          <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; font-weight: 800; color: #3730A3;">⚡ 14h 22m Autophagy</span>
            <span style="font-size: 9px; font-weight: 900; color: #4F46E5;">Active</span>
          </div>
        </div>
      </div>

      <!-- Floating Badge 2 -->
      <div class="floating-pill-2">
        <span>👩‍⚕️</span> Dr. Krithikaa Sekar MD
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function runGenerator() {
  console.log('🚀 Generating Modern App Store & Google Play Screenshots & Feature Graphic...');

  const tempHtmlDir = path.join('/tmp', 'mitoreboot_screenshots_html');
  fs.mkdirSync(tempHtmlDir, { recursive: true });

  // 1. Android Google Play Store standard (1080 x 1920 - 9:16 aspect ratio)
  // 2. Apple App Store 6.7" (1290 x 2796)
  for (let i = 0; i < screens.length; i++) {
    const screen = screens[i];
    console.log(`\n📸 Rendering [${i + 1}/${screens.length}]: ${screen.id} - "${screen.title}"...`);

    // Android (1080 x 1920) — Standard 9:16 Aspect Ratio
    const androidHtml = buildHtmlTemplate({ screen, width: 1080, height: 1920 });
    const androidHtmlPath = path.join(tempHtmlDir, `${screen.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${screen.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');

    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, {
      stdio: 'pipe'
    });
    console.log(`   ✓ Android (1080x1920 - 9:16): ${androidPngPath}`);

    // iOS (1290 x 2796)
    const iosHtml = buildHtmlTemplate({ screen, width: 1290, height: 2796 });
    const iosHtmlPath = path.join(tempHtmlDir, `${screen.id}_ios.html`);
    const iosPngPath = path.join(iosDir, `${screen.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');

    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=1290,2796 "${iosHtmlPath}"`, {
      stdio: 'pipe'
    });
    console.log(`   ✓ iOS (1290x2796): ${iosPngPath}`);
  }

  // 3. Generate Google Play Store Feature Graphic (1024 x 500 px)
  console.log('\n🎨 Rendering Google Play Feature Graphic (1024 x 500)...');
  const fgHtml = buildFeatureGraphicHtml();
  const fgHtmlPath = path.join(tempHtmlDir, 'feature_graphic.html');
  const fgPngPath = path.join(featureGraphicDir, 'feature_graphic.png');
  fs.writeFileSync(fgHtmlPath, fgHtml, 'utf8');

  execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${fgPngPath}" --window-size=1024,500 "${fgHtmlPath}"`, {
    stdio: 'pipe'
  });
  console.log(`   ✓ Google Play Feature Graphic (1024x500): ${fgPngPath}`);

  console.log('\n🎉 ALL SCREENSHOTS & FEATURE GRAPHIC GENERATED SUCCESSFULLY!');
  console.log(`📂 iOS App Store: ${iosDir}`);
  console.log(`📂 Google Play Store: ${androidDir}`);
  console.log(`📂 Feature Graphic: ${featureGraphicDir}`);
}

runGenerator().catch(err => {
  console.error('Generator error:', err);
  process.exit(1);
});
