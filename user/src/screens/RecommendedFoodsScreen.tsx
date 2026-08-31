import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Info, ShieldCheck, Sparkles, Stethoscope, Leaf } from 'lucide-react';

interface RecommendedFood {
  _id: string;
  category: string;
  productName: string;
  image?: string;
  nutritionDetails: string;
  ingredients: string;
  pesticideInfo: string;
  certifications?: string;
  doctorNotes?: string;
}

interface Props {
  onBack: () => void;
}

export const RecommendedFoodsScreen: React.FC<Props> = ({ onBack }) => {
  const { apiUrl, token } = useAuth();
  const { showToast } = useToast();
  const [foods, setFoods] = useState<RecommendedFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const response = await fetch(`${apiUrl}/recommended-foods`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setFoods(data);
        } else {
          showToast('Failed to load recommended foods.', 'error');
        }
      } catch (err) {
        console.error('Error fetching recommended foods', err);
        showToast('Error loading recommended foods.', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchFoods();
    }
  }, [apiUrl, token, showToast]);

  const categories = Array.from(new Set(foods.map(f => f.category)));

  return (
    <div className="pb-28 pt-3 px-4 max-w-5xl mx-auto bg-slate-50/70 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sub-Header Navigation Bar */}
      <div className="mb-5 flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl shadow-2xs hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-95 transition-all cursor-pointer"
            title="Back"
          >
            <ChevronLeft className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Doctor Recommended
              </h2>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                Verified
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
              Clean food products for optimal glucose & metabolic stability
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          <span className="text-xs text-slate-400 font-semibold">Loading recommended foods...</span>
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-8 shadow-xs">
          <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Leaf className="h-7 w-7" />
          </div>
          <h4 className="text-base font-black text-slate-900 dark:text-white">No Recommendations Yet</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Our clinical nutrition specialists will publish verified genuine foods for your profile soon.
          </p>
        </div>
      ) : (
        categories.map(category => (
          <div key={category} className="mb-6">
            <div className="flex items-center gap-2 mb-3 ml-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                {category}
              </h3>
            </div>

            <div className="space-y-3.5">
              {foods.filter(f => f.category === category).map(food => (
                <div 
                  key={food._id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3.5"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/40 overflow-hidden flex items-center justify-center">
                      {food.image ? (
                        <img 
                          src={food.image} 
                          alt={food.productName} 
                          className="absolute inset-0 w-full h-full object-cover z-10" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : null}
                      <Info className="h-6 w-6 text-emerald-400 dark:text-emerald-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base leading-snug">
                        {food.productName}
                      </h4>
                      {food.certifications && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full text-[10px] font-black mt-1">
                          <ShieldCheck className="h-3 w-3 shrink-0" />
                          <span className="truncate">{food.certifications}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-24 shrink-0">Nutrition:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{food.nutritionDetails}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-24 shrink-0">Ingredients:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{food.ingredients}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-500 dark:text-slate-400 w-24 shrink-0">Cultivation:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium flex-1">{food.pesticideInfo}</span>
                    </div>
                  </div>

                  {food.doctorNotes && (
                    <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-800/60 flex items-start gap-2.5">
                      <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-950 dark:text-blue-200 font-medium leading-relaxed">
                        <span className="font-black">Doctor's Note:</span> {food.doctorNotes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
