const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../app_store_screenshots');

// Ensure output directories exist
const tabletAndroidDir = path.join(OUTPUT_DIR, 'tablet_android');
const tabletIosDir = path.join(OUTPUT_DIR, 'tablet_ios');
fs.mkdirSync(tabletAndroidDir, { recursive: true });
fs.mkdirSync(tabletIosDir, { recursive: true });

const tabletScreens = [
  {
    id: '01_tablet_cellular_dashboard',
    badge: '🌿 CLINICAL CELLULAR HEALTH WORKSTATION',
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
    title: 'Cellular Rhythm & Defense Trajectory',
    subtitle: 'Track lifestyle stress loads against restorative cellular defenses with wide-screen clinical clarity',
    gradient: 'linear-gradient(180deg, #F0FDF4 0%, #F8FAFC 35%, #EDE9FE 100%)',
    accentColor: '#10B981',
    leftContent: `
      <!-- Cellular Balance Summary Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="width: 52px; height: 52px; border-radius: 16px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; font-size: 26px; box-shadow: 0 6px 16px rgba(16,185,129,0.25);">⚖️</div>
            <div>
              <div style="font-size: 22px; font-weight: 900; color: #0F172A;">Cellular Balance</div>
              <div style="font-size: 13px; color: #64748B; font-weight: 600;">Lifestyle Stress vs Restorative Defense</div>
            </div>
          </div>
          <span style="background: #ECFDF5; color: #047857; font-size: 13px; font-weight: 800; padding: 6px 14px; border-radius: 20px; border: 1.5px solid #A7F3D0;">🔥 7d Streak</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px;">
          <div style="background: linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%); border: 1.5px solid #86EFAC; border-radius: 20px; padding: 18px 14px; text-align: left;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 8px #10B981;"></span>
              <span style="font-size: 13px; font-weight: 900; color: #065F46; text-transform: uppercase;">Repair</span>
            </div>
            <div style="font-size: 44px; font-weight: 900; color: #059669; margin: 4px 0 2px 0; line-height: 1;">6</div>
            <div style="font-size: 13px; color: #047857; font-weight: 700;">Habits active</div>
          </div>

          <div style="background: linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%); border: 1.5px solid #FDA4AF; border-radius: 20px; padding: 18px 14px; text-align: left;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #F43F5E; box-shadow: 0 0 8px #F43F5E;"></span>
              <span style="font-size: 13px; font-weight: 900; color: #9F1239; text-transform: uppercase;">Stress</span>
            </div>
            <div style="font-size: 44px; font-weight: 900; color: #E11D48; margin: 4px 0 2px 0; line-height: 1;">2</div>
            <div style="font-size: 13px; color: #BE123C; font-weight: 700;">Triggers active</div>
          </div>

          <div style="background: linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #A5B4FC; border-radius: 20px; padding: 18px 14px; text-align: left;">
            <div style="font-size: 13px; font-weight: 900; color: #3730A3; text-transform: uppercase;">Net Margin</div>
            <div style="font-size: 44px; font-weight: 900; color: #4F46E5; margin: 4px 0 2px 0; line-height: 1;">+4</div>
            <div style="font-size: 13px; color: #4338CA; font-weight: 700;">Net Repair</div>
          </div>
        </div>
      </div>

      <!-- 7-Day Cellular Rhythm Capsules Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <div>
            <div style="font-size: 13px; font-weight: 900; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">7-Day Trajectory</div>
            <div style="font-size: 19px; font-weight: 900; color: #0F172A; margin-top: 2px;">Cellular Rhythm Capsules</div>
          </div>
          <div style="display: flex; gap: 6px; background: #F1F5F9; padding: 4px; border-radius: 12px;">
            <span style="background: white; color: #0F172A; font-size: 12px; font-weight: 900; padding: 5px 12px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">Capsules</span>
            <span style="color: #64748B; font-size: 12px; font-weight: 700; padding: 5px 10px;">Bars</span>
            <span style="color: #64748B; font-size: 12px; font-weight: 700; padding: 5px 10px;">Line</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; gap: 8px; align-items: flex-end; height: 180px; padding: 8px 0;">
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">SAT 7</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 14px; color: #CBD5E1; font-weight: 900;">—</span>
              <span style="font-size: 9px; color: #94A3B8; font-weight: 800;">Rest</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8;">•</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">SUN 8</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <span style="font-size: 14px; color: #CBD5E1; font-weight: 900;">—</span>
              <span style="font-size: 9px; color: #94A3B8; font-weight: 800;">Rest</span>
            </div>
            <div style="font-size: 11px; color: #94A3B8;">•</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">MON 9</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 3px; display: flex; align-items: flex-end; justify-content: center; gap: 3px;">
              <div style="width: 15px; height: 60%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 15px; height: 35%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+1</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">TUE 10</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 3px; display: flex; align-items: flex-end; justify-content: center; gap: 3px;">
              <div style="width: 15px; height: 45%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 15px; height: 75%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <div style="background: #FFF1F2; color: #BE123C; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">-2</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">WED 11</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 3px; display: flex; align-items: flex-end; justify-content: center; gap: 3px;">
              <div style="width: 15px; height: 80%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 15px; height: 25%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+3</div>
          </div>

          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 12px; font-weight: 800; color: #64748B;">THU 12</div>
            <div style="width: 42px; height: 110px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 3px; display: flex; align-items: flex-end; justify-content: center; gap: 3px;">
              <div style="width: 15px; height: 70%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 15px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+2</div>
          </div>

          <!-- Fri (Selected Today) -->
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%; transform: translateY(-4px);">
            <div style="font-size: 12px; font-weight: 900; color: #4F46E5;">FRI 13</div>
            <div style="width: 46px; height: 120px; border-radius: 22px; background: #EEF2FF; border: 2.5px solid #6366F1; box-shadow: 0 6px 18px rgba(99,102,241,0.25); padding: 3px; display: flex; align-items: flex-end; justify-content: center; gap: 3px;">
              <div style="width: 17px; height: 95%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 17px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 900; padding: 2px 7px; border-radius: 6px;">+4</div>
          </div>
        </div>
      </div>
    `,
    rightContent: `
      <!-- Today's Check-ins Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="font-size: 15px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Today's Check-ins (2 Logged)</div>
          <span style="font-size: 12px; font-weight: 800; color: #2563EB; background: #EFF6FF; padding: 4px 10px; border-radius: 8px;">Next in 2h</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
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

        <div style="display: flex; flex-direction: column; gap: 8px;">
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 10px 14px; border-radius: 14px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <span>🌿</span> 20m Post-Meal Walk (+1 Repair)
          </div>
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; padding: 10px 14px; border-radius: 14px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <span>🧘</span> 15m Stillness & Breath (+1 Repair)
          </div>
          <div style="background: #FFF1F2; border: 1px solid #FECDD3; color: #9F1239; padding: 10px 14px; border-radius: 14px; font-size: 13px; font-weight: 800; display: flex; align-items: center; gap: 8px;">
            <span>⚠️</span> Late Screen Time (+1 Stress)
          </div>
        </div>
      </div>

      <!-- Clinical Target Rings -->
      <div style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 28px; padding: 24px; color: white; box-shadow: 0 14px 34px rgba(15,23,42,0.12);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🎯</span>
            <span style="font-size: 15px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; color: #38BDF8;">Recovery Targets (Today)</span>
          </div>
          <span style="font-size: 12px; font-weight: 800; background: rgba(56,189,248,0.2); color: #7DD3FC; padding: 4px 10px; border-radius: 8px;">4 of 5 Complete</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 22px;">🚶</span>
            <div>
              <div style="font-size: 15px; font-weight: 900;">8,420 Steps</div>
              <div style="font-size: 11px; color: #94A3B8;">Target: 10,000</div>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 16px; display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 22px;">💧</span>
            <div>
              <div style="font-size: 15px; font-weight: 900;">2.4L Water</div>
              <div style="font-size: 11px; color: #94A3B8;">Target: 3.0L</div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '02_tablet_cgm_and_nutrition',
    badge: '📈 METABOLIC INTELLIGENCE & AI NUTRITION',
    badgeColor: '#7C3AED',
    badgeBg: '#F5F3FF',
    title: 'Continuous Glucose Sync & AI Food Logger',
    subtitle: 'Abbott FreeStyle Libre real-time curve analysis paired with instant macro scanning',
    gradient: 'linear-gradient(180deg, #F5F3FF 0%, #F8FAFC 35%, #EDE9FE 100%)',
    accentColor: '#7C3AED',
    leftContent: `
      <!-- Continuous Glucose Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 18px; font-weight: 900; color: #0F172A;">24-Hour Continuous Trace</div>
            <div style="font-size: 12px; color: #64748B;">Target Range: 70 – 140 mg/dL</div>
          </div>
          <div style="font-size: 13px; font-weight: 900; color: #059669; background: #ECFDF5; padding: 6px 14px; border-radius: 10px; border: 1px solid #A7F3D0;">
            Avg: 98 mg/dL
          </div>
        </div>

        <svg viewBox="0 0 500 170" style="width: 100%; height: 160px; overflow: visible;">
          <defs>
            <linearGradient id="tabCgmGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="35" width="500" height="90" fill="#10B981" fill-opacity="0.08" rx="10"/>
          <line x1="0" y1="35" x2="500" y2="35" stroke="#F59E0B" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
          <line x1="0" y1="125" x2="500" y2="125" stroke="#10B981" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
          
          <path d="M 0 100 Q 70 95, 120 75 T 220 58 T 310 115 T 400 82 T 500 88 L 500 160 L 0 160 Z" fill="url(#tabCgmGrad)"/>
          <path d="M 0 100 Q 70 95, 120 75 T 220 58 T 310 115 T 400 82 T 500 88" fill="none" stroke="#7C3AED" stroke-width="4.5" stroke-linecap="round"/>
          
          <circle cx="220" cy="58" r="7" fill="#7C3AED" stroke="#FFFFFF" stroke-width="3"/>
          <text x="220" y="42" text-anchor="middle" font-size="12" font-weight="900" fill="#7C3AED">Peak 124 mg/dL</text>
          
          <circle cx="310" cy="115" r="6" fill="#10B981" stroke="#FFFFFF" stroke-width="3"/>
          <text x="310" y="138" text-anchor="middle" font-size="11" font-weight="900" fill="#059669">Fasting 86</text>
        </svg>

        <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #94A3B8; margin-top: 10px;">
          <span>12 AM</span>
          <span>4 AM</span>
          <span>8 AM</span>
          <span>12 PM</span>
          <span>4 PM</span>
          <span>8 PM</span>
          <span>NOW</span>
        </div>
      </div>

      <!-- Quick Metrics 4-Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px;">
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase;">In Range</div>
          <div style="font-size: 26px; font-weight: 900; color: #059669; margin-top: 3px;">94%</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase;">Average</div>
          <div style="font-size: 26px; font-weight: 900; color: #7C3AED; margin-top: 3px;">98</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase;">Est. HbA1c</div>
          <div style="font-size: 26px; font-weight: 900; color: #2563EB; margin-top: 3px;">5.1%</div>
        </div>
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 18px; padding: 14px 8px; text-align: center; box-shadow: 0 6px 16px rgba(0,0,0,0.04);">
          <div style="font-size: 11px; color: #64748B; font-weight: 800; text-transform: uppercase;">Variability</div>
          <div style="font-size: 26px; font-weight: 900; color: #10B981; margin-top: 3px;">12%</div>
        </div>
      </div>
    `,
    rightContent: `
      <!-- Camera Food Scanner Hero Card -->
      <div style="background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%); border-radius: 28px; padding: 26px; color: white; box-shadow: 0 14px 34px rgba(37,99,235,0.25); margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="background: rgba(255,255,255,0.22); backdrop-blur-md; font-size: 12px; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase;">
            📸 AI Food Scanner
          </div>
          <div style="font-size: 13px; font-weight: 700; color: #BFDBFE;">Instant Calorie & Macro AI</div>
        </div>
        <div style="font-size: 24px; font-weight: 900; margin-bottom: 6px;">Grilled Salmon Quinoa Bowl</div>
        <div style="font-size: 14px; color: #DBEAFE; line-height: 1.45; margin-bottom: 16px;">
          Detected: Atlantic salmon fillet, steamed quinoa, avocado, broccoli florets & olive oil vinaigrette.
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Calories</div>
            <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">480</div>
            <div style="font-size: 11px; color: #DBEAFE;">kcal</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Protein</div>
            <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">42g</div>
            <div style="font-size: 11px; color: #A7F3D0; font-weight: 800;">High</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Carbs</div>
            <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">34g</div>
            <div style="font-size: 11px; color: #DBEAFE;">Complex</div>
          </div>
          <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center; border: 1px solid rgba(255,255,255,0.25);">
            <div style="font-size: 11px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Fiber</div>
            <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">12g</div>
            <div style="font-size: 11px; color: #A7F3D0; font-weight: 800;">Rich</div>
          </div>
        </div>
      </div>

      <!-- Glycemic Impact Forecast Card -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 16px; font-weight: 900; color: #0F172A;">Glycemic Impact Forecast</div>
          <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px; border: 1px solid #A7F3D0;">
            ✓ Safe Zone
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ECFDF5; border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; color: #059669;">
            98
          </div>
          <div style="flex: 1;">
            <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Expected Peak: 114 mg/dL (+16 mg/dL)</div>
            <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Healthy protein and soluble fiber buffer glucose absorption perfectly.</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '03_tablet_specialist_consult_and_autophagy',
    badge: '👩‍⚕️ CLINICAL ONCOLOGY & FASTING PROTOCOLS',
    badgeColor: '#0284C7',
    badgeBg: '#F0F9FF',
    title: 'Specialist Oncology Care & Fasting Autophagy',
    subtitle: 'Direct video consultations with Dr. Krithikaa Sekar MD and circadian recovery protocols',
    gradient: 'linear-gradient(180deg, #F0F9FF 0%, #F8FAFC 35%, #E0F2FE 100%)',
    accentColor: '#0284C7',
    leftContent: `
      <!-- Doctor Profile Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 20px;">
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
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase;">Clinical Focus</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Radiation Oncology</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Metabolic Fasting</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Active Cancer Care</span>
            <span style="background: white; border: 1px solid #CBD5E1; color: #334155; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">Mitophagy Protocols</span>
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

      <!-- Verified Digital Prescription Sample -->
      <div style="background: white; border-radius: 28px; padding: 22px 24px; border: 2px solid #E2E8F0; box-shadow: 0 14px 34px rgba(15,23,42,0.06);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <div style="font-size: 13px; font-weight: 900; color: #0284C7;">℞ DIGITAL TELEMEDICINE PRESCRIPTION</div>
          <div style="font-size: 12px; color: #0284C7; font-weight: 800; background: #E0F2FE; padding: 3px 10px; border-radius: 8px;">RX-2ADD3BA3</div>
        </div>
        <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin-bottom: 4px;">Cellular Protective Protocol & Targeted Regimen</div>
        <div style="font-size: 12px; color: #64748B; line-height: 1.45;">
          Curcumin + Piperine dosing, 16:8 circadian feeding window, and targeted mitochondrial antioxidant schedule.
        </div>
      </div>
    `,
    rightContent: `
      <!-- Intermittent Fasting Window Card -->
      <div style="background: white; border-radius: 28px; padding: 26px; box-shadow: 0 14px 34px rgba(15,23,42,0.06); border: 2px solid #E2E8F0; margin-bottom: 20px;">
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

      <!-- Vagus Nerve Breathwork Calmer -->
      <div style="background: linear-gradient(135deg, #312E81 0%, #4338CA 100%); border-radius: 28px; padding: 24px; color: white; box-shadow: 0 14px 32px rgba(67,56,202,0.25);">
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
    `
  }
];

function buildTabletHtml({ screen, width, height }) {
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
      padding-top: 60px;
    }

    /* Ambient background glow */
    .glow-bg {
      position: absolute;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 1400px;
      height: 1400px;
      background: radial-gradient(circle, ${screen.accentColor}25 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    /* Marketing Header Section */
    .header-box {
      position: relative;
      z-index: 10;
      text-align: center;
      max-width: 1400px;
      padding: 0 40px;
      margin-bottom: 36px;
    }

    .badge {
      display: inline-block;
      padding: 10px 26px;
      background: ${screen.badgeBg};
      color: ${screen.badgeColor};
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 1.5px;
      border-radius: 40px;
      margin-bottom: 14px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.04);
      border: 1.5px solid rgba(0,0,0,0.06);
    }

    .headline {
      font-size: 58px;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1px;
      margin-bottom: 12px;
    }

    .subheadline {
      font-size: 24px;
      font-weight: 600;
      color: #475569;
      line-height: 1.35;
      max-width: 1100px;
      margin: 0 auto;
    }

    /* Tablet Device Frame */
    .tablet-container {
      position: relative;
      z-index: 10;
      width: ${width > 1800 ? '1840px' : '1460px'};
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .tablet-body {
      width: 100%;
      height: 100%;
      background: #0B0F19;
      border-radius: 54px 54px 0 0;
      padding: 20px 20px 0 20px;
      box-shadow: 
        0 -20px 80px rgba(15, 23, 42, 0.25),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.4);
      border: 4px solid #1E293B;
      border-bottom: none;
      display: flex;
      flex-direction: column;
    }

    .tablet-screen {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      border-radius: 40px 40px 0 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
      border: 1px solid rgba(0,0,0,0.06);
    }

    /* Tablet App Header */
    .tablet-nav {
      padding: 16px 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.94);
      backdrop-blur-md: 10px;
      border-bottom: 1.5px solid #E2E8F0;
    }

    .tablet-logo {
      font-size: 24px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .tablet-logo span { color: #2563EB; }

    /* Wide 2-Column Content Grid */
    .tablet-grid {
      padding: 28px 36px 0 36px;
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      overflow: hidden;
    }

    /* Pinned Tablet Bottom Navigation Bar */
    .tablet-bottom-nav {
      height: 85px;
      background: white;
      border-top: 1.5px solid #E2E8F0;
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding-bottom: 12px;
      box-shadow: 0 -6px 24px rgba(0,0,0,0.04);
      z-index: 20;
    }

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #94A3B8;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      gap: 3px;
    }
    .tab-item.active {
      color: #2563EB;
      font-weight: 900;
    }
  </style>
</head>
<body>
  <div class="glow-bg"></div>

  <div class="header-box">
    <div class="badge">${screen.badge}</div>
    <h1 class="headline">${screen.title}</h1>
    <p class="subheadline">${screen.subtitle}</p>
  </div>

  <div class="tablet-container">
    <div class="tablet-body">
      <div class="tablet-screen">
        <!-- Tablet Top Bar -->
        <div class="tablet-nav">
          <div class="tablet-logo">Mito<span>Reboot</span> <span style="font-size: 13px; font-weight: 800; color: #64748B; margin-left: 10px; text-transform: uppercase; letter-spacing: 0.5px;">Tablet Workstation</span></div>
          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="background: #ECFDF5; color: #047857; font-size: 12px; font-weight: 800; padding: 6px 14px; border-radius: 20px; border: 1.5px solid #A7F3D0; display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span> Sensor Active
            </div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #EEF2FF; display: flex; align-items: center; justify-content: center; font-size: 18px;">🔔</div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #2563EB; color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900;">SK</div>
          </div>
        </div>

        <!-- 2-Column Wide Tablet Grid -->
        <div class="tablet-grid">
          <div>${screen.leftContent}</div>
          <div>${screen.rightContent}</div>
        </div>

        <!-- Tablet Bottom Nav -->
        <div class="tablet-bottom-nav">
          <div class="tab-item active">
            <span>🏠</span>
            <span>Home</span>
          </div>
          <div class="tab-item">
            <span>📖</span>
            <span>Learn</span>
          </div>
          <div class="tab-item">
            <span>📅</span>
            <span>Book Appt</span>
          </div>
          <div class="tab-item">
            <span>🛍️</span>
            <span>Shop</span>
          </div>
          <div class="tab-item">
            <span>👤</span>
            <span>Profile</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function runTabletGenerator() {
  console.log('🚀 Generating High-Res Tablet Assets for Google Play (7" & 10") and Apple iPad...');

  const tempHtmlDir = path.join('/tmp', 'mitoreboot_tablet_screenshots_html');
  fs.mkdirSync(tempHtmlDir, { recursive: true });

  for (let i = 0; i < tabletScreens.length; i++) {
    const screen = tabletScreens[i];
    console.log(`\n📸 Rendering Tablet Asset [${i + 1}/${tabletScreens.length}]: ${screen.id}...`);

    // 1. Android Google Play 7-inch & 10-inch Tablet (1600 x 2560 - 10:16)
    const androidHtml = buildTabletHtml({ screen, width: 1600, height: 2560 });
    const androidHtmlPath = path.join(tempHtmlDir, `${screen.id}_android.html`);
    const androidPngPath = path.join(tabletAndroidDir, `${screen.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');

    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1600,2560 "${androidHtmlPath}"`, {
      stdio: 'pipe'
    });
    console.log(`   ✓ Google Play 7" & 10" Tablet (1600x2560): ${androidPngPath}`);

    // 2. Apple iPad Pro 12.9" Retina (2048 x 2732 - 3:4)
    const iosHtml = buildTabletHtml({ screen, width: 2048, height: 2732 });
    const iosHtmlPath = path.join(tempHtmlDir, `${screen.id}_ios.html`);
    const iosPngPath = path.join(tabletIosDir, `${screen.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');

    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=2048,2732 "${iosHtmlPath}"`, {
      stdio: 'pipe'
    });
    console.log(`   ✓ Apple iPad Pro 12.9" (2048x2732): ${iosPngPath}`);
  }

  console.log('\n🎉 ALL TABLET ASSETS GENERATED SUCCESSFULLY!');
  console.log(`📂 Android Google Play Tablet Assets: ${tabletAndroidDir}`);
  console.log(`📂 Apple iPad Pro Tablet Assets: ${tabletIosDir}`);
}

runTabletGenerator().catch(err => {
  console.error('Tablet generator error:', err);
  process.exit(1);
});

