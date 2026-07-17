import React, { useEffect, useState, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ConsultationBannerProps {
  sourceModule: string;
  reason: string;
  triggerCondition: string;
  riskLevel?: string;
  assessmentAnswers?: any;
  recommendedSpecialty: string;
  title?: string;
  description?: string;
  colorTheme?: 'amber' | 'rose' | 'indigo' | 'emerald' | 'purple';
  onBookAppointment: (recommendationId: string) => void;
}

export const ConsultationBanner: React.FC<ConsultationBannerProps> = ({
  sourceModule,
  reason,
  triggerCondition,
  riskLevel,
  assessmentAnswers,
  recommendedSpecialty,
  title = 'Consultation Recommended',
  description = 'Based on your recent logs, we recommend consulting a specialist.',
  colorTheme = 'amber',
  onBookAppointment
}) => {
  const { apiUrl, token } = useAuth();
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    // Fire the Viewed API only once when rendered
    if (loggedRef.current) return;
    loggedRef.current = true;

    const logRecommendation = async () => {
      try {
        const res = await fetch(`${apiUrl}/patient/consultations/log`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            sourceModule,
            reason,
            triggerCondition,
            riskLevel,
            assessmentAnswers,
            recommendedSpecialty,
            status: 'Viewed'
          })
        });
        const data = await res.json();
        if (data.recommendation?._id) {
          setRecommendationId(data.recommendation._id);
        }
      } catch (err) {
        console.error('Failed to log consultation recommendation', err);
      }
    };

    logRecommendation();
  }, [sourceModule, reason, triggerCondition, riskLevel, assessmentAnswers, recommendedSpecialty, apiUrl, token]);

  const handleBook = async () => {
    if (recommendationId) {
      try {
        await fetch(`${apiUrl}/patient/consultations/${recommendationId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Clicked' })
        });
      } catch (err) {
        console.error('Failed to log click', err);
      }
      onBookAppointment(recommendationId);
    } else {
      // Fallback if API hasn't responded yet
      onBookAppointment('pending_' + reason);
    }
  };

  const getThemeClasses = () => {
    switch (colorTheme) {
      case 'rose':
        return {
          container: 'bg-rose-50 border-rose-200',
          title: 'text-rose-800',
          desc: 'text-rose-700',
          btn: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'indigo':
        return {
          container: 'bg-indigo-50 border-indigo-200',
          title: 'text-indigo-800',
          desc: 'text-indigo-700',
          btn: 'bg-indigo-600 hover:bg-indigo-700 text-white'
        };
      case 'emerald':
        return {
          container: 'bg-emerald-50 border-emerald-200',
          title: 'text-emerald-800',
          desc: 'text-emerald-700',
          btn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
      case 'purple':
        return {
          container: 'bg-purple-50 border-purple-200',
          title: 'text-purple-800',
          desc: 'text-purple-700',
          btn: 'bg-purple-600 hover:bg-purple-700 text-white'
        };
      default: // amber
        return {
          container: 'bg-amber-50 border-amber-200',
          title: 'text-amber-800',
          desc: 'text-amber-700',
          btn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className={`mt-6 p-4 rounded-xl border ${theme.container}`}>
      <h4 className={`${theme.title} font-bold text-sm mb-1`}>{title}</h4>
      <p className={`${theme.desc} text-xs mb-3`}>{description}</p>
      <button 
        onClick={handleBook}
        className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${theme.btn}`}
      >
        Book Appointment <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
};
