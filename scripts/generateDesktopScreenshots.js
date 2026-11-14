const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.join(__dirname, '../app_store_screenshots');

// Ensure desktop output directory exists
const desktopDir = path.join(OUTPUT_DIR, 'desktop');
fs.mkdirSync(desktopDir, { recursive: true });

const desktopScreens = [
  {
    id: '01_desktop_cellular_dashboard',
    badge: '🌿 MITOREBOOT CLINICAL WORKSTATION',
    badgeColor: '#059669',
    badgeBg: '#ECFDF5',
    title: 'Cellular Rhythm & Defense Trajectory',
    subtitle: 'Track lifestyle stress load vs restorative cellular defenses in high-resolution desktop view',
    gradient: 'linear-gradient(135deg, #0B0F19 0%, #111827 50%, #0F172A 100%)',
    accentColor: '#10B981',
    activeNav: 'Cellular Balance',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <!-- Card 1: Balance Summary -->
        <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 44px; height: 44px; border-radius: 14px; background: #ECFDF5; display: flex; align-items: center; justify-content: center; font-size: 22px;">⚖️</div>
              <div>
                <div style="font-size: 17px; font-weight: 900; color: #0F172A;">Cellular Balance</div>
                <div style="font-size: 11px; color: #64748B; font-weight: 600;">Dual-Force Tracking</div>
              </div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 12px; border: 1px solid #A7F3D0;">🔥 7d Streak</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 16px; padding: 12px 10px; text-align: left;">
              <div style="font-size: 10px; font-weight: 900; color: #065F46; text-transform: uppercase;">Repair</div>
              <div style="font-size: 32px; font-weight: 900; color: #059669; margin: 2px 0;">6</div>
              <div style="font-size: 10px; color: #047857; font-weight: 700;">Active</div>
            </div>
            <div style="background: #FFF1F2; border: 1px solid #FDA4AF; border-radius: 16px; padding: 12px 10px; text-align: left;">
              <div style="font-size: 10px; font-weight: 900; color: #9F1239; text-transform: uppercase;">Stress</div>
              <div style="font-size: 32px; font-weight: 900; color: #E11D48; margin: 2px 0;">2</div>
              <div style="font-size: 10px; color: #BE123C; font-weight: 700;">Active</div>
            </div>
            <div style="background: #EEF2FF; border: 1px solid #A5B4FC; border-radius: 16px; padding: 12px 10px; text-align: left;">
              <div style="font-size: 10px; font-weight: 900; color: #3730A3; text-transform: uppercase;">Net</div>
              <div style="font-size: 32px; font-weight: 900; color: #4F46E5; margin: 2px 0;">+4</div>
              <div style="font-size: 10px; color: #4338CA; font-weight: 700;">Margin</div>
            </div>
          </div>
        </div>

        <!-- Card 2: Fasting Autophagy Protocol -->
        <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Circadian Fasting Window</div>
            <span style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 10px;">⚡ Autophagy Active</span>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-around; padding: 4px 0;">
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase;">Started</div>
              <div style="font-size: 18px; font-weight: 900; color: #0F172A;">8:00 PM</div>
            </div>
            <div style="position: relative; width: 90px; height: 90px; border-radius: 50%; background: conic-gradient(#4F46E5 0% 88%, #EEF2FF 88% 100%); display: flex; align-items: center; justify-content: center;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 16px; font-weight: 900; color: #4F46E5;">14h 22m</span>
                <span style="font-size: 7.5px; font-weight: 800; color: #10B981;">Autophagy</span>
              </div>
            </div>
            <div style="text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 700; text-transform: uppercase;">Goal</div>
              <div style="font-size: 18px; font-weight: 900; color: #0F172A;">16h 00m</div>
            </div>
          </div>
        </div>

        <!-- Card 3: Today's Restorative Targets -->
        <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Daily Health Targets</div>
            <span style="background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 8px;">4 of 5 Complete</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🚶</span>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: #0F172A;">8,420</div>
                <div style="font-size: 9px; color: #64748B;">Steps Logged</div>
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">💧</span>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: #0F172A;">2.4L</div>
                <div style="font-size: 9px; color: #64748B;">Water Intake</div>
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🧘</span>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: #0F172A;">15m</div>
                <div style="font-size: 9px; color: #64748B;">Vagus Breath</div>
              </div>
            </div>
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 10px 12px; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 18px;">🌙</span>
              <div>
                <div style="font-size: 13px; font-weight: 900; color: #0F172A;">7h 45m</div>
                <div style="font-size: 9px; color: #64748B;">Deep Sleep</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 7-Day Trajectory Capsules Wide Banner -->
      <div style="background: white; border-radius: 24px; padding: 22px 28px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <div style="font-size: 11px; font-weight: 900; color: #64748B; text-transform: uppercase;">7-Day Trajectory Analysis</div>
            <div style="font-size: 18px; font-weight: 900; color: #0F172A;">Weekly Cellular Rhythm & Restorative Defenses</div>
          </div>
          <div style="display: flex; gap: 6px; background: #F1F5F9; padding: 4px; border-radius: 10px;">
            <span style="background: white; color: #0F172A; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 6px;">Capsules</span>
            <span style="color: #64748B; font-size: 11px; font-weight: 700; padding: 4px 10px;">Bars</span>
            <span style="color: #64748B; font-size: 11px; font-weight: 700; padding: 4px 10px;">Line</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 160px; padding: 8px 0;">
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">SAT 7</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94A3B8; font-weight: 800;">REST</div>
            <span style="font-size: 10px; color: #94A3B8;">•</span>
          </div>

          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">SUN 8</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F8FAFC; border: 1.5px dashed #CBD5E1; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #94A3B8; font-weight: 800;">REST</div>
            <span style="font-size: 10px; color: #94A3B8;">•</span>
          </div>

          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">MON 9</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 60%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 16px; height: 35%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+1</span>
          </div>

          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">TUE 10</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 45%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 16px; height: 75%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <span style="background: #FFF1F2; color: #BE123C; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">-2</span>
          </div>

          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">WED 11</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 80%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 16px; height: 25%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+3</span>
          </div>

          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B;">THU 12</div>
            <div style="width: 48px; height: 95px; border-radius: 20px; background: #F1F5F9; border: 1px solid #E2E8F0; padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 16px; height: 70%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 16px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">+2</span>
          </div>

          <!-- Selected Friday -->
          <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: space-between; height: 100%;">
            <div style="font-size: 11px; font-weight: 900; color: #4F46E5;">FRI 13</div>
            <div style="width: 52px; height: 105px; border-radius: 22px; background: #EEF2FF; border: 2.5px solid #6366F1; box-shadow: 0 6px 16px rgba(99,102,241,0.25); padding: 4px; display: flex; align-items: flex-end; justify-content: center; gap: 4px;">
              <div style="width: 18px; height: 95%; background: linear-gradient(180deg, #10B981, #059669); border-radius: 8px;"></div>
              <div style="width: 18px; height: 40%; background: linear-gradient(180deg, #F43F5E, #E11D48); border-radius: 8px;"></div>
            </div>
            <span style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 900; padding: 2px 7px; border-radius: 6px; border: 1px solid #A7F3D0;">+4</span>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '02_desktop_cgm_and_clinical_care',
    badge: '📈 METABOLIC INTELLIGENCE & TELEMEDICINE',
    badgeColor: '#7C3AED',
    badgeBg: '#F5F3FF',
    title: 'Continuous Glucose Trace & Specialist Care',
    subtitle: 'Abbott FreeStyle Libre real-time syncing and oncologist video consultations',
    gradient: 'linear-gradient(135deg, #0B0F19 0%, #1E1B4B 50%, #0F172A 100%)',
    accentColor: '#7C3AED',
    activeNav: 'CGM Analysis',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px;">
        <!-- Left: CGM Curve & Metrics -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Live Sensor Card -->
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <div style="font-size: 16px; font-weight: 900; color: #0F172A;">24-Hour Continuous Trace</div>
                <div style="font-size: 11px; color: #64748B;">Target Range: 70 – 140 mg/dL</div>
              </div>
              <div style="font-size: 12px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 8px; border: 1px solid #A7F3D0;">
                Avg: 98 mg/dL
              </div>
            </div>

            <svg viewBox="0 0 500 160" style="width: 100%; height: 150px; overflow: visible;">
              <defs>
                <linearGradient id="deskCgmGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4"/>
                  <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="35" width="500" height="85" fill="#10B981" fill-opacity="0.08" rx="10"/>
              <line x1="0" y1="35" x2="500" y2="35" stroke="#F59E0B" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
              <line x1="0" y1="120" x2="500" y2="120" stroke="#10B981" stroke-dasharray="5 5" stroke-width="1.5" opacity="0.6"/>
              
              <path d="M 0 95 Q 70 90, 120 72 T 220 54 T 310 110 T 400 78 T 500 84 L 500 150 L 0 150 Z" fill="url(#deskCgmGrad)"/>
              <path d="M 0 95 Q 70 90, 120 72 T 220 54 T 310 110 T 400 78 T 500 84" fill="none" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
              
              <circle cx="220" cy="54" r="6" fill="#7C3AED" stroke="#FFFFFF" stroke-width="2.5"/>
              <text x="220" y="40" text-anchor="middle" font-size="11" font-weight="900" fill="#7C3AED">Peak 124 mg/dL</text>
              
              <circle cx="310" cy="110" r="5" fill="#10B981" stroke="#FFFFFF" stroke-width="2.5"/>
              <text x="310" y="130" text-anchor="middle" font-size="10" font-weight="900" fill="#059669">Fasting 86</text>
            </svg>

            <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #94A3B8; margin-top: 8px;">
              <span>12 AM</span>
              <span>4 AM</span>
              <span>8 AM</span>
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
              <span>NOW</span>
            </div>
          </div>

          <!-- 4-Grid Metrics -->
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px;">
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 800;">IN RANGE</div>
              <div style="font-size: 24px; font-weight: 900; color: #059669; margin-top: 2px;">94%</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 800;">AVERAGE</div>
              <div style="font-size: 24px; font-weight: 900; color: #7C3AED; margin-top: 2px;">98</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 800;">EST. HBA1C</div>
              <div style="font-size: 24px; font-weight: 900; color: #2563EB; margin-top: 2px;">5.1%</div>
            </div>
            <div style="background: white; border: 1px solid #E2E8F0; border-radius: 18px; padding: 12px; text-align: center;">
              <div style="font-size: 10px; color: #64748B; font-weight: 800;">VARIABILITY</div>
              <div style="font-size: 24px; font-weight: 900; color: #10B981; margin-top: 2px;">12%</div>
            </div>
          </div>
        </div>

        <!-- Right: Doctor Teleconsultation Card -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 14px;">
              <div style="width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, #0284C7, #38BDF8); display: flex; align-items: center; justify-content: center; font-size: 32px; color: white;">
                👩‍⚕️
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span style="font-size: 18px; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar</span>
                  <span style="background: #E0F2FE; color: #0369A1; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">✓ Verified MD</span>
                </div>
                <div style="font-size: 12px; color: #0284C7; font-weight: 800; margin-top: 2px;">
                  Radiation Oncology MD • 12+ Yrs Clinical Experience
                </div>
                <div style="font-size: 11px; color: #64748B;">Mito Reboot Specialist Panel • Basavanagudi</div>
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 12px; margin-bottom: 14px;">
              <div style="font-size: 10px; font-weight: 800; color: #475569; text-transform: uppercase;">Next Available Slot</div>
              <div style="font-size: 13px; font-weight: 800; color: #0284C7; margin-top: 2px;">Today, 4:30 PM (Video Consultation)</div>
            </div>

            <button style="width: 100%; background: #0284C7; color: white; border: none; padding: 12px; border-radius: 14px; font-size: 13px; font-weight: 800; box-shadow: 0 4px 12px rgba(2,132,199,0.25);">
              📹 Reserve Video Consultation
            </button>
          </div>

          <!-- Digital Prescription Preview -->
          <div style="background: white; border-radius: 24px; padding: 20px; border: 1.5px solid #E2E8F0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 12px; font-weight: 900; color: #0284C7;">℞ TELEMEDICINE PROTOCOL</div>
              <div style="font-size: 10px; color: #64748B; font-weight: 800;">RX-2ADD3BA3</div>
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #0F172A; margin-bottom: 4px;">Cellular Protective Protocol & Targeted Lifestyle Regimen</div>
            <div style="font-size: 11px; color: #64748B; line-height: 1.4;">Personalized Curcumin, 16:8 circadian window, and mitochondrial antioxidants.</div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '03_desktop_ai_food_and_nutrition',
    badge: '🥗 AI FOOD SCANNER & MACROS',
    badgeColor: '#2563EB',
    badgeBg: '#EFF6FF',
    title: 'AI Food Scanner & Glycemic Forecasting',
    subtitle: 'Instant meal photo recognition, macronutrient breakdown, and doctor-endorsed pairings',
    gradient: 'linear-gradient(135deg, #0B0F19 0%, #1E3A8A 50%, #0F172A 100%)',
    accentColor: '#2563EB',
    activeNav: 'AI Food Log',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Left: AI Food Camera Hero -->
        <div style="background: linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%); border-radius: 24px; padding: 26px; color: white; box-shadow: 0 10px 30px rgba(37,99,235,0.25);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
            <div style="background: rgba(255,255,255,0.2); backdrop-blur-md; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 20px; text-transform: uppercase;">
              📸 AI Food Lens
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #BFDBFE;">Instant Calorie & Macro AI</div>
          </div>
          <div style="font-size: 24px; font-weight: 900; margin-bottom: 6px;">Grilled Salmon Quinoa Bowl</div>
          <div style="font-size: 13px; color: #DBEAFE; line-height: 1.45; margin-bottom: 20px;">
            Detected: Atlantic salmon fillet, steamed quinoa, avocado, broccoli florets & extra virgin olive oil vinaigrette.
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
            <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 10px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Calories</div>
              <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">480</div>
              <div style="font-size: 10px; color: #DBEAFE;">kcal</div>
            </div>
            <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 10px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Protein</div>
              <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">42g</div>
              <div style="font-size: 10px; color: #A7F3D0; font-weight: 800;">High</div>
            </div>
            <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 10px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Carbs</div>
              <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">34g</div>
              <div style="font-size: 10px; color: #DBEAFE;">Complex</div>
            </div>
            <div style="background: rgba(255,255,255,0.18); border-radius: 16px; padding: 12px 8px; text-align: center;">
              <div style="font-size: 10px; text-transform: uppercase; color: #BFDBFE; font-weight: 800;">Fiber</div>
              <div style="font-size: 22px; font-weight: 900; margin-top: 3px;">12g</div>
              <div style="font-size: 10px; color: #A7F3D0; font-weight: 800;">Rich</div>
            </div>
          </div>
        </div>

        <!-- Right: Glycemic Forecast & Meals -->
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Glycemic Impact Card -->
          <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="font-size: 16px; font-weight: 900; color: #0F172A;">Glycemic Impact Forecast</div>
              <div style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 8px;">
                ✓ Safe Zone
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 60px; height: 60px; border-radius: 50%; background: #ECFDF5; border: 3px solid #10B981; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; color: #059669;">
                98
              </div>
              <div style="flex: 1;">
                <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Expected Peak: 114 mg/dL (+16 mg/dL)</div>
                <div style="font-size: 12px; color: #64748B; margin-top: 2px;">Healthy protein and soluble fiber buffer glucose absorption perfectly.</div>
              </div>
            </div>
          </div>

          <!-- Doctor Endorsed Pairings -->
          <div style="background: white; border-radius: 24px; padding: 20px; border: 1.5px solid #E2E8F0;">
            <div style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; margin-bottom: 10px;">Doctor-Endorsed Pairings</div>
            <div style="display: flex; gap: 10px;">
              <div style="flex: 1; padding: 12px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 12px; font-size: 12px; font-weight: 800; color: #065F46;">
                🥗 Sprouted Fenugreek (-14% Spike)
              </div>
              <div style="flex: 1; padding: 12px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; font-size: 12px; font-weight: 800; color: #1E40AF;">
                🚶 10m Post-Meal Walk (Blunter)
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '04_desktop_educational_masterclasses',
    badge: '🎙️ ONCOLOGY & WELLNESS LIBRARY',
    badgeColor: '#D97706',
    badgeBg: '#FEF3C7',
    title: 'Curated Oncology Masterclasses & Audio Podcasts',
    subtitle: '57+ scientific lessons, mitochondrial research, and expert lifestyle protocols',
    gradient: 'linear-gradient(135deg, #0B0F19 0%, #3B2A0F 50%, #0F172A 100%)',
    accentColor: '#D97706',
    activeNav: 'Masterclasses',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px;">
        <!-- Left: Hero Masterclass Video -->
        <div style="background: white; border-radius: 24px; padding: 26px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="font-size: 18px; font-weight: 900; color: #0F172A;">Clinical Knowledge Hub</div>
            <div style="background: #EFF6FF; color: #1D4ED8; font-size: 12px; font-weight: 800; padding: 4px 12px; border-radius: 10px;">57 Masterclasses</div>
          </div>

          <div style="display: flex; gap: 8px; margin-bottom: 18px;">
            <span style="background: #0F172A; color: white; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">All (57)</span>
            <span style="background: #FFF1F2; color: #BE123C; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">🔥 Damage Load</span>
            <span style="background: #ECFDF5; color: #047857; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 12px;">🌿 Repair Defenses</span>
          </div>

          <div style="background: #FFFBEB; border: 1.5px solid #FDE68A; border-radius: 20px; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase;">Topic #1 • Cortisol & Inflammation</div>
              <div style="background: #FEF3C7; color: #92400E; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 6px;">👑 PRO Masterclass</div>
            </div>
            <div style="font-size: 17px; font-weight: 900; color: #78350F; margin-bottom: 6px;">
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

        <!-- Right: Curated Oncology Episodes -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="font-size: 11px; font-weight: 800; color: #BE123C; text-transform: uppercase;">Topic #2 • Sleep Debt & Glymphatics</div>
            <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin: 4px 0;">Circadian Melatonin & Cellular DNA Repair</div>
            <div style="font-size: 12px; color: #64748B; margin-bottom: 8px;">Understanding deep REM sleep triggers and mitochondrial waste elimination.</div>
            <span style="background: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">👑 PRO Masterclass</span>
          </div>

          <div style="background: white; border-radius: 24px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="font-size: 11px; font-weight: 800; color: #059669; text-transform: uppercase;">Topic #3 • Metabolic Oncology</div>
            <div style="font-size: 15px; font-weight: 900; color: #0F172A; margin: 4px 0;">Basal Insulin Control vs Fasting Glucose Spikes</div>
            <div style="font-size: 12px; color: #64748B; margin-bottom: 8px;">Targeting glucose transporters and suppressing metabolic inflammation.</div>
            <span style="background: #ECFDF5; color: #047857; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">Free Access</span>
          </div>
        </div>
      </div>
    `
  }
];

function buildDesktopHtml({ screen }) {
  const navItems = [
    { name: 'Cellular Balance', icon: '⚖️' },
    { name: 'CGM Analysis', icon: '📈' },
    { name: 'AI Food Log', icon: '🥗' },
    { name: 'Consultations', icon: '👩‍⚕️' },
    { name: 'Masterclasses', icon: '🎙️' },
    { name: 'Profile & Settings', icon: '⚙️' }
  ];

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
      width: 1920px;
      height: 1080px;
      background: ${screen.gradient};
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding: 36px 48px;
      color: white;
    }

    /* Ambient background glow */
    .glow-1 {
      position: absolute;
      top: -200px;
      left: 100px;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, ${screen.accentColor}30 0%, transparent 70%);
      pointer-events: none;
      filter: blur(60px);
    }

    /* Header Bar */
    .top-header {
      position: relative;
      z-index: 10;
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .badge {
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
      color: ${screen.accentColor};
    }

    .headline {
      font-size: 34px;
      font-weight: 900;
      line-height: 1.2;
      letter-spacing: -0.5px;
      color: #FFFFFF;
      margin-top: 6px;
    }

    /* Desktop Window Wrapper */
    .desktop-window {
      position: relative;
      z-index: 10;
      width: 100%;
      flex: 1;
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 
        0 25px 60px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.15);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      color: #0F172A;
    }

    /* Window Title Bar */
    .window-titlebar {
      height: 48px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      padding: 0 18px;
      gap: 14px;
    }

    .window-dots {
      display: flex;
      gap: 8px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }
    .dot-red { background: #EF4444; }
    .dot-yellow { background: #F59E0B; }
    .dot-green { background: #10B981; }

    .window-url {
      flex: 1;
      max-width: 500px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #64748B;
      gap: 6px;
    }

    /* Window Main Body: Sidebar + Main Content */
    .window-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* Sidebar Navigation */
    .window-sidebar {
      width: 240px;
      background: #F8FAFC;
      border-right: 1px solid #E2E8F0;
      padding: 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sidebar-brand {
      font-size: 18px;
      font-weight: 900;
      color: #0F172A;
      margin-bottom: 18px;
      padding-left: 8px;
    }
    .sidebar-brand span { color: #2563EB; }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 800;
      color: #64748B;
      cursor: pointer;
    }
    .sidebar-item.active {
      background: #EFF6FF;
      color: #2563EB;
      font-weight: 900;
    }

    /* Main Content Area */
    .window-content {
      flex: 1;
      padding: 24px 28px;
      background: #F1F5F9;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="glow-1"></div>

  <div class="top-header">
    <div>
      <div class="badge">${screen.badge}</div>
      <h1 class="headline">${screen.title}</h1>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 14px; font-weight: 800; color: #94A3B8;">Chromebook & Desktop Web Portal</div>
      <div style="font-size: 12px; color: #64748B; margin-top: 2px;">app.mitoreboot.in • 100% Cloud Synced</div>
    </div>
  </div>

  <div class="desktop-window">
    <!-- Window Bar -->
    <div class="window-titlebar">
      <div class="window-dots">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
      </div>
      <div class="window-url">
        <span>🔒</span> https://app.mitoreboot.in/clinical-portal
      </div>
      <div style="font-size: 12px; font-weight: 800; color: #047857; background: #ECFDF5; padding: 3px 8px; border-radius: 6px;">
        ● Connected
      </div>
    </div>

    <!-- Window Body -->
    <div class="window-body">
      <!-- Left Sidebar -->
      <div class="window-sidebar">
        <div class="sidebar-brand">Mito<span>Reboot</span></div>
        ${navItems.map(item => `
          <div class="sidebar-item ${item.name === screen.activeNav ? 'active' : ''}">
            <span>${item.icon}</span>
            <span>${item.name}</span>
          </div>
        `).join('')}
      </div>

      <!-- Main Portal Content -->
      <div class="window-content">
        ${screen.contentHtml}
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function runDesktopGenerator() {
  console.log('🚀 Generating 4 High-Res Desktop / Chromebook (1920 x 1080) Assets...');

  const tempHtmlDir = path.join('/tmp', 'mitoreboot_desktop_screenshots_html');
  fs.mkdirSync(tempHtmlDir, { recursive: true });

  for (let i = 0; i < desktopScreens.length; i++) {
    const screen = desktopScreens[i];
    console.log(`\n📸 Rendering Desktop Asset [${i + 1}/${desktopScreens.length}]: ${screen.id}...`);

    const html = buildDesktopHtml({ screen });
    const htmlPath = path.join(tempHtmlDir, `${screen.id}.html`);
    const pngPath = path.join(desktopDir, `${screen.id}.png`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${pngPath}" --window-size=1920,1080 "${htmlPath}"`, {
      stdio: 'pipe'
    });
    console.log(`   ✓ Desktop (1920x1080): ${pngPath}`);
  }

  console.log('\n🎉 ALL 4 DESKTOP / CHROMEBOOK ASSETS GENERATED SUCCESSFULLY!');
  console.log(`📂 Desktop Assets Directory: ${desktopDir}`);
}

runDesktopGenerator().catch(err => {
  console.error('Desktop generator error:', err);
  process.exit(1);
});
