import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ChevronLeft, Info, ShieldCheck } from 'lucide-react';

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
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-slate-50/70 min-h-screen font-sans antialiased text-slate-800">
      <div className="mb-6 flex items-center">
        <button 
          onClick={onBack}
          className="mr-3 bg-white border border-slate-150 p-2 rounded-2xl shadow-sm hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-850">Doctor Recommended</h2>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Genuine food products for better glucose management
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : foods.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-sm font-semibold">
          No recommended foods available at the moment.
        </div>
      ) : (
        categories.map(category => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 ml-1">{category}</h3>
            <div className="space-y-4">
              {foods.filter(f => f.category === category).map(food => (
                <div key={food._id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="relative w-16 h-16 shrink-0 rounded-2xl bg-indigo-50 overflow-hidden">
                      {food.image && (
                        <img 
                          src={food.image} 
                          alt={food.productName} 
                          className="absolute inset-0 w-full h-full object-cover z-10" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Info className="h-6 w-6 text-indigo-300" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{food.productName}</h4>
                      {food.certifications && (
                        <div className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold mt-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{food.certifications}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-600 w-24 shrink-0">Nutrition:</span>
                      <span className="text-slate-700">{food.nutritionDetails}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-600 w-24 shrink-0">Ingredients:</span>
                      <span className="text-slate-700">{food.ingredients}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-semibold text-slate-600 w-24 shrink-0">Cultivation:</span>
                      <span className="text-slate-700 text-xs flex-1">{food.pesticideInfo}</span>
                    </div>
                    {food.doctorNotes && (
                      <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-800 font-medium">
                          <span className="font-bold">Doctor's Note:</span> {food.doctorNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
