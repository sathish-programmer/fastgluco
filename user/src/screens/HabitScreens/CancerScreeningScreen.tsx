import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Save, Beaker } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { HabitsService, type HabitLog } from '../../services/habitsService';
import { PartnerLabsScreen } from '../Diagnostics/PartnerLabsScreen';
import { BookingSlotScreen } from '../Diagnostics/BookingSlotScreen';
import { PaymentScreen } from '../Diagnostics/PaymentScreen';
import { BookingTrackingScreen } from '../Diagnostics/BookingTrackingScreen';
import { ReportViewerScreen } from '../Diagnostics/ReportViewerScreen';

interface CancerScreeningScreenProps {
  onBack: () => void;
}

interface TestItem {
  id: string; // Ensure this is mapped correctly from _id
  _id?: string;
  name: string;
  description: string;
  frequency: string;
  category: 'Male' | 'Female' | 'Universal';
  whyItIsNeeded?: string;
  recommendedAge?: string;
  generalPreparationInstructions?: string;
}

export const CancerScreeningScreen: React.FC<CancerScreeningScreenProps> = ({ onBack }) => {
  const { user, apiUrl, token } = useAuth();
  
  // Navigation State
  const [activeView, setActiveView] = useState<'TEST_LIST' | 'LABS' | 'SLOTS' | 'PAYMENT' | 'TRACKING' | 'REPORT'>('TEST_LIST');
  
  // Flow Data
  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  const [selectedLab, setSelectedLab] = useState<any>(null);
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [bookingData, setBookingData] = useState<any>(null);
  const [activeBookingId, setActiveBookingId] = useState<string>('');
  const [selectedLabTestId, setSelectedLabTestId] = useState<string | null>(null);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [tab, setTab] = useState<'Male' | 'Female' | 'Universal'>('Universal');
  const [tests, setTests] = useState<TestItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [testName, setTestName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HabitLog[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadHistory();
    }
    if (user?.gender === 'Male') setTab('Male');
    if (user?.gender === 'Female') setTab('Female');

    fetchTests();
  }, [user]);

  const fetchTests = async () => {
    try {
      const res = await fetch(`${apiUrl}/screening/tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setTests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTestsLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const logs = await HabitsService.getRecentHabits(apiUrl, token, 'CancerScreening', 365);
      setHistory(logs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!user?.id || !testName || !date || !result) return;
    setLoading(true);
    try {
      await HabitsService.logHabit(apiUrl, token, 'CancerScreening', {
        testName,
        date,
        result,
        note
      });
      setTestName('');
      setResult('');
      setNote('');
      await loadHistory();
    } catch (err) {
      console.error('Failed to save result', err);
    } finally {
      setLoading(false);
    }
  };

  const currentTabTests = tests.filter(t => {
    if (searchQuery) {
      return t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             t.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (tab === 'Universal') return true;
    return t.category === tab || t.category === 'Universal';
  });

  if (activeView === 'LABS' && selectedTest) {
    return <PartnerLabsScreen testId={selectedTest._id || selectedTest.id} testName={selectedTest.name} onBack={() => setActiveView('TEST_LIST')} onSelectLab={(lab, price, labTestId) => { setSelectedLab(lab); setSelectedPrice(price); setSelectedLabTestId(labTestId); setActiveView('SLOTS'); }} />;
  }

  if (activeView === 'SLOTS' && selectedLab) {
    return <BookingSlotScreen lab={selectedLab} testPrice={selectedPrice} onBack={() => setActiveView('LABS')} onContinue={(data) => { setBookingData(data); setActiveView('PAYMENT'); }} />;
  }

  if (activeView === 'PAYMENT' && bookingData && selectedLab && selectedLabTestId) {
    return <PaymentScreen bookingData={bookingData} testPrice={selectedPrice} lab={selectedLab} testId={selectedLabTestId} onBack={() => setActiveView('SLOTS')} onSuccess={(id) => { setActiveBookingId(id); setActiveView('TRACKING'); }} />;
  }

  if (activeView === 'TRACKING' && activeBookingId) {
    return <BookingTrackingScreen bookingId={activeBookingId} onBack={() => setActiveView('TEST_LIST')} onViewReport={(id) => { setActiveBookingId(id); setActiveView('REPORT'); }} />;
  }

  if (activeView === 'REPORT' && activeBookingId) {
    return <ReportViewerScreen bookingId={activeBookingId} onBack={() => setActiveView('TRACKING')} />;
  }

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
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Catch it early</span>
          <h2 className="text-2xl font-sans font-bold text-slate-800 leading-none mt-1">Cancer screening</h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 mb-6">
        <h3 className="font-bold text-slate-800 mb-1.5">Early detection saves lives.</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Pick a profile for the tests worth discussing with your doctor.
        </p>
      </div>

      <div className="flex bg-slate-200/50 p-1 rounded-xl mb-6 shadow-inner">
        {(['Male', 'Female', 'Universal'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'Universal' ? 'All Tests' : t}
          </button>
        ))}
      </div>

      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search for tests (e.g. colonoscopy, PSA...)" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-3 px-10 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 shadow-sm"
        />
        <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        {testsLoading ? (
          <div className="text-center py-6 text-xs font-bold text-slate-400 animate-pulse">Loading tests...</div>
        ) : currentTabTests.length === 0 ? (
          <div className="text-center py-6 text-xs font-bold text-slate-400">No tests added for this category.</div>
        ) : (
          currentTabTests.map((test, idx) => (
            <div key={idx} className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                  <span className="text-xl">🧬</span> {test.name}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                  <Calendar className="h-3 w-3" />
                  {test.frequency}
                </div>
              </div>
              
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {test.description}
              </p>

              {expandedTestId === test.id && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  {test.whyItIsNeeded && (
                    <div className="bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Why it's needed</span>
                      <p className="text-xs text-slate-700 leading-relaxed">{test.whyItIsNeeded}</p>
                    </div>
                  )}
                  {!test.whyItIsNeeded && !test.recommendedAge && !test.generalPreparationInstructions && (
                    <div className="bg-slate-50 p-3 rounded-xl mb-3 border border-slate-100">
                      <p className="text-xs text-slate-500 italic">No additional details available for this test yet.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {test.recommendedAge && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Age</span>
                        <p className="text-xs text-slate-700 font-medium">{test.recommendedAge}</p>
                      </div>
                    )}
                    {test.generalPreparationInstructions && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Preparation</span>
                        <p className="text-xs text-slate-700 font-medium">{test.generalPreparationInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => { setSelectedTest(test); setActiveView('LABS'); }}
                  className="flex-1 py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                >
                  Book Test
                </button>
                <button 
                  onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  {expandedTestId === test.id ? 'Hide Details' : 'Learn More'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 mb-6">
        <span className="text-xs font-bold text-slate-500 block mb-4">Already completed this test elsewhere?</span>
        
        <div className="flex flex-col gap-3 mb-4">
          <input 
            type="text" 
            placeholder="Test (PSA, CA-125...)" 
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="flex gap-3">
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <input 
              type="text" 
              placeholder="Result / value" 
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <input 
            type="text" 
            placeholder="Note (e.g. follow-up booked)" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={loading || !testName || !result}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? 'Saving...' : <><Save className="h-4 w-4" /> Save result</>}
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase block mb-3">Previous Results</span>
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex justify-between items-center">
                <div>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Beaker className="h-4 w-4 text-slate-400" /> {h.value.testName}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {h.value.date}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-indigo-600 block">{h.value.result}</span>
                  {h.value.note && <span className="text-[9px] text-slate-400 block max-w-[120px] truncate">{h.value.note}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
