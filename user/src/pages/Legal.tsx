import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';
import { CURRENT_TERMS_VERSION } from '../components/TermsAndConditionsAcceptancePage';

interface LegalProps {
  type: string;
  onBack?: () => void;
}

export const Legal: React.FC<LegalProps> = ({ type, onBack }) => {
  const { apiUrl, user } = useAuth();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Convert tab names like "Terms of Service" or "TermsofService" -> "TermsOfService"
  const docType = (type || '').toLowerCase().includes('terms')
    ? 'TermsOfService'
    : (type || 'PrivacyPolicy').replace(/\s+/g, '');

  useEffect(() => {
    let isMounted = true;
    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${apiUrl}/legal/${docType}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.content) {
            setContent(data.content);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchContent();
    return () => {
      isMounted = false;
    };
  }, [docType, apiUrl]);

  const isTerms = docType.toLowerCase().includes('terms');

  const userDisplayName = user?.name || user?.email || user?.mobileNumber || 'Valued User';
  const userContactInfo = [user?.mobileNumber, user?.email].filter(Boolean).join(' / ') || user?.email || user?.mobileNumber || 'N/A';
  const formattedDate = user?.termsAcceptedAt
    ? new Date(user.termsAcceptedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rawContent = (content && content.trim().length > 200 && !content.includes('Test Terms'))
    ? content
    : isTerms
    ? `
      <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 100%;">
        <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 0.25rem 0;">MITOREBOOT PRIVATE LIMITED</h2>
          <h3 style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem 0;">MASTER DISCLAIMER, PRIVACY NOTICE & TERMS OF USE</h3>
          <p style="font-size: 0.875rem; color: #64748b; font-weight: 600; margin: 0;">For the MitoReboot Application, Website and Related Services</p>
          <p style="font-size: 0.8125rem; color: #475569; font-weight: 600; margin-top: 0.35rem;">Effective Date: August 23, 2026 &nbsp;|&nbsp; Last Updated: August 23, 2026</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h4 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin-top: 1.25rem; margin-bottom: 0.5rem;">1. INTRODUCTION</h4>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot is a digital health, wellness, lifestyle and health-awareness platform developed and operated by <strong>MitoReboot Private Limited</strong> ("MitoReboot", "Company", "we", "us" or "our").</p>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The Platform may provide users with tools for recording, organising and analysing information relating to lifestyle, nutrition, fasting, glucose patterns, environmental exposures, stress, wellness and other health-related parameters.</p>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Certain features may generate scores, trends, insights, reports, educational information or recommendations based on information supplied by the user, information obtained from connected devices or third-party services, and/or algorithms developed or used by MitoReboot.</p>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">This document applies to all three modes of MitoReboot and to all related features, services, websites, applications, dashboards, reports and digital communications unless a specific additional notice is provided.</p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">By accessing, registering for or using MitoReboot, you acknowledge that you have read and understood this document and agree to be bound by its terms.</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART A – MEDICAL AND HEALTH DISCLAIMER</h3>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">2. NOT A SUBSTITUTE FOR MEDICAL CARE</h4>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot is intended primarily as a health-awareness, wellness, educational and informational platform.</p>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Unless a specific feature has been expressly identified and appropriately validated and authorised for a particular medical purpose, MitoReboot is not a medical device, diagnostic service, emergency medical service or substitute for consultation with a qualified healthcare professional.</p>
          <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Information, scores, graphs, reports, recommendations and other outputs provided by MitoReboot should not be considered a diagnosis, prognosis, prescription or definitive medical opinion.</p>
          <p style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a;">Users should not:</p>
          <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1.25rem; list-style-type: disc; padding-left: 1rem;">
            <li style="margin-bottom: 0.35rem;">Start, stop or alter medication based solely on MitoReboot.</li>
            <li style="margin-bottom: 0.35rem;">Change cancer treatment based solely on MitoReboot.</li>
            <li style="margin-bottom: 0.35rem;">Delay medical consultation because of a favourable MitoReboot score.</li>
            <li style="margin-bottom: 0.35rem;">Assume that a low score means absence of disease or cancer risk.</li>
            <li style="margin-bottom: 0.35rem;">Assume that a high score means that cancer or another disease is present.</li>
          </ul>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Medical decisions should be made in consultation with an appropriately qualified healthcare professional.</p>
        </div>

        <div style="margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART Q – GOVERNING LAW AND GRIEVANCE</h3>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">32. PRIVACY AND GRIEVANCE CONTACT</h4>
          <p style="font-size: 0.875rem; margin-bottom: 0.35rem;"><strong>MitoReboot Private Limited</strong></p>
          <p style="font-size: 0.875rem; margin-bottom: 0.35rem;">Email: support@gmail.com / mitoreboot@gmail.com</p>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Contact: support@gmail.com / mitoreboot@gmail.com</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 1.25rem; border-radius: 0.875rem; margin-top: 1.5rem; margin-bottom: 1.5rem;">
          <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem 0;">PART R – USER ACKNOWLEDGEMENT AND CONSENT</h3>
          <div style="background: white; border: 1px solid #e2e8f0; padding: 1rem; border-radius: 0.5rem; font-size: 0.875rem; color: #1e293b; line-height: 1.8;">
            <p style="margin: 0 0 0.5rem 0;">User Name: ____________________________________</p>
            <p style="margin: 0 0 0.5rem 0;">Registered Mobile/Email: _________________________</p>
            <p style="margin: 0 0 0.5rem 0;">Date: __________________________________________</p>
            <p style="margin: 0;">Signature / Digital Acceptance: ___________________</p>
          </div>
        </div>
      </div>
    `
    : '<p>Content not found.</p>';

  const processedContent = rawContent
    .replace(/Registered Mobile\/Email:\s*([^\n<]*)/g, `Registered Mobile/Email: <strong style="color: #0f172a; font-weight: 800;">${userContactInfo}</strong>`)
    .replace(/User Name:\s*([^\n<]*)/g, `User Name: <strong style="color: #0f172a; font-weight: 800;">${userDisplayName}</strong>`)
    .replace(/Date:\s*([^\n<]*)/g, `Date: <strong style="color: #0f172a; font-weight: 800;">${formattedDate}</strong>`)
    .replace(/Signature \/ Digital Acceptance:\s*([^\n<]*)/g, `Signature / Digital Acceptance: <strong style="color: #0f172a; font-weight: 800;">Confirmed via Authenticated User Session (v${user?.acceptedTermsVersion || CURRENT_TERMS_VERSION})</strong>`)
    .replace(/(?<!Mobile\/)Email:\s*([^\n<]+)/g, `Email: support@gmail.com / mitoreboot@gmail.com`)
    .replace(/Contact:\s*([^\n<]+)/g, `Contact: support@gmail.com / mitoreboot@gmail.com`);

  const headerTitle = isTerms ? 'Terms & Conditions' : (type || 'Privacy Policy');

  return (
    <div className="pb-24 pt-4 px-4 max-w-5xl mx-auto bg-white dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="flex items-center justify-between gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-all shrink-0"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
          )}
          <div className="p-1.5 bg-primary/10 text-primary rounded-xl shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white truncate">
            {headerTitle}
          </h2>
        </div>

        {user?.termsAccepted && isTerms && (
          <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold rounded-full shrink-0">
            ✓ Accepted (v{user.acceptedTermsVersion || '1.0'})
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div 
          className="prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      )}
    </div>
  );
};
