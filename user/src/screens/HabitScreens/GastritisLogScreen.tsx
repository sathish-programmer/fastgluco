import React, { useState } from 'react';
import { ArrowLeft, Flame, ShoppingBag } from 'lucide-react';
import { ConsultationBanner } from '../../components/ConsultationBanner';

interface GastritisLogScreenProps {
  onBack: () => void;
  onBookAppointment?: (recommendationId: string) => void;
  onNavigateToShop?: (query: string) => void;
}

export const GastritisLogScreen: React.FC<GastritisLogScreenProps> = ({ onBack, onBookAppointment, onNavigateToShop }) => {
  const [gastritis, setGastritis] = useState<boolean | null>(null);

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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Damage · Gastritis</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Gut Health Tracker</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5 flex items-center gap-2"><Flame className="h-4 w-4 text-orange-500" /> Track Acidity</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Frequent gastritis or acidity can be a sign of underlying issues like H. Pylori, which increases the risk of stomach ulcers and cancer.
        </p>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-8">
        <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-6">Assessment</span>
        
        <p className="font-semibold text-slate-800 text-sm mb-4">Do you feel gastritis or acidity often?</p>
        <div className="flex gap-3 mb-6">
          <button 
            onClick={() => setGastritis(true)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${gastritis === true ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Yes
          </button>
          <button 
            onClick={() => setGastritis(false)}
            className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${gastritis === false ? 'bg-primary text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            No
          </button>
        </div>

        {gastritis === true && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 mb-4">
              <p className="text-orange-800 text-sm font-semibold">Frequent gastritis requires evaluation.</p>
              <p className="text-orange-700/80 text-xs mt-1">Please choose one of the following recommended options:</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 hover:border-primary/50 transition-colors shadow-sm">
              <h4 className="font-bold text-slate-800 text-sm mb-1">Option 1: H. Pylori Test</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Take an H. Pylori blood test at home. After the test results arrive, consult a gastric specialist.
              </p>
              <button onClick={() => {
                if (onNavigateToShop) onNavigateToShop('H. Pylori');
              }} className="inline-flex items-center justify-center w-full gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                <ShoppingBag className="h-4 w-4" /> Buy H. Pylori Test
              </button>
            </div>

            <ConsultationBanner
              sourceModule="Gastritis"
              reason="Gastric Specialist Consultation"
              triggerCondition="Has frequent gastritis"
              riskLevel="Medium"
              recommendedSpecialty="Gastroenterologist"
              title="Option 2: Direct Consultation"
              description="Directly consult a gastric specialist for advice and diagnosis."
              colorTheme="amber"
              onBookAppointment={onBookAppointment!}
            />
          </div>
        )}

        {gastritis === false && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in duration-300">
            <p className="text-emerald-700 text-sm font-bold mb-1">That's great!</p>
            <p className="text-emerald-600/90 text-xs font-medium">Maintain a healthy diet to keep your gut happy and inflammation low.</p>
          </div>
        )}
      </div>
    </div>
  );
};
