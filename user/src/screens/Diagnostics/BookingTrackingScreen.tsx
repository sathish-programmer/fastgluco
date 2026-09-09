import React, { useState, useEffect } from 'react';
import { ArrowLeft, TestTube2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface BookingTrackingScreenProps {
  bookingId: string;
  onBack: () => void;
  onViewReport: (bookingId: string) => void;
}

export const BookingTrackingScreen: React.FC<BookingTrackingScreenProps> = ({ bookingId, onBack, onViewReport }) => {
  const { apiUrl, token } = useAuth();
  const { t } = useLanguage();
  const [timelines, setTimelines] = useState<any[]>([]);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [bookingId]);

  const fetchData = async () => {
    try {
      const [historyRes, timelineRes] = await Promise.all([
        fetch(`${apiUrl}/labs/booking/history`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/labs/booking/${bookingId}/timeline`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const historyData = await historyRes.json();
      const b = historyData.find((x: any) => x._id === bookingId);
      setBooking(b);
      
      const timelineData = await timelineRes.json();
      setTimelines(timelineData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-slate-400 font-bold animate-pulse">{t('common.loading', 'Loading tracking details...')}</div>;
  if (!booking) return <div className="p-10 text-center text-slate-500">{t('reportNotFound', 'Booking not found.')}</div>;

  const STATUS_STEPS = [
    { status: 'PENDING', label: t('bookingInitiated', 'Booking Initiated') },
    { status: 'CONFIRMED', label: t('confirmedByLab', 'Confirmed by Lab') },
    { status: 'SAMPLE_ASSIGNED', label: t('agentAssigned', 'Phlebotomist Assigned') },
    { status: 'SAMPLE_COLLECTED', label: t('sampleCollected', 'Sample Collected') },
    { status: 'IN_PROCESSING', label: t('processingInLab', 'Processing in Lab') },
    { status: 'REPORT_READY', label: t('reportGenerated', 'Report Generated') }
  ];

  const currentStatusIndex = STATUS_STEPS.findIndex(s => s.status === booking.status);

  return (
    <div className="pb-32 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t('status', 'Tracking')}</span>
          <h2 className="text-2xl font-bold text-slate-800 leading-none mt-1">Booking #{booking._id.slice(-6).toUpperCase()}</h2>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-slate-800">{booking.labTestId?.cancerScreeningTestId?.name || 'Screening Test'}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{booking.laboratoryId?.name}</p>
          </div>
          <div className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold">
            {new Date(booking.preferredDate).toLocaleDateString()}
          </div>
        </div>

        <div className="relative pl-6 border-l-2 border-slate-100 ml-4 py-2 space-y-8">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStatusIndex >= idx;
            const timelineRecord = timelines.find(tItem => tItem.status === step.status);

            return (
              <div key={step.status} className="relative">
                <div className={`absolute -left-[35px] h-6 w-6 rounded-full flex items-center justify-center border-2 bg-white ${
                  isCompleted ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                }`}>
                  {isCompleted && <Check className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${isCompleted ? 'text-slate-800' : 'text-slate-400'}`}>
                    {step.label}
                  </h4>
                  {timelineRecord && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      {new Date(timelineRecord.createdAt).toLocaleString()}
                    </p>
                  )}
                  {timelineRecord?.note && (
                    <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      {timelineRecord.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {booking.status === 'REPORT_READY' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
            <h4 className="font-bold text-green-800 text-sm mb-1 flex items-center gap-2">
              <Check className="h-4 w-4" /> {t('reportGenerated', 'Report is Ready!')}
            </h4>
            <p className="text-xs text-green-700 leading-relaxed">
              {t('reportReadyCollection', 'Your test report has been finalized and is ready for download.')}
            </p>
          </div>
          <button 
            onClick={() => onViewReport(booking._id)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <TestTube2 className="h-5 w-5" /> {t('viewLabReport', 'View Digital Report')}
          </button>
        </div>
      )}
    </div>
  );
};
