import React, { useState } from 'react';
import { ArrowLeft, Scale } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface ObesityLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
}

export const ObesityLogScreen: React.FC<ObesityLogScreenProps> = ({ onBack, onBookAppointment }) => {
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [difficultyLosing, setDifficultyLosing] = useState<boolean | null>(null);

  const calculateBMI = () => {
    const h = parseFloat(height);
    const w = parseFloat(weight);
    if (!isNaN(h) && !isNaN(w) && h > 0) {
      return (w / Math.pow(h / 100, 2)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI();
  let bmiCategory = '';
  let catColor = '';
  
  if (bmi) {
    const val = parseFloat(bmi);
    if (val < 18.5) { bmiCategory = 'Underweight'; catColor = 'text-sky-500'; }
    else if (val >= 18.5 && val <= 24.9) { bmiCategory = 'Normal Weight'; catColor = 'text-emerald-500'; }
    else if (val >= 25 && val <= 29.9) { bmiCategory = 'Overweight'; catColor = 'text-amber-500'; }
    else { bmiCategory = 'Obese'; catColor = 'text-rose-500'; }
  }

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-6 sub-page-internal-header">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Obesity</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Obesity Tracker</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2"><Scale className="h-4 w-4" /> Know your BMI</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Body Mass Index helps assess healthy weight range relative to height. Chronic obesity accelerates cellular ageing and raises cancer risk.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">BMI Calculator</span>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Height (cm)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 165"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Weight (kg)</label>
            <input
              type="number"
              step="any"
              placeholder="e.g. 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-slate-700 text-sm font-medium"
            />
          </div>
        </div>

        {bmi && (
          <div className="bg-slate-50 rounded-2xl p-5 text-center mb-8 border border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Your BMI</div>
            <div className="text-4xl font-bold text-slate-800 font-mono tracking-tight">{bmi}</div>
            <div className={`text-sm font-bold mt-1 ${catColor}`}>{bmiCategory}</div>
          </div>
        )}

        {bmi && (
          <div className="pt-6 border-t border-slate-100">
            <p className="font-semibold text-slate-800 text-sm mb-4">Do you face difficulty in losing weight despite effort?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDifficultyLosing(true)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${difficultyLosing === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Yes
              </button>
              <button 
                onClick={() => setDifficultyLosing(false)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${difficultyLosing === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                No
              </button>
            </div>

            {difficultyLosing === true && (
              <ConsultationBanner
                sourceModule="Obesity"
                reason="Endocrinologist Consultation"
                triggerCondition="Has difficulty losing weight"
                riskLevel="High"
                recommendedSpecialty="Endocrinologist"
                title="Recommendation"
                description="We suggest consulting an endocrinologist to rule out any hormonal imbalances."
                colorTheme="amber"
                onBookAppointment={onBookAppointment!}
              />
            )}

            {difficultyLosing === false && (
              <ConsultationBanner
                sourceModule="Obesity"
                reason="Endocrinologist Consultation"
                triggerCondition="Tracking weekly weight"
                riskLevel="Low"
                recommendedSpecialty="Endocrinologist"
                title="Great!"
                description="Please log your weekly weight in the app until your target weight is achieved. If a decrease is not happening over time, click below:"
                colorTheme="emerald"
                onBookAppointment={onBookAppointment!}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
