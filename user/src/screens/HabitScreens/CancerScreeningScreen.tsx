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

const GROUPS = [
  {
    id: "women-under40",
    title: "Women, under 40",
    accent: "#C1682E",
    tests: [
      {
        name: "Breast self-exam / breast awareness",
        freq: "Monthly",
        note: "Get familiar with how your breasts normally look and feel, on the same days each cycle. Report any new lump, skin change, or discharge promptly.",
        evidence: "Trial data hasn't shown formal monthly self-exam reduces breast cancer deaths, and it can lead to extra biopsies — most guidelines now favour general breast awareness over a rigid technique. In India, where most breast cancers are still caught late, many clinicians still teach it as a low-cost early-detection habit.",
        video: { label: "NHS — How to check your breasts or chest", url: "https://www.youtube.com/watch?v=xcg7jWrlLJ8" },
      },
      {
        name: "Pap smear",
        freq: "Every 3 years, from age 21 (or within 3 years of first intercourse)",
        note: "Screens for cervical pre-cancer/cancer.",
      },
      {
        name: "HPV vaccination",
        freq: "One-time series if not already given",
        note: "Most effective before first sexual activity; catch-up doses are still worthwhile later — discuss timing with a gynaecologist.",
      },
    ],
  },
  {
    id: "women-over40",
    title: "Women, 40 and over",
    accent: "#A13E2B",
    tests: [
      { name: "Breast self-exam / breast awareness", freq: "Monthly", note: "As above — continue alongside clinical exam and mammogram." },
      { name: "Mammogram", freq: "Yearly", note: "Digital mammography for early detection; add breast ultrasound/MRI if dense breast tissue or high risk." },
      { name: "Pap smear", freq: "Every 3 years (or HPV co-testing every 5 years, per gynaecologist)", note: "Continue until roughly age 65 or as advised." },
      {
        name: "CA-125",
        freq: "Yearly (as an adjunct, not a standalone screen)",
        note: "For ovarian cancer risk awareness.",
        evidence: "CA-125 alone has poor specificity in average-risk women and isn't endorsed as a population screening test by most bodies — it's more useful for women with a strong family history/BRCA status or alongside pelvic ultrasound and symptom review.",
      },
    ],
  },
  {
    id: "men-smokers",
    title: "Men who smoke, any age",
    accent: "#5B4A8A",
    tests: [
      {
        name: "Low-dose CT chest (LDCT)",
        freq: "Yearly",
        note: "Screens for lung cancer.",
        evidence: "Most guidelines (USPSTF, NCCN) reserve annual LDCT for heavier, longer-term smokers — typically ages 50–80 with a substantial pack-year history, current smokers or those who quit within 15 years. Worth risk-stratifying by pack-years rather than applying to every smoker regardless of age.",
      },
      { name: "Oral cancer screening", freq: "Yearly, or sooner if lesions noticed", note: "Visual and physical exam of the mouth/throat — especially important with any tobacco use (smoked or chewed), given India's high oral cancer burden." },
      {
        name: "S. CEA",
        freq: "Yearly (as an adjunct)",
        note: "Carcinoembryonic antigen, sometimes used as a general tumour-marker check.",
        evidence: "CEA isn't validated as a standalone screening test for any cancer — it's mainly used to monitor known GI/colorectal cancer, not to detect a new one. A raised level should prompt further work-up, not reassurance either way if normal.",
      },
    ],
  },
  {
    id: "men-nonsmokers-60",
    title: "Men, non-smokers, 60 and over",
    accent: "#3E7C6B",
    tests: [
      {
        name: "S. PSA",
        freq: "Yearly",
        note: "Prostate-specific antigen, for prostate cancer risk awareness.",
        evidence: "PSA screening involves a real trade-off between catching aggressive cancers early and over-detecting slow-growing ones that would never cause harm. Most guidelines suggest shared decision-making rather than routine yearly testing for every man — worth framing that way in-app.",
      },
    ],
  },
];

const SYMPTOMS = [
  "Non-healing mouth ulcer, or a white/red patch inside the mouth",
  "Persistent hoarseness of voice or a cough",
  "A lump or thickening anywhere — breast, neck, testicle, or elsewhere",
  "Unusual bleeding or discharge — between periods, after menopause, after intercourse, or blood in urine/sputum",
  "Blood in stools, or black/tarry stools",
  "Change in stool passing routine — new constipation, diarrhoea, or altered frequency lasting beyond a few days",
  "Change in bladder habits",
  "Difficulty swallowing, or persistent indigestion/acidity",
  "Unexplained weight loss",
  "Persistent fatigue that doesn't improve with rest",
  "A sore that doesn't heal, or a mole/wart that changes size, shape, or colour",
  "Unexplained, persistent pain — abdominal, bone, or otherwise",
  "Unexplained fever or night sweats",
];

const TAB_LABELS: { [key: string]: string } = {
  "women-under40": "Women <40",
  "women-over40": "Women 40+",
  "men-smokers": "Men, smokers",
  "men-nonsmokers-60": "Men 60+",
};

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
  const [activeTab, setActiveTab] = useState(GROUPS[0].id);
  const [tests, setTests] = useState<TestItem[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  
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
      if (user.gender === 'Female') {
        if (user.age && user.age >= 40) {
          setActiveTab('women-over40');
        } else {
          setActiveTab('women-under40');
        }
      } else if (user.gender === 'Male') {
        if (user.age && user.age >= 60) {
          setActiveTab('men-nonsmokers-60');
        } else {
          setActiveTab('men-smokers');
        }
      }
    }
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

  const findMatchingDbTest = (tName: string) => {
    const normName = tName.toLowerCase().replace(/s\.\s+/, 'serum ').replace('smear', '').trim();
    return tests.find(t => {
      const dbNorm = t.name.toLowerCase().replace(/s\.\s+/, 'serum ').replace('smear', '').trim();
      return dbNorm.includes(normName) || normName.includes(dbNorm);
    });
  };

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

  const activeGroup = GROUPS.find((g) => g.id === activeTab) || GROUPS[0];

  return (
    <div className="pb-24 pt-6 px-4 max-w-3xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen font-sans antialiased text-slate-800 dark:text-slate-100 space-y-6 transition-colors duration-300">
        <div className="flex items-center gap-4 sub-page-internal-header">
          <button 
            onClick={onBack}
            className="h-10 w-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-[0.14em] uppercase">Mito Reboot · Cancer Screening</span>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none mt-1">Screening Guide by Age & Risk Group</h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-white/65 dark:bg-slate-900/65 p-3.5 rounded-2xl border border-slate-200/50 dark:border-slate-800">
          General guidance for adults in India. This isn't personalised medical advice — actual intervals should be set with a treating doctor based on individual and family history.
        </p>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex sticky top-0 z-10">
          {GROUPS.map((g) => {
            const isActive = g.id === activeTab;
            return (
              <button
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className="flex-1 text-center py-3.5 px-2 text-xs font-bold transition-all border-b-3"
                style={{
                  borderBottom: `3px solid ${isActive ? g.accent : "transparent"}`,
                  color: isActive ? g.accent : "#8A7B5E",
                }}
              >
                {TAB_LABELS[g.id]}
              </button>
            );
          })}
        </div>

        <section
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: activeGroup.accent }}
        >
          <h3 className="text-base font-bold mb-4" style={{ color: activeGroup.accent }}>{activeGroup.title}</h3>
          
          {testsLoading ? (
            <div className="text-center py-6 text-xs font-bold text-slate-405 animate-pulse">Loading tests information...</div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeGroup.tests.map((test, idx) => {
                const matchedDbTest = findMatchingDbTest(test.name);
                return (
                  <TestRowItem
                    key={idx}
                    test={test}
                    matchedDbTest={matchedDbTest}
                    onBook={() => {
                      if (matchedDbTest) {
                        setSelectedTest(matchedDbTest);
                        setActiveView('LABS');
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#5B4A8A] dark:text-indigo-400 uppercase tracking-wider mb-2">High genetic risk / strong family history</h3>
          <p className="text-xs text-[#4A3E63] dark:text-indigo-350 bg-[#EFE9F5] dark:bg-indigo-950/20 border border-[#DCD0EA] dark:border-indigo-900/30 rounded-2xl p-3.5 leading-relaxed">
            <strong>Whole-body MRI</strong> — yearly, from age 60 — is suggested in addition to the standard screening above for individuals with a known genetic predisposition (e.g. BRCA1/2, Lynch syndrome) or a strong family history of cancer, or anyone otherwise assessed as high-risk. This should be discussed with a genetic counsellor or oncologist rather than done as a routine test for the general population.
          </p>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-sm font-extrabold text-[#A13E2B] dark:text-rose-400 uppercase tracking-wider mb-2">Watch for these symptoms</h3>
          <div className="text-xs text-[#6B5B3E] dark:text-amber-400 bg-[#F3EAD8] dark:bg-amber-950/20 border border-[#E0D3B8] dark:border-amber-900/30 rounded-2xl p-3.5 font-bold mb-3">
            Rule of thumb: if any symptom below lasts more than 3 weeks, consult a doctor — don't wait it out.
          </div>
          <ul className="list-disc pl-5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
            {SYMPTOMS.map((s, i) => (
              <li key={i} className="leading-relaxed">{s}</li>
            ))}
          </ul>
        </section>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl p-5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-4">Already completed this test elsewhere?</span>
          
          <div className="flex flex-col gap-3 mb-4">
            <input 
              type="text" 
              placeholder="Test (PSA, CA-125...)" 
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30"
            />
            <div className="flex gap-3">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30"
              />
              <input 
                type="text" 
                placeholder="Result / value" 
                value={result}
                onChange={(e) => setResult(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30"
              />
            </div>
            <input 
              type="text" 
              placeholder="Note (e.g. follow-up booked)" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/30"
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
                <div key={h.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-slate-450" /> {h.value.testName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-450 mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {h.value.date}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 block">{h.value.result}</span>
                    {h.value.note && <span className="text-[9px] text-slate-400 dark:text-slate-500 block max-w-[120px] truncate">{h.value.note}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
};

const TestRowItem: React.FC<{
  test: any;
  matchedDbTest: any;
  onBook: () => void;
}> = ({ test, matchedDbTest, onBook }) => {
  const [showEvidence, setShowEvidence] = useState(false);

  return (
    <div className="py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 animate-in fade-in duration-200">
      <div className="flex justify-between items-baseline gap-2">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{test.name}</h4>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">{test.freq}</span>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">{test.note}</p>

      {test.video && (
        <a
          href={test.video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-2 text-xs text-teal-800 dark:text-teal-400 font-bold hover:underline"
        >
          ▶️ {test.video.label}
        </a>
      )}

      {test.evidence && (
        <div className="mt-2.5">
          <button
            onClick={() => setShowEvidence((s) => !s)}
            className="text-[11px] text-[#B08A3E] dark:text-[#d3a950] font-bold focus:outline-none"
          >
            {showEvidence ? "Hide clinical note ▲" : "Clinical note ▼"}
          </button>
          {showEvidence && (
            <p className="text-xs text-[#6B5F4A] dark:text-amber-350 bg-[#F3EAD8]/60 dark:bg-amber-950/20 border border-[#E7DECD] dark:border-amber-900/35 rounded-xl p-3 mt-2 leading-relaxed">
              {test.evidence}
            </p>
          )}
        </div>
      )}

      {matchedDbTest && (
        <button
          onClick={onBook}
          className="mt-3 px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
        >
          Book Appointment Test
        </button>
      )}
    </div>
  );
};
