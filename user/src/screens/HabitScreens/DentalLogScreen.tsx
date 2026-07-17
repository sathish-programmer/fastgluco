import React, { useState } from 'react';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface DentalLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (reason: string) => void;
}

export const DentalLogScreen: React.FC<DentalLogScreenProps> = ({ onBack, onBookAppointment }) => {
  const [sharpTooth, setSharpTooth] = useState<boolean | null>(null);
  const [tobacco, setTobacco] = useState<boolean | null>(null);

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased text-slate-800">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 shadow-sm transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Dental</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Dental Health</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Oral Health Check</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Poor dental health, sharp teeth, and tobacco staining are linked to chronic inflammation and increased risk of oral cancers.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Self Assessment</span>
        
        <div className="mb-8">
          <p className="font-semibold text-slate-800 text-sm mb-4">Do you have any sharp tooth?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setSharpTooth(true)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${sharpTooth === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Yes
            </button>
            <button 
              onClick={() => setSharpTooth(false)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${sharpTooth === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              No
            </button>
          </div>

          {sharpTooth === true && (
            <ConsultationBanner
              sourceModule="Dental"
              reason="Dentist Consultation"
              triggerCondition="Has sharp tooth"
              riskLevel="Medium"
              recommendedSpecialty="Dentist"
              title="Recommendation"
              description="A sharp tooth can cause chronic irritation which might lead to complications over time. Please consult a dentist."
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          )}

          {sharpTooth === false && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-700 text-xs font-semibold">Good! Keep maintaining your oral hygiene.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100">
          <p className="font-semibold text-slate-800 text-sm mb-4">Do you have tobacco staining on your teeth?</p>
          <div className="flex gap-3">
            <button 
              onClick={() => setTobacco(true)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tobacco === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              Yes
            </button>
            <button 
              onClick={() => setTobacco(false)}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${tobacco === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              No
            </button>
          </div>

          {tobacco === true && (
            <ConsultationBanner
              sourceModule="Dental"
              reason="Dentist Consultation"
              triggerCondition="Has tobacco staining"
              riskLevel="Medium"
              recommendedSpecialty="Dentist"
              title="Recommendation"
              description="Tobacco staining requires professional cleaning and evaluation to prevent further damage."
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          )}

          {tobacco === false && (
            <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-emerald-700 text-xs font-semibold">Good! A clean smile is a healthy smile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
