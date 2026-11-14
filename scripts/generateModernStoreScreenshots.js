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

fs.mkdirSync(iosDir, { recursive: true });
fs.mkdirSync(androidDir, { recursive: true });
fs.mkdirSync(featureGraphicDir, { recursive: true });
fs.mkdirSync(tabletIosDir, { recursive: true });
fs.mkdirSync(tabletAndroidDir, { recursive: true });
fs.mkdirSync(desktopDir, { recursive: true });

// ─── 1. PHONE & TABLET CORE SCREEN DEFINITIONS (HEALTHIFY MODERN AESTHETIC) ───
const modernScreens = [
  {
    id: '01_snap_food_ai_scanner',
    headline: 'Snap a Meal or a Packet<br>& Track in an Instant',
    accentColor: '#10B981',
    bgGlow: 'radial-gradient(circle at 80% 15%, rgba(16, 185, 129, 0.16) 0%, transparent 60%), radial-gradient(circle at 20% 85%, rgba(59, 130, 246, 0.1) 0%, transparent 60%)',
    contentHtml: `
      <!-- Camera Viewfinder with AI Object Detection -->
      <div style="position: relative; width: 100%; height: 100%; border-radius: 40px; overflow: hidden; background: #0F172A;">
        <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80" 
             style="width: 100%; height: 100%; object-fit: cover;" 
             alt="Food camera view" />

        <!-- Camera Header Bar -->
        <div style="position: absolute; top: 0; left: 0; right: 0; padding: 22px 26px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(180deg, rgba(0,0,0,0.6) 0%, transparent 100%); z-index: 20;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px;">←</div>
          <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.45); backdrop-filter: blur(10px); padding: 8px 18px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.2);">
            <span style="font-size: 16px;">📸</span>
            <span style="color: white; font-weight: 800; font-size: 14px;">Snap Food</span>
          </div>
          <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">⚡</div>
        </div>

        <!-- AR Bounding Box with Floating Badges -->
        <div style="position: absolute; top: 35%; left: 14%; width: 72%; height: 38%; border: 3px solid rgba(255,255,255,0.95); border-radius: 32px; box-shadow: 0 0 0 1px rgba(0,0,0,0.3), inset 0 0 24px rgba(16,185,129,0.3);">
          <div style="position: absolute; -top: 16px; left: 24px; background: white; color: #0F172A; font-size: 13px; font-weight: 900; padding: 6px 16px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 6px;">
            <span>🌮</span> Corn Tacos
          </div>
          <div style="position: absolute; top: 32%; right: -14px; background: white; color: #0F172A; font-size: 13px; font-weight: 900; padding: 6px 16px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 6px;">
            <span>🍗</span> Chicken
          </div>
          <div style="position: absolute; bottom: 28%; left: -14px; background: white; color: #0F172A; font-size: 13px; font-weight: 900; padding: 6px 16px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 6px;">
            <span>🧀</span> Cheese
          </div>
          <div style="position: absolute; bottom: -16px; right: 28px; background: white; color: #0F172A; font-size: 13px; font-weight: 900; padding: 6px 16px; border-radius: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 6px;">
            <span>🧅</span> Onions
          </div>
        </div>

        <!-- Camera Bottom Bar -->
        <div style="position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 36px 40px 36px; display: flex; justify-content: space-between; align-items: center; background: linear-gradient(0deg, rgba(0,0,0,0.85) 0%, transparent 100%);">
          <div style="width: 50px; height: 50px; border-radius: 18px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 22px; color: white;">🖼️</div>
          <div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 24px rgba(0,0,0,0.4);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: white;"></div>
          </div>
          <div style="width: 50px; height: 50px; border-radius: 18px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; font-size: 22px; color: white;">🏷️</div>
        </div>
      </div>
    `
  },
  {
    id: '02_instant_meal_insights',
    headline: 'Get Instant Meal<br>Insights & Advice',
    accentColor: '#059669',
    bgGlow: 'radial-gradient(circle at 20% 15%, rgba(16, 185, 129, 0.16) 0%, transparent 60%), radial-gradient(circle at 80% 85%, rgba(245, 158, 11, 0.12) 0%, transparent 60%)',
    contentHtml: `
      <div style="height: 250px; position: relative; overflow: hidden; border-radius: 36px 36px 0 0;">
        <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80" 
             style="width: 100%; height: 100%; object-fit: cover;" 
             alt="Salad Bowl" />
        <div style="position: absolute; top: 18px; left: 18px; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">←</div>
      </div>

      <div style="padding: 22px; background: white; margin-top: -30px; border-radius: 36px; box-shadow: 0 -10px 30px rgba(0,0,0,0.06); position: relative; z-index: 10; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
            <div>
              <span style="font-size: 11px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">Dinner • Verified</span>
              <h3 style="font-size: 21px; font-weight: 900; color: #0F172A; margin-top: 6px; letter-spacing: -0.3px;">Mediterranean Bowl with Quinoa</h3>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 4px 14px; border-radius: 14px;">
              <span style="font-size: 16px; font-weight: 900; color: #64748B;">−</span>
              <span style="font-size: 15px; font-weight: 900; color: #0F172A;">1</span>
              <span style="font-size: 16px; font-weight: 900; color: #0F172A;">+</span>
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 24px; padding: 18px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #E2E8F0; padding-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 22px;">🔥</span>
                <span style="font-size: 14px; font-weight: 800; color: #64748B;">Total Calories</span>
              </div>
              <div style="font-size: 34px; font-weight: 900; color: #0F172A; letter-spacing: -0.5px;">350 <span style="font-size: 14px; font-weight: 700; color: #64748B;">kcal</span></div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B;">🍗 Protein</div>
                <div style="font-size: 18px; font-weight: 900; color: #059669; margin-top: 2px;">30g</div>
              </div>
              <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B;">💧 Fat</div>
                <div style="font-size: 18px; font-weight: 900; color: #D97706; margin-top: 2px;">15g</div>
              </div>
              <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B;">🌾 Carbs</div>
                <div style="font-size: 18px; font-weight: 900; color: #3B82F6; margin-top: 2px;">40g</div>
              </div>
              <div style="background: white; border: 1px solid #E2E8F0; border-radius: 16px; padding: 10px 8px; text-align: center;">
                <div style="font-size: 11px; font-weight: 800; color: #64748B;">🥦 Fibre</div>
                <div style="font-size: 18px; font-weight: 900; color: #10B981; margin-top: 2px;">8g</div>
              </div>
            </div>
          </div>

          <div style="background: linear-gradient(135deg, #ECFDF5 0%, #E0F2FE 100%); border: 1.5px solid #A7F3D0; border-radius: 20px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 22px;">✨</span>
              <div>
                <div style="font-size: 14px; font-weight: 900; color: #065F46;">Cellular Repair Score: 9 / 10</div>
                <div style="font-size: 12px; color: #047857; font-weight: 600;">Safe glycemic profile • Low inflammation</div>
              </div>
            </div>
            <span style="font-size: 13px; font-weight: 800; color: #059669;">Know More ›</span>
          </div>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 10px;">
          <div style="flex: 1; background: #F1F5F9; color: #0F172A; font-size: 14px; font-weight: 800; padding: 16px; border-radius: 18px; text-align: center; border: 1px solid #E2E8F0;">
            ✨ Quick AI Fix
          </div>
          <div style="flex: 1; background: #059669; color: white; font-size: 14px; font-weight: 800; padding: 16px; border-radius: 18px; text-align: center; box-shadow: 0 8px 20px rgba(5,150,105,0.3);">
            Log Meal
          </div>
        </div>
      </div>
    `
  },
  {
    id: '03_keep_conversation_ai_mito',
    headline: 'Keep the Conversation<br>Going with AI Mito',
    accentColor: '#2563EB',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.16) 0%, transparent 60%), radial-gradient(circle at 10% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 60%)',
    contentHtml: `
      <div style="padding: 22px; display: flex; flex-direction: column; justify-content: space-between; height: 100%;">
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="align-self: flex-end; max-width: 85%; background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1.5px solid #86EFAC; border-radius: 24px 24px 6px 24px; padding: 14px 18px; box-shadow: 0 4px 14px rgba(0,0,0,0.03);">
            <p style="font-size: 14px; font-weight: 700; color: #065F46; line-height: 1.4;">
              I'm struggling to meet my protein & antioxidant budgets today. Help!
            </p>
          </div>

          <div style="align-self: flex-start; max-width: 95%; background: white; border: 1.5px solid #E2E8F0; border-radius: 24px 24px 24px 6px; padding: 18px; box-shadow: 0 6px 20px rgba(0,0,0,0.04);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <div style="width: 28px; height: 28px; border-radius: 8px; background: #2563EB; display: flex; align-items: center; justify-content: center; color: white; font-size: 14px; font-weight: 900;">✨</div>
              <span style="font-size: 14px; font-weight: 900; color: #0F172A;">AI Mito</span>
            </div>
            <p style="font-size: 14px; color: #334155; line-height: 1.45; font-weight: 600; margin-bottom: 14px;">
              Can be tricky on vegetarian days—focus on edamame, lentils, pumpkin seeds, and broccoli for maximum cellular repair. Try these recipes:
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              <div style="border: 1.5px solid #E2E8F0; border-radius: 18px; overflow: hidden; background: #F8FAFC;">
                <img src="https://images.unsplash.com/photo-1546069901-d5bfd2cbfb1f?auto=format&fit=crop&w=400&q=80" 
                     style="width: 100%; height: 95px; object-fit: cover;" 
                     alt="Chickpea Curry" />
                <div style="padding: 10px;">
                  <div style="font-size: 13px; font-weight: 900; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Chickpea Curry</div>
                  <div style="font-size: 11px; font-weight: 700; color: #059669; margin-top: 2px;">22g Protein • 240 Cal</div>
                </div>
              </div>

              <div style="border: 1.5px solid #E2E8F0; border-radius: 18px; overflow: hidden; background: #F8FAFC;">
                <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80" 
                     style="width: 100%; height: 95px; object-fit: cover;" 
                     alt="Tofu Black Bean Bowl" />
                <div style="padding: 10px;">
                  <div style="font-size: 13px; font-weight: 900; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Tofu Power Bowl</div>
                  <div style="font-size: 11px; font-weight: 700; color: #059669; margin-top: 2px;">24g Protein • 280 Cal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top: 16px; background: white; border: 1.5px solid #CBD5E1; border-radius: 24px; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 18px; color: #94A3B8;">➕</span>
            <span style="font-size: 14px; color: #64748B; font-weight: 600;">Ask Mito...</span>
          </div>
          <div style="display: flex; gap: 10px;">
            <span style="font-size: 18px; color: #2563EB;">🎙️</span>
            <span style="font-size: 18px; color: #64748B;">🎛️</span>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '04_reach_goals_social_proof',
    headline: 'Reach Your Goals &<br>Mito_Reboot for Good',
    accentColor: '#4F46E5',
    bgGlow: 'radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.16) 0%, transparent 60%), radial-gradient(circle at 90% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 60%)',
    contentHtml: `
      <div style="position: relative; width: 100%; height: 100%; border-radius: 40px; overflow: hidden; display: flex; flex-direction: column;">
        <img src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=80" 
             style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;" 
             alt="Happy healthy lifestyle" />

        <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(15,23,42,0.65) 100%);"></div>

        <div style="position: relative; z-index: 10; margin-top: auto; padding: 26px; display: flex; flex-direction: column; gap: 14px;">
          <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border-radius: 24px; padding: 18px 24px; box-shadow: 0 16px 36px rgba(0,0,0,0.18); border: 1.5px solid rgba(255,255,255,0.8);">
            <div style="font-size: 40px; font-weight: 900; color: #0F172A; line-height: 1; letter-spacing: -1px;">
              2.4 <span style="font-size: 20px; font-weight: 800; color: #059669;">kg / month</span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 6px;">
              average healthy metabolic weight loss by active users
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border-radius: 24px; padding: 18px 24px; box-shadow: 0 16px 36px rgba(0,0,0,0.18); border: 1.5px solid rgba(255,255,255,0.8);">
            <div style="font-size: 40px; font-weight: 900; color: #0F172A; line-height: 1; letter-spacing: -1px;">
              85<span style="font-size: 24px; font-weight: 800; color: #3B82F6;">%</span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 6px;">
              users report measurable drop in postprandial glucose spikes
            </div>
          </div>

          <div style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(16px); border-radius: 24px; padding: 18px 24px; box-shadow: 0 16px 36px rgba(0,0,0,0.18); border: 1.5px solid rgba(255,255,255,0.8);">
            <div style="font-size: 40px; font-weight: 900; color: #0F172A; line-height: 1; letter-spacing: -1px;">
              92<span style="font-size: 24px; font-weight: 800; color: #10B981;">%</span>
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #475569; margin-top: 6px;">
              report improved energy & consistent 14h+ circadian fasting
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    id: '05_continuous_glucose_cgm',
    headline: 'Decode Glucose Curves<br>& CGM Spikes',
    accentColor: '#7C3AED',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(124, 58, 237, 0.16) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
    contentHtml: `
      <div style="padding: 22px; display: flex; flex-direction: column; gap: 14px; height: 100%;">
        <div style="background: white; border: 2px solid #E2E8F0; border-radius: 28px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 10px #10B981;"></span>
              <span style="font-size: 13px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Continuous Glucose</span>
            </div>
            <span style="font-size: 11px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 8px;">Abbott Sensor Synced</span>
          </div>

          <div style="display: flex; align-items: baseline; gap: 8px;">
            <div style="font-size: 54px; font-weight: 900; color: #0F172A; line-height: 1; letter-spacing: -1.5px;">108</div>
            <div style="font-size: 16px; font-weight: 800; color: #64748B;">mg/dL <span style="color: #059669;">• Optimal Range</span></div>
          </div>

          <div style="margin-top: 14px;">
            <svg viewBox="0 0 320 85" style="width: 100%; height: 95px; overflow: visible;">
              <defs>
                <linearGradient id="cgmGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="25" width="320" height="40" fill="#F0FDF4" rx="4"/>
              <line x1="0" y1="25" x2="320" y2="25" stroke="#BBF7D0" stroke-dasharray="3,3" stroke-width="1.5"/>
              <line x1="0" y1="65" x2="320" y2="65" stroke="#BBF7D0" stroke-dasharray="3,3" stroke-width="1.5"/>

              <path d="M 0 55 C 40 52, 60 48, 90 35 C 120 22, 140 28, 170 42 C 200 58, 230 45, 270 38 C 290 34, 310 36, 320 37 L 320 85 L 0 85 Z" fill="url(#cgmGrad)"/>
              <path d="M 0 55 C 40 52, 60 48, 90 35 C 120 22, 140 28, 170 42 C 200 58, 230 45, 270 38 C 290 34, 310 36, 320 37" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round"/>
              <circle cx="270" cy="38" r="5" fill="#10B981" stroke="white" stroke-width="2"/>
            </svg>
          </div>
        </div>

        <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 18px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 46px; height: 46px; border-radius: 14px; background: #ECFDF5; display: flex; align-items: center; justify-content: center; font-size: 24px;">🥑</div>
            <div>
              <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Post-Lunch Response</div>
              <div style="font-size: 12px; color: #059669; font-weight: 700;">+14 mg/dL Spike • Safe Tier</div>
            </div>
          </div>
          <span style="font-size: 12px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 4px 10px; border-radius: 8px;">Optimal</span>
        </div>

        <div style="background: linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); border-radius: 24px; padding: 20px; color: white; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 11px; font-weight: 800; color: #818CF8; text-transform: uppercase; letter-spacing: 0.5px;">Autophagy Stage</div>
            <div style="font-size: 22px; font-weight: 900; margin-top: 2px;">⚡ 15h 24m Fasting</div>
            <div style="font-size: 12px; color: #94A3B8; margin-top: 2px;">Cellular recycling active</div>
          </div>
          <div style="width: 52px; height: 52px; border-radius: 50%; border: 3px solid #818CF8; display: flex; align-items: center; justify-content: center; font-size: 20px;">🔥</div>
        </div>
      </div>
    `
  },
  {
    id: '06_consult_top_specialists',
    headline: 'Consult Top Specialists<br>& Cancer Experts',
    accentColor: '#0284C7',
    bgGlow: 'radial-gradient(circle at 80% 20%, rgba(2, 132, 199, 0.16) 0%, transparent 60%), radial-gradient(circle at 10% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
    contentHtml: `
      <div style="padding: 22px; display: flex; flex-direction: column; gap: 14px; height: 100%;">
        <div style="background: white; border: 2px solid #E2E8F0; border-radius: 28px; padding: 22px; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
          <div style="display: flex; gap: 16px; align-items: center;">
            <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80" 
                 style="width: 74px; height: 74px; border-radius: 20px; object-fit: cover; border: 2px solid #0284C7;" 
                 alt="Doctor" />
            <div>
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 17px; font-weight: 900; color: #0F172A;">Dr. Krithikaa Sekar</span>
                <span style="color: #0284C7; font-size: 16px;">✓</span>
              </div>
              <div style="font-size: 12px; color: #64748B; font-weight: 700;">MD • Preventive Lifestyle Specialist</div>
              <div style="font-size: 11px; color: #059669; font-weight: 800; margin-top: 4px;">★ 4.9 (340+ Clinical Reviews)</div>
            </div>
          </div>

          <div style="margin-top: 16px; display: flex; gap: 8px;">
            <div style="flex: 1; background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 14px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 800; color: #0369A1;">EXPERIENCE</div>
              <div style="font-size: 15px; font-weight: 900; color: #0C4A6E; margin-top: 2px;">12+ Years</div>
            </div>
            <div style="flex: 1; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 800; color: #15803D;">PATIENTS</div>
              <div style="font-size: 15px; font-weight: 900; color: #14532D; margin-top: 2px;">4,800+</div>
            </div>
            <div style="flex: 1; background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 14px; padding: 8px 12px; text-align: center;">
              <div style="font-size: 10px; font-weight: 800; color: #4338CA;">CONSULTS</div>
              <div style="font-size: 15px; font-weight: 900; color: #312E81; margin-top: 2px;">Video / Clinic</div>
            </div>
          </div>
        </div>

        <div style="background: white; border: 2px solid #E2E8F0; border-radius: 24px; padding: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <div style="font-size: 13px; font-weight: 900; color: #0F172A; text-transform: uppercase;">Digital Clinical Care</div>
            <span style="font-size: 11px; font-weight: 800; color: #0284C7; background: #F0F9FF; padding: 4px 10px; border-radius: 8px;">Instant Download</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; padding: 10px 14px; border-radius: 14px; border: 1px solid #E2E8F0;">
              <span style="font-size: 13px; font-weight: 700; color: #334155;">📄 Medical Prescription PDF</span>
              <span style="font-size: 11px; font-weight: 900; color: #0284C7;">Generated ✓</span>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; background: #F8FAFC; padding: 10px 14px; border-radius: 14px; border: 1px solid #E2E8F0;">
              <span style="font-size: 13px; font-weight: 700; color: #334155;">🧪 Lab Biomarker Audit (HbA1c/CEA)</span>
              <span style="font-size: 11px; font-weight: 900; color: #059669;">Reviewed ✓</span>
            </div>
          </div>
        </div>

        <div style="background: #0284C7; color: white; padding: 18px; border-radius: 20px; font-size: 15px; font-weight: 900; text-align: center; box-shadow: 0 10px 24px rgba(2,132,199,0.35); margin-top: auto;">
          Book 1-on-1 Specialist Consultation
        </div>
      </div>
    `
  }
];

// ─── 2. BUILD MODERN HTML TEMPLATE FOR PHONES & TABLETS ───
function buildModernHtml({ screen, width, height, isTablet = false }) {
  const isAndroid = width === 1080 || (isTablet && width === 1600);
  const headlineSize = isTablet ? (width === 2048 ? '74px' : '62px') : (isAndroid ? '52px' : '64px');
  const chassisWidth = isTablet ? (width === 2048 ? '1680px' : '1360px') : (isAndroid ? '880px' : '1020px');

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
      padding-top: ${isTablet ? '80px' : (isAndroid ? '60px' : '90px')};
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
      max-width: ${isTablet ? '1600px' : (isAndroid ? '960px' : '1120px')};
      padding: 0 40px;
      margin-bottom: ${isTablet ? '44px' : (isAndroid ? '36px' : '52px')};
    }

    .headline {
      font-size: ${headlineSize};
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1.5px;
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
      border-radius: ${isTablet ? '48px 48px 0 0' : '64px 64px 0 0'};
      padding: ${isTablet ? '18px 18px 0 18px' : '14px 14px 0 14px'};
      box-shadow: 
        0 -20px 80px rgba(15, 23, 42, 0.22),
        0 0 0 1px rgba(255, 255, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
      border: 3.5px solid #1F2937;
      border-bottom: none;
      display: flex;
      flex-direction: column;
    }

    .phone-screen {
      width: 100%;
      height: 100%;
      background: #F8FAFC;
      border-radius: ${isTablet ? '38px 38px 0 0' : '52px 52px 0 0'};
      overflow: hidden;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .status-bar {
      height: 52px;
      padding: 12px 36px 0 36px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      z-index: 30;
      color: #0F172A;
      font-weight: 800;
      font-size: ${isTablet ? '18px' : '16px'};
    }

    .dynamic-island {
      width: 130px;
      height: 32px;
      background: #000000;
      border-radius: 20px;
      position: absolute;
      left: 50%;
      top: 12px;
      transform: translateX(-50%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: ${isTablet ? 'none' : 'block'};
    }

    .screen-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
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
          <div style="display: flex; align-items: center; gap: 6px; font-size: ${isTablet ? '18px' : '14px'};">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>

        <div class="screen-body">
          ${screen.contentHtml}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── 3. BUILD MODERN GOOGLE PLAY FEATURE GRAPHIC (1024 x 500) ───
function buildModernFeatureGraphicHtml() {
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
      position: relative;
      padding: 0 60px;
    }
    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 85% 30%, rgba(16, 185, 129, 0.18) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(37, 99, 235, 0.12) 0%, transparent 60%);
      pointer-events: none;
    }
    .left-content {
      flex: 1;
      max-width: 540px;
      z-index: 10;
    }
    .brand-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    .brand-logo {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #10B981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      box-shadow: 0 8px 20px rgba(16,185,129,0.3);
    }
    .brand-title {
      font-size: 28px;
      font-weight: 900;
      color: #0F172A;
      letter-spacing: -0.5px;
    }
    .headline {
      font-size: 42px;
      font-weight: 900;
      color: #0F172A;
      line-height: 1.15;
      letter-spacing: -1.2px;
      margin-bottom: 18px;
    }
    .pills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .pill {
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 800;
      color: #334155;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    }
    .right-phone {
      width: 320px;
      height: 600px;
      background: #111827;
      border-radius: 46px;
      padding: 10px;
      box-shadow: -20px 20px 60px rgba(15,23,42,0.22);
      border: 3px solid #1F2937;
      transform: rotate(8deg) translateY(20px);
      margin-left: 40px;
      overflow: hidden;
      z-index: 10;
    }
    .phone-inner {
      width: 100%;
      height: 100%;
      border-radius: 36px;
      background: #F8FAFC;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div class="glow"></div>
  <div class="left-content">
    <div class="brand-row">
      <div class="brand-logo">🧬</div>
      <div class="brand-title">Mito_Reboot™</div>
    </div>
    <h1 class="headline">Preventive Lifestyle &<br>Metabolic Health App</h1>
    <div class="pills-grid">
      <div class="pill"><span>📸</span> AI Food Scanner</div>
      <div class="pill"><span>📊</span> Continuous Glucose (CGM)</div>
      <div class="pill"><span>⚡</span> Circadian Fasting</div>
      <div class="pill"><span>💬</span> AI Mito Assistant</div>
      <div class="pill"><span>👨‍⚕️</span> Top Specialists</div>
    </div>
  </div>

  <div class="right-phone">
    <div class="phone-inner">
      <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" style="width: 100%; height: 180px; object-fit: cover;" />
      <div style="padding: 16px; background: white; margin-top: -20px; border-radius: 24px; position: relative;">
        <div style="font-size: 15px; font-weight: 900; color: #0F172A;">Quinoa Power Bowl</div>
        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <span style="background: #ECFDF5; color: #059669; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 8px;">350 kcal</span>
          <span style="background: #EFF6FF; color: #2563EB; font-size: 11px; font-weight: 800; padding: 4px 8px; border-radius: 8px;">30g Protein</span>
        </div>
        <div style="margin-top: 12px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 10px; font-size: 11px; font-weight: 700; color: #059669;">
          ✨ Cellular Repair Score: 9/10
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── 4. BUILD MODERN DESKTOP / CHROMEBOOK SCREENS (1920 x 1080) ───
const modernDesktopScreens = [
  {
    id: '01_desktop_snap_and_nutrition',
    title: 'Snap Food AI Scanner & Instant Meal Insights',
    subtitle: 'Automated calorie, macro & cellular repair classification across all meals',
    contentHtml: `
      <div style="display: grid; grid-template-columns: 1.1fr 1.2fr; gap: 24px; height: 100%;">
        <!-- Left: Camera Food Scanner -->
        <div style="border-radius: 28px; overflow: hidden; position: relative; background: #0F172A; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=1200&q=80" style="width: 100%; height: 100%; object-fit: cover;" />
          <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); padding: 8px 18px; border-radius: 16px; color: white; font-weight: 800; font-size: 14px; border: 1px solid rgba(255,255,255,0.2);">
            📸 AI Food Detection Active
          </div>
          <div style="position: absolute; top: 40%; left: 16%; width: 68%; height: 38%; border: 2.5px solid white; border-radius: 24px; box-shadow: 0 0 20px rgba(16,185,129,0.3);">
            <div style="position: absolute; -top: 14px; left: 16px; background: white; color: #0F172A; font-weight: 900; font-size: 12px; padding: 4px 12px; border-radius: 10px;">🌮 Corn Tacos</div>
            <div style="position: absolute; -bottom: 14px; right: 16px; background: white; color: #0F172A; font-weight: 900; font-size: 12px; padding: 4px 12px; border-radius: 10px;">🍗 Grilled Chicken</div>
          </div>
        </div>

        <!-- Right: Meal Nutrition Analysis & Score -->
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
                <div style="font-size: 16px; font-weight: 900; color: #065F46;">✨ Cellular Repair Score: 9 / 10</div>
                <div style="font-size: 12px; color: #047857; font-weight: 600; margin-top: 2px;">Optimal postprandial glucose stability • Low inflammatory index</div>
              </div>
              <span style="background: white; color: #059669; font-size: 12px; font-weight: 900; padding: 6px 14px; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">Safe Tier</span>
            </div>
          </div>

          <!-- Bottom Summary Stat -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
            <div style="background: white; border-radius: 20px; padding: 18px; border: 1.5px solid #E2E8F0;">
              <div style="font-size: 12px; font-weight: 800; color: #64748B;">FASTING TIMELINE</div>
              <div style="font-size: 24px; font-weight: 900; color: #4F46E5; margin-top: 4px;">⚡ 15h 20m</div>
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
        <!-- Left: CGM Trace -->
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
                <linearGradient id="deskCgmGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10B981" stop-opacity="0.35"/>
                  <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <rect x="0" y="45" width="540" height="90" fill="#F0FDF4" rx="12"/>
              <line x1="0" y1="45" x2="540" y2="45" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              <line x1="0" y1="135" x2="540" y2="135" stroke="#86EFAC" stroke-dasharray="4,4" stroke-width="1.5"/>
              
              <path d="M 0 110 C 60 105, 100 80, 160 55 C 220 30, 260 70, 320 85 C 380 100, 430 75, 480 65 L 540 68 L 540 180 L 0 180 Z" fill="url(#deskCgmGrad2)"/>
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

        <!-- Right: Doctor Video Consultation -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="background: white; border-radius: 28px; padding: 22px; border: 1.5px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.04);">
            <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 16px;">
              <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80" style="width: 72px; height: 72px; border-radius: 20px; object-fit: cover; border: 2.5px solid #0284C7;" />
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

            <div style="background: #0284C7; color: white; padding: 14px; border-radius: 16px; font-size: 14px; font-weight: 900; text-align: center; box-shadow: 0 8px 20px rgba(2,132,199,0.3);">
              Join Patient Consultation Room
            </div>
          </div>

          <div style="background: white; border-radius: 24px; padding: 18px; border: 1.5px solid #E2E8F0; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">📄</span>
              <div>
                <div style="font-size: 14px; font-weight: 900; color: #0F172A;">Medical Prescription PDF</div>
                <div style="font-size: 11px; color: #64748B;">Ready for immediate download</div>
              </div>
            </div>
            <span style="font-size: 12px; font-weight: 900; color: #0284C7;">Download ›</span>
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
        <!-- Left: Chat conversation stream -->
        <div style="background: white; border-radius: 28px; padding: 24px; border: 1.5px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid #F1F5F9;">
              <div style="width: 44px; height: 44px; border-radius: 14px; background: linear-gradient(135deg, #10B981, #059669); display: flex; align-items: center; justify-content: center; font-size: 22px;">✨</div>
              <div>
                <div style="font-size: 17px; font-weight: 900; color: #0F172A;">AI Mito Health Assistant</div>
                <div style="font-size: 12px; color: #059669; font-weight: 700;">Active • Trained on Cellular Metabolic Medicine</div>
              </div>
            </div>

            <!-- User bubble -->
            <div style="align-self: flex-end; max-width: 80%; background: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 20px 20px 4px 20px; padding: 14px 18px; color: #166534; font-size: 15px; font-weight: 800;">
              "I'm struggling to reach my daily protein & fibre budgets on a plant-based schedule. Can you optimize my dinner?"
            </div>

            <!-- AI bubble -->
            <div style="align-self: flex-start; max-width: 90%; background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 20px 20px 20px 4px; padding: 16px 20px;">
              <div style="font-size: 14px; color: #334155; line-height: 1.5; font-weight: 600;">
                Plant-based cellular longevity requires pairing diverse legumes with resistant starch. Here are 2 optimized high-polyphenol options tailored to keep your fasting window unspiked:
              </div>
            </div>
          </div>

          <!-- Bottom Chat Input Simulation -->
          <div style="background: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 18px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 14px; color: #94A3B8; font-weight: 600;">Ask AI Mito anything about nutrition, markers or sleep...</span>
            <span style="background: #10B981; color: white; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px;">↑</span>
          </div>
        </div>

        <!-- Right: Recipe Recommendation Cards -->
        <div style="display: grid; grid-template-rows: 1fr 1fr; gap: 16px;">
          <!-- Card 1 -->
          <div style="background: white; border-radius: 24px; padding: 18px; border: 1.5px solid #E2E8F0; display: flex; gap: 18px; align-items: center;">
            <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80" style="width: 130px; height: 110px; border-radius: 18px; object-fit: cover;" />
            <div style="flex: 1;">
              <span style="font-size: 11px; font-weight: 800; color: #059669; background: #ECFDF5; padding: 3px 8px; border-radius: 6px;">HIGH FIBRE • 240 kcal</span>
              <div style="font-size: 18px; font-weight: 900; color: #0F172A; margin: 4px 0;">Spiced Chickpea & Spinach Curry</div>
              <div style="font-size: 13px; color: #64748B; font-weight: 700;">22g Protein • 12g Dietary Fibre • Low GI</div>
            </div>
          </div>

          <!-- Card 2 -->
          <div style="background: white; border-radius: 24px; padding: 18px; border: 1.5px solid #E2E8F0; display: flex; gap: 18px; align-items: center;">
            <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80" style="width: 130px; height: 110px; border-radius: 18px; object-fit: cover;" />
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
        <!-- Left: Verified Real-World Outcome Stats -->
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

        <!-- Right: Patient Transformation Showcase -->
        <div style="border-radius: 28px; overflow: hidden; position: relative; background: #0F172A;">
          <img src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80" style="width: 100%; height: 100%; object-fit: cover;" />
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

function buildModernDesktopHtml({ screen }) {
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

// ─── 5. MASTER GENERATOR FUNCTION FOR ALL PLATFORMS ───
async function runAllPlatformsGenerator() {
  console.log('================================================================');
  console.log('🚀 GENERATING MODERN STORE ASSETS FOR ALL PLATFORMS (HEALTHIFY AESTHETIC)');
  console.log('================================================================');

  const tempDir = path.join('/tmp', 'modern_all_store_screenshots');
  fs.mkdirSync(tempDir, { recursive: true });

  // 1. Phone Screenshots: Android (1080x1920) & iOS (1290x2796)
  console.log('\n📱 [1/4] Rendering Phone Screenshots (Google Play & Apple App Store)...');
  for (let i = 0; i < modernScreens.length; i++) {
    const s = modernScreens[i];
    console.log(`   📸 [${i + 1}/${modernScreens.length}] ${s.id}...`);

    // Android (1080x1920)
    const androidHtml = buildModernHtml({ screen: s, width: 1080, height: 1920 });
    const androidHtmlPath = path.join(tempDir, `${s.id}_android.html`);
    const androidPngPath = path.join(androidDir, `${s.id}.png`);
    fs.writeFileSync(androidHtmlPath, androidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${androidPngPath}" --window-size=1080,1920 "${androidHtmlPath}"`, { stdio: 'pipe' });

    // iOS (1290x2796)
    const iosHtml = buildModernHtml({ screen: s, width: 1290, height: 2796 });
    const iosHtmlPath = path.join(tempDir, `${s.id}_ios.html`);
    const iosPngPath = path.join(iosDir, `${s.id}.png`);
    fs.writeFileSync(iosHtmlPath, iosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${iosPngPath}" --window-size=1290,2796 "${iosHtmlPath}"`, { stdio: 'pipe' });
  }

  // 2. Feature Graphic: Google Play (1024x500)
  console.log('\n🎨 [2/4] Rendering Modern Google Play Feature Graphic (1024x500)...');
  const fgHtml = buildModernFeatureGraphicHtml();
  const fgHtmlPath = path.join(tempDir, 'feature_graphic.html');
  const fgPngPath = path.join(featureGraphicDir, 'feature_graphic.png');
  fs.writeFileSync(fgHtmlPath, fgHtml, 'utf8');
  execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${fgPngPath}" --window-size=1024,500 "${fgHtmlPath}"`, { stdio: 'pipe' });
  console.log(`   ✓ Google Play Feature Graphic generated: ${fgPngPath}`);

  // 3. Tablet Screenshots: Google Play 7" & 10" Tablets (1600x2560) & Apple iPad Pro (2048x2732)
  console.log('\n📟 [3/4] Rendering Tablet Screenshots (iPad Pro 12.9" & Android Tablet)...');
  for (let i = 0; i < modernScreens.length; i++) {
    const s = modernScreens[i];
    console.log(`   📸 [${i + 1}/${modernScreens.length}] Tablet: ${s.id}...`);

    // Android Tablet (1600x2560)
    const tabletAndroidHtml = buildModernHtml({ screen: s, width: 1600, height: 2560, isTablet: true });
    const tabletAndroidHtmlPath = path.join(tempDir, `${s.id}_tablet_android.html`);
    const tabletAndroidPngPath = path.join(tabletAndroidDir, `${s.id}.png`);
    fs.writeFileSync(tabletAndroidHtmlPath, tabletAndroidHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletAndroidPngPath}" --window-size=1600,2560 "${tabletAndroidHtmlPath}"`, { stdio: 'pipe' });

    // Apple iPad Pro (2048x2732)
    const tabletIosHtml = buildModernHtml({ screen: s, width: 2048, height: 2732, isTablet: true });
    const tabletIosHtmlPath = path.join(tempDir, `${s.id}_tablet_ios.html`);
    const tabletIosPngPath = path.join(tabletIosDir, `${s.id}.png`);
    fs.writeFileSync(tabletIosHtmlPath, tabletIosHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${tabletIosPngPath}" --window-size=2048,2732 "${tabletIosHtmlPath}"`, { stdio: 'pipe' });
  }

  // 4. Desktop / Chromebook Screens (1920x1080)
  console.log('\n💻 [4/4] Rendering Modern Desktop / Chromebook Screens (1920x1080)...');
  for (let i = 0; i < modernDesktopScreens.length; i++) {
    const s = modernDesktopScreens[i];
    console.log(`   📸 [${i + 1}/${modernDesktopScreens.length}] Desktop: ${s.id}...`);

    const deskHtml = buildModernDesktopHtml({ screen: s });
    const deskHtmlPath = path.join(tempDir, `${s.id}.html`);
    const deskPngPath = path.join(desktopDir, `${s.id}.png`);
    fs.writeFileSync(deskHtmlPath, deskHtml, 'utf8');
    execSync(`"${CHROME_PATH}" --headless --disable-gpu --screenshot="${deskPngPath}" --window-size=1920,1080 "${deskHtmlPath}"`, { stdio: 'pipe' });
  }

  console.log('\n🎉 ALL STORE LISTING ASSETS GENERATED FOR ALL PLATFORMS!');
  console.log(`📁 iOS Phone: ${iosDir}`);
  console.log(`📁 Android Phone: ${androidDir}`);
  console.log(`📁 Google Play Feature Graphic: ${featureGraphicDir}`);
  console.log(`📁 Apple iPad Pro Tablet: ${tabletIosDir}`);
  console.log(`📁 Android 7" & 10" Tablet: ${tabletAndroidDir}`);
  console.log(`📁 Desktop / Chromebook: ${desktopDir}`);
}

runAllPlatformsGenerator().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
