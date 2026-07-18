import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, TestTube2, Clock, CheckCircle2, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface PartnerLabsScreenProps {
  testId: string;
  testName: string;
  onBack: () => void;
  onSelectLab: (lab: any, price: number, labTestId: string) => void;
}

export const PartnerLabsScreen: React.FC<PartnerLabsScreenProps> = ({ testId, testName, onBack, onSelectLab }) => {
  const { apiUrl, token } = useAuth();
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const res = await fetch(`${apiUrl}/labs/tests/${testId}/labs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setLabs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, [testId, apiUrl, token]);

  return (
    <div className="pb-24 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Select Center</span>
          <h2 className="text-2xl font-bold text-slate-800 leading-none mt-1">{testName}</h2>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-end">
        <h3 className="font-bold text-slate-700">Available Partner Labs</h3>
        <span className="text-xs font-semibold text-slate-500">{labs.length} found near you</span>
      </div>

      {loading ? (
        <div className="text-center py-10 animate-pulse text-slate-400 font-bold">Finding diagnostic centers...</div>
      ) : labs.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-3xl border border-slate-200 p-6">
          <TestTube2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold">No labs available</p>
          <p className="text-xs mt-1">Currently there are no partner labs offering this specific test.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {labs.map((labTest: any) => {
            const lab = labTest.laboratoryId;
            return (
              <div key={labTest._id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 flex shrink-0 items-center justify-center">
                      {lab.logo ? <img src={lab.logo} alt={lab.name} className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-slate-400" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        {lab.name}
                        {lab.isNablCertified && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {lab.address}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Price</span>
                    <span className="text-xl font-black text-slate-800">₹{labTest.price}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                    <Clock className="h-3 w-3" /> Reports in {labTest.turnaroundTimeHours} hrs
                  </div>
                  {lab.isHomeCollectionAvailable && (
                    <div className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">
                      Home Collection Available
                    </div>
                  )}
                </div>

                {labTest.preparationInstructions && (
                  <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mb-4">
                    <span className="text-[10px] font-bold text-orange-600 uppercase block mb-1">Preparation Note</span>
                    <p className="text-xs text-orange-800">{labTest.preparationInstructions}</p>
                  </div>
                )}

                <button 
                  onClick={() => onSelectLab(lab, labTest.price, labTest._id)}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all text-sm"
                >
                  Select this Center
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
