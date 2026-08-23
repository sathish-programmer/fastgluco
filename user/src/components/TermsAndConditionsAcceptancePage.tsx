import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Heart, ArrowDownCircle, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const CURRENT_TERMS_VERSION = '1.0';

interface TermsAndConditionsAcceptancePageProps {
  onAccepted?: () => void;
}

export const TermsAndConditionsAcceptancePage: React.FC<TermsAndConditionsAcceptancePageProps> = ({ onAccepted }) => {
  const { apiUrl, branding, acceptTerms, logout, user } = useAuth();

  const [documentContent, setDocumentContent] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState<boolean>(true);

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<boolean>(false);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch legal terms document from backend
  useEffect(() => {
    let isMounted = true;
    const fetchTermsDocument = async () => {
      setLoadingDoc(true);
      try {
        const res = await fetch(`${apiUrl}/legal/TermsOfService`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.content && data.content.trim().length > 200 && !data.content.includes('Test Terms')) {
            setDocumentContent(data.content);
          }
        }
      } catch (err) {
        console.error('Error fetching terms document:', err);
      } finally {
        if (isMounted) setLoadingDoc(false);
      }
    };

    fetchTermsDocument();
    return () => {
      isMounted = false;
    };
  }, [apiUrl]);

  // Scroll detection handler
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || hasScrolledToBottom) return;

    // Check if scrolled within 30px of the bottom
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 30;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // Smooth scroll to bottom button helper
  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleAccept = async () => {
    if (!hasScrolledToBottom || !isCheckboxChecked || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const success = await acceptTerms(CURRENT_TERMS_VERSION);
      if (success) {
        if (onAccepted) {
          onAccepted();
        }
      } else {
        setErrorMessage('Failed to record acceptance. Please check your network connection and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const logoSrc = branding.appLogoUrl
    ? (branding.appLogoUrl.startsWith('http') ? branding.appLogoUrl : `${apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl}${branding.appLogoUrl.startsWith('/') ? '' : '/'}${branding.appLogoUrl}`)
    : null;

  const defaultFullDocument = `
    <div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #334155; max-width: 100%;">
      <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
        <h2 style="font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0 0 0.25rem 0; letter-spacing: -0.02em;">MITOREBOOT PRIVATE LIMITED</h2>
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
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART B – MITOREBOOT SCORES AND ALGORITHMS</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">3. DAMAGE, REPAIR, RISK AND OTHER SCORES</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may generate scores or indices relating to concepts such as:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Cellular or biological damage</li>
          <li style="margin-bottom: 0.25rem;">Repair capacity</li>
          <li style="margin-bottom: 0.25rem;">Lifestyle or metabolic health</li>
          <li style="margin-bottom: 0.25rem;">Environmental exposure</li>
          <li style="margin-bottom: 0.25rem;">Wellness</li>
          <li style="margin-bottom: 0.25rem;">Health risk</li>
          <li style="margin-bottom: 0.25rem;">Cancer-related risk awareness</li>
          <li style="margin-bottom: 0.25rem;">Other parameters developed by MitoReboot</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">These scores are intended to provide health-awareness and educational information. Unless specifically stated otherwise and supported by appropriate scientific validation, such scores:</p>
        <ol style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: decimal; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Are not diagnostic tests.</li>
          <li style="margin-bottom: 0.25rem;">Are not validated cancer prediction tests.</li>
          <li style="margin-bottom: 0.25rem;">Do not establish the presence or absence of cancer.</li>
          <li style="margin-bottom: 0.25rem;">Do not establish an individual’s probability of developing cancer.</li>
          <li style="margin-bottom: 0.25rem;">Do not establish causation between a particular exposure and cancer.</li>
          <li style="margin-bottom: 0.25rem;">Should not be used as the sole basis for medical decision-making.</li>
        </ol>
        <p style="font-size: 0.875rem; margin-bottom: 1.25rem;">A favourable score does not guarantee good health or absence of disease, and an unfavourable score does not establish the presence of disease.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">4. ALGORITHMS, ARTIFICIAL INTELLIGENCE AND AUTOMATED OUTPUTS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Certain MitoReboot features may use algorithms, statistical models, machine-learning systems or artificial intelligence. Such outputs may contain inaccuracies, omissions, limitations or errors.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Automated outputs are intended to assist health awareness and should not be interpreted as a definitive medical opinion. Where an AI or algorithmic feature is used, the user remains responsible for seeking appropriate professional medical advice before making significant health-related decisions.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">MitoReboot may modify, improve, replace or discontinue algorithms and scoring methodologies from time to time.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART C – HEALTH, CGM AND WEARABLE DATA</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">5. HEALTH INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Users may voluntarily provide information including:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Medical history</li>
          <li style="margin-bottom: 0.25rem;">Family history</li>
          <li style="margin-bottom: 0.25rem;">Cancer history</li>
          <li style="margin-bottom: 0.25rem;">Treatment information</li>
          <li style="margin-bottom: 0.25rem;">Laboratory reports</li>
          <li style="margin-bottom: 0.25rem;">Medication information</li>
          <li style="margin-bottom: 0.25rem;">Dietary information</li>
          <li style="margin-bottom: 0.25rem;">Fasting information</li>
          <li style="margin-bottom: 0.25rem;">Exercise and activity</li>
          <li style="margin-bottom: 0.25rem;">Sleep</li>
          <li style="margin-bottom: 0.25rem;">Stress and wellbeing</li>
          <li style="margin-bottom: 0.25rem;">Blood glucose information</li>
          <li style="margin-bottom: 0.25rem;">Other health-related information</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Such information may constitute personal or sensitive health information under applicable law.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.25rem;">MitoReboot will process such information in accordance with applicable privacy and data-protection requirements.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">6. CGM AND CONNECTED DEVICE DISCLAIMER</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may permit integration with compatible continuous glucose monitoring systems, wearable devices, health applications or other third-party platforms. Data obtained through such integrations may contain:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Sensor inaccuracies</li>
          <li style="margin-bottom: 0.25rem;">Delays</li>
          <li style="margin-bottom: 0.25rem;">Missing data</li>
          <li style="margin-bottom: 0.25rem;">Transmission errors</li>
          <li style="margin-bottom: 0.25rem;">Device-related errors</li>
          <li style="margin-bottom: 0.25rem;">Incorrect user-entered information</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot does not guarantee the accuracy, completeness or uninterrupted availability of data supplied by third-party devices or platforms.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot should not be used as the sole basis for emergency glucose-management decisions.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users using glucose-lowering medication or insulin should follow the instructions of their treating healthcare professional and the applicable device manufacturer’s guidance.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART D – FASTING, NUTRITION AND LIFESTYLE</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">7. FASTING AND DIETARY INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may provide educational information regarding:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Intermittent fasting</li>
          <li style="margin-bottom: 0.25rem;">Fasting duration</li>
          <li style="margin-bottom: 0.25rem;">Meal timing</li>
          <li style="margin-bottom: 0.25rem;">Dietary patterns</li>
          <li style="margin-bottom: 0.25rem;">Low-carbohydrate approaches</li>
          <li style="margin-bottom: 0.25rem;">Metabolic health</li>
          <li style="margin-bottom: 0.25rem;">Lifestyle modification</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Such information is educational and does not constitute an individualised medical prescription.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Fasting and dietary interventions may not be appropriate for every individual.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Users should obtain professional medical advice before undertaking significant dietary or fasting changes, particularly where they have a medical condition, take medication, are pregnant or breastfeeding, have nutritional concerns, or otherwise require medical supervision.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">MitoReboot does not guarantee that any particular fasting or dietary approach will prevent cancer or improve an individual’s health outcome.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART E – ENVIRONMENTAL EXPOSURE</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">8. ENVIRONMENTAL EXPOSURE INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may provide information relating to potential exposure to factors such as:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Air pollution</li>
          <li style="margin-bottom: 0.25rem;">Water quality</li>
          <li style="margin-bottom: 0.25rem;">Pesticides</li>
          <li style="margin-bottom: 0.25rem;">Heavy metals</li>
          <li style="margin-bottom: 0.25rem;">Microplastics</li>
          <li style="margin-bottom: 0.25rem;">Food-related exposures</li>
          <li style="margin-bottom: 0.25rem;">Household or occupational exposures</li>
          <li style="margin-bottom: 0.25rem;">Other environmental factors</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Environmental information may be derived from user inputs, publicly available information, databases, scientific literature, third-party information or other sources.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Such information is subject to geographical, temporal and scientific limitations.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">An environmental exposure score does not establish that an individual has been exposed to a particular substance, nor does it establish that a particular exposure caused or will cause cancer.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Individual exposure assessment may require specialised environmental, occupational, laboratory or clinical evaluation.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART F – CANCER AND PREVENTION</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">9. CANCER RISK DISCLAIMER</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may provide cancer-awareness, prevention and lifestyle information.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Cancer is a complex disease influenced by multiple factors including genetics, age, lifestyle, environment, chance and other biological factors.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">No lifestyle intervention or digital platform can guarantee prevention of cancer.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot does not guarantee that following any recommendation, achieving any score or using any feature will prevent cancer, reduce cancer risk or improve cancer treatment outcomes.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users should continue to follow established cancer-screening recommendations and medical advice appropriate to their individual circumstances.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART G – RESEARCH AND SCIENTIFIC INFORMATION</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">10. SCIENTIFIC AND RESEARCH INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may present information derived from scientific publications, clinical research, observational studies, ongoing research, emerging evidence or internal research.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Scientific evidence evolves over time.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The existence of a scientific publication or research finding does not necessarily establish that the same finding applies to every individual.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Where information is based on preliminary, observational or emerging evidence, it should not be interpreted as definitive clinical evidence.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">MitoReboot may update information as scientific knowledge develops.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART H – PRIVACY AND DATA PROTECTION</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">11. INFORMATION WE COLLECT</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Depending on the features used, MitoReboot may collect:</p>
        
        <p style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem;">Account Information</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Name</li>
          <li>Age/date of birth</li>
          <li>Contact details</li>
          <li>Account credentials</li>
          <li>Subscription information</li>
        </ul>

        <p style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem;">Health Information</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Medical and family history</li>
          <li>Cancer-related information</li>
          <li>Laboratory data</li>
          <li>Glucose information</li>
          <li>Lifestyle and dietary information</li>
          <li>Fasting and activity information</li>
          <li>Stress and wellbeing information</li>
        </ul>

        <p style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem;">Environmental Information</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Air quality</li>
          <li>Water-related information</li>
          <li>Food and product usage</li>
          <li>Environmental exposure information</li>
        </ul>

        <p style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.25rem;">Technical Information</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1rem; list-style-type: disc; padding-left: 1rem;">
          <li>Device information</li>
          <li>Operating system</li>
          <li>Application version</li>
          <li>IP address</li>
          <li>Log information</li>
          <li>Crash and diagnostic information</li>
          <li>Usage information</li>
        </ul>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">12. PURPOSE OF DATA PROCESSING</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Information may be processed to:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1rem; list-style-type: disc; padding-left: 1rem;">
          <li>Provide MitoReboot services.</li>
          <li>Create user dashboards and reports.</li>
          <li>Generate scores and insights.</li>
          <li>Provide requested recommendations.</li>
          <li>Integrate connected devices.</li>
          <li>Process subscriptions and payments.</li>
          <li>Provide customer support.</li>
          <li>Improve the Platform.</li>
          <li>Conduct legitimate research and product development.</li>
          <li>Maintain security.</li>
          <li>Detect fraud or misuse.</li>
          <li>Comply with legal obligations.</li>
        </ul>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">13. CONSENT</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Where consent is required by applicable law, MitoReboot will obtain appropriate consent before processing personal information for the relevant purpose.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Users may withdraw consent where legally permitted.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Withdrawal of consent may result in certain features becoming unavailable.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">14. DATA SHARING</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot does not intend to sell users’ personal health information as a commercial product.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Information may be shared, where necessary and legally permitted, with:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Cloud and hosting providers</li>
          <li>Technology providers</li>
          <li>Payment providers</li>
          <li>Analytics providers</li>
          <li>Security providers</li>
          <li>Professional service providers</li>
          <li>Healthcare or service partners where authorised</li>
          <li>Research collaborators where legally permitted and appropriately safeguarded</li>
          <li>Government or regulatory authorities where legally required</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">MitoReboot will take reasonable steps to ensure appropriate safeguards are applied to personal information handled by service providers.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">15. DE-IDENTIFIED AND AGGREGATED INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may create aggregated, statistical or de-identified information from user data.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Where permitted by applicable law, such information may be used for:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Scientific research</li>
          <li>Population-level analysis</li>
          <li>Product development</li>
          <li>Educational purposes</li>
          <li>Quality improvement</li>
          <li>Scientific publications or presentations</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Reasonable measures will be taken to prevent such information from being used to identify individual users.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">16. DATA SECURITY</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot will implement reasonable technical, organisational and administrative safeguards designed to protect personal information.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">However, no digital platform, internet transmission, database or electronic storage system can be guaranteed to be completely secure.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Accordingly, MitoReboot cannot guarantee absolute security of information.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">17. DATA RETENTION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Personal information may be retained for as long as reasonably necessary to provide services, fulfil legitimate business purposes, comply with legal obligations, resolve disputes, enforce agreements or satisfy applicable regulatory requirements.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">When information is no longer required, it may be deleted, anonymised or securely disposed of, subject to applicable law.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">18. USER PRIVACY RIGHTS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Subject to applicable law, users may have rights to:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li>Access their personal information.</li>
          <li>Correct inaccurate information.</li>
          <li>Request deletion where legally permitted.</li>
          <li>Withdraw consent where applicable.</li>
          <li>Raise privacy concerns or complaints.</li>
          <li>Exercise other rights available under applicable data-protection laws.</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Requests may be made through the contact details provided below.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART I – THIRD-PARTY SERVICES AND PRODUCTS</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">19. THIRD-PARTY PLATFORMS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may integrate with third-party applications, devices, health platforms and other services.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot is not responsible for the independent privacy policies, security practices, availability or accuracy of third-party services.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Users should review the applicable third-party terms and privacy policies before connecting their accounts.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">20. THIRD-PARTY PRODUCTS AND SERVICES</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may display, recommend, list or facilitate access to products and services supplied by independent third parties.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may receive commissions, referral fees or other commercial consideration from certain transactions. Where applicable, such relationships will be disclosed.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The listing or recommendation of a product does not constitute a guarantee, certification or medical endorsement of that product.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The manufacturer, seller or service provider remains responsible for the quality, safety, legality and performance of its products or services.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users should independently evaluate products before purchase or use.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART J – PAYMENTS AND SUBSCRIPTIONS</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">21. PAYMENTS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Payments may be processed through authorised third-party payment gateways.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may not directly store complete payment-card information where payment processing is performed by a third-party payment provider.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Users are subject to the applicable terms and privacy policies of the payment provider.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">22. SUBSCRIPTIONS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">Where MitoReboot offers paid subscriptions:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 1.5rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Applicable subscription fees will be displayed before purchase.</li>
          <li style="margin-bottom: 0.25rem;">Subscription terms may vary by plan.</li>
          <li style="margin-bottom: 0.25rem;">Taxes, where applicable, may be charged in accordance with law.</li>
          <li style="margin-bottom: 0.25rem;">Refunds, cancellations and renewals will be governed by the applicable subscription terms displayed at the time of purchase.</li>
        </ul>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART K – EMERGENCY AND SAFETY</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">23. EMERGENCY DISCLAIMER</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot is not an emergency medical service.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The Platform should not be used for emergency diagnosis, monitoring or treatment.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">In the event of severe symptoms, suspected medical emergency, dangerously abnormal readings or other urgent health concerns, users should immediately seek appropriate medical attention or contact the relevant emergency medical service.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users should not delay emergency care while attempting to use or interpret MitoReboot.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART L – CHILDREN</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">24. MINORS</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot does not knowingly seek to collect personal information from children without appropriate parental or guardian involvement where required by applicable law.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Where use by a minor is permitted, appropriate consent and supervision requirements may apply.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART M – USER RESPONSIBILITY</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">25. USER-PROVIDED INFORMATION</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Users are responsible for providing information that is reasonably accurate and complete.</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may rely upon information supplied by users or received from connected services.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Incorrect, incomplete or outdated information may result in inaccurate scores, reports or recommendations.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">26. ACCOUNT SECURITY</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Users are responsible for maintaining the confidentiality of their login credentials and for activity conducted through their account.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users should immediately notify MitoReboot if they suspect unauthorised access to their account.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART N – LIMITATION OF LIABILITY</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">27. LIMITATION OF LIABILITY</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">To the maximum extent permitted by applicable law, MitoReboot Private Limited, its directors, officers, employees, consultants, affiliates, contractors and service providers shall not be liable for any loss, injury, damage, medical outcome, financial loss or other consequence arising from:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Reliance upon information provided through the Platform.</li>
          <li style="margin-bottom: 0.25rem;">Interpretation or use of MitoReboot scores.</li>
          <li style="margin-bottom: 0.25rem;">Incorrect or incomplete user-provided information.</li>
          <li style="margin-bottom: 0.25rem;">Errors in third-party device or platform data.</li>
          <li style="margin-bottom: 0.25rem;">Decisions made by a user based solely on MitoReboot information.</li>
          <li style="margin-bottom: 0.25rem;">Failure of a third-party device, platform or service.</li>
          <li style="margin-bottom: 0.25rem;">Interruption or unavailability of the Platform.</li>
          <li style="margin-bottom: 0.25rem;">Cybersecurity incidents beyond reasonable control.</li>
          <li style="margin-bottom: 0.25rem;">Use or purchase of third-party products or services.</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Nothing in this document shall exclude or limit liability to the extent such exclusion or limitation is prohibited by applicable law.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART O – INTELLECTUAL PROPERTY</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">28. OWNERSHIP</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">Unless otherwise stated, the MitoReboot name, logo, application, website, software, interface, graphics, content, reports, scoring methodology, algorithms, databases, educational material and other intellectual property are owned by or licensed to MitoReboot Private Limited.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Users may not copy, reproduce, modify, reverse engineer, distribute, commercialise or exploit MitoReboot intellectual property without prior written permission, except where permitted by law.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART P – CHANGES TO SERVICES AND DOCUMENT</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">29. MODIFICATION OF SERVICES</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">MitoReboot may modify, update, suspend or discontinue features, algorithms, scoring systems, integrations or services from time to time.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Certain features may become unavailable because of technical, regulatory, commercial or third-party limitations.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">30. CHANGES TO THIS DOCUMENT</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;">MitoReboot may periodically update this document to reflect changes in:</p>
        <ul style="font-size: 0.875rem; margin-left: 1.25rem; margin-bottom: 0.75rem; list-style-type: disc; padding-left: 1rem;">
          <li style="margin-bottom: 0.25rem;">Applicable law</li>
          <li style="margin-bottom: 0.25rem;">Technology</li>
          <li style="margin-bottom: 0.25rem;">Services</li>
          <li style="margin-bottom: 0.25rem;">Data-processing practices</li>
          <li style="margin-bottom: 0.25rem;">Scientific evidence</li>
          <li style="margin-bottom: 0.25rem;">Business operations</li>
        </ul>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">The updated version will be made available through the Platform.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Continued use of MitoReboot following an applicable update may constitute acceptance of the revised terms to the extent permitted by law.</p>
      </div>

      <div style="margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.1rem; font-weight: 800; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.35rem; margin-top: 1.5rem; margin-bottom: 0.75rem;">PART Q – GOVERNING LAW AND GRIEVANCE</h3>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">31. GOVERNING LAW</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem;">This document shall be governed by the applicable laws of India, subject to applicable statutory and regulatory requirements.</p>
        <p style="font-size: 0.875rem; margin-bottom: 1rem;">Any disputes shall be subject to the jurisdiction of the courts having appropriate jurisdiction over the Company, unless otherwise required by applicable law.</p>

        <h4 style="font-size: 0.95rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">32. PRIVACY AND GRIEVANCE CONTACT</h4>
        <p style="font-size: 0.875rem; margin-bottom: 0.5rem;"><strong>MitoReboot Private Limited</strong></p>
        <p style="font-size: 0.875rem; margin-bottom: 0.35rem;">Registered Office: MitoReboot Private Limited, Tamil Nadu, India</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.35rem;">Email: privacy@mitoreboot.in / support@mitoreboot.in</p>
        <p style="font-size: 0.875rem; margin-bottom: 0.35rem;">Privacy/Grievance Officer: Grievance Officer, MitoReboot Private Limited</p>
        <p style="font-size: 0.875rem; margin-bottom: 1.5rem;">Contact: +91-9597042107 / privacy@mitoreboot.in</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 1.25rem; border-radius: 0.875rem; margin-top: 1.5rem; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.05rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem 0;">PART R – USER ACKNOWLEDGEMENT AND CONSENT</h3>
        <p style="font-size: 0.875rem; margin-bottom: 0.75rem; font-weight: 600;">Before using MitoReboot, the user acknowledges that:</p>
        <ul style="font-size: 0.8125rem; margin-left: 1.25rem; margin-bottom: 1rem; list-style-type: square; padding-left: 1rem; color: #334155;">
          <li style="margin-bottom: 0.35rem;">I have read and understood this Master Disclaimer, Privacy Notice and Terms of Use.</li>
          <li style="margin-bottom: 0.35rem;">I understand that MitoReboot is not a substitute for professional medical advice, diagnosis or treatment.</li>
          <li style="margin-bottom: 0.35rem;">I understand that MitoReboot scores and algorithmic outputs are not necessarily medically validated diagnostic or predictive tests.</li>
          <li style="margin-bottom: 0.35rem;">I understand that a favourable score does not mean that I am free from disease or cancer risk.</li>
          <li style="margin-bottom: 0.35rem;">I understand that an unfavourable score does not mean that I have cancer or another disease.</li>
          <li style="margin-bottom: 0.35rem;">I understand that information obtained from CGMs, wearables and third-party platforms may contain errors.</li>
          <li style="margin-bottom: 0.35rem;">I understand that fasting, dietary and lifestyle recommendations may not be appropriate for everyone.</li>
          <li style="margin-bottom: 0.35rem;">I understand that environmental exposure information and scores do not establish individual exposure or causation.</li>
          <li style="margin-bottom: 0.35rem;">I understand that MitoReboot does not guarantee prevention, diagnosis or treatment of cancer or any other disease.</li>
          <li style="margin-bottom: 0.35rem;">I understand how my personal and health-related information may be collected, processed and used as described in this document.</li>
          <li style="margin-bottom: 0.35rem;">I understand that third-party products, services and platforms may be subject to separate terms and privacy policies.</li>
          <li style="margin-bottom: 0.35rem;">I understand that MitoReboot is not an emergency medical service.</li>
          <li style="margin-bottom: 0.35rem;">I agree to the processing of my information in accordance with this Privacy Notice and applicable law.</li>
        </ul>

        <div style="background: white; border: 1px solid #e2e8f0; padding: 0.875rem; border-radius: 0.5rem; font-size: 0.8125rem; color: #1e293b; margin-top: 0.75rem;">
          <p style="margin: 0 0 0.35rem 0;"><strong>User Digital Acceptance Record:</strong></p>
          <p style="margin: 0 0 0.25rem 0;"><strong>User Name:</strong> ${user?.name || 'Valued User'}</p>
          <p style="margin: 0 0 0.25rem 0;"><strong>Registered Mobile/Email:</strong> ${user?.mobileNumber || user?.email || 'N/A'}</p>
          <p style="margin: 0 0 0.25rem 0;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 0;"><strong>Digital Signature / Acceptance:</strong> Confirmed via Authenticated User Session (v${CURRENT_TERMS_VERSION})</p>
        </div>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fde68a; padding: 1rem; border-radius: 0.75rem; margin-top: 1.5rem; text-align: center;">
        <p style="font-size: 0.875rem; font-weight: 800; color: #92400e; margin: 0 0 0.35rem 0;">IMPORTANT NOTICE</p>
        <p style="font-size: 0.8125rem; color: #78350f; margin: 0 0 0.5rem 0; line-height: 1.5;">MitoReboot is intended to support health awareness, education and informed engagement with healthcare. It is not intended to replace qualified medical care.<br/>Do not use MitoReboot as the sole basis for diagnosing, preventing or treating cancer or any other medical condition.</p>
        <p style="font-size: 0.75rem; color: #92400e; font-weight: 700; margin: 0;">© MitoReboot Private Limited. All Rights Reserved.</p>
      </div>
    </div>
  `;

  const rawContent = (documentContent && documentContent.trim().length > 300 && !documentContent.includes('Test Terms'))
    ? documentContent
    : defaultFullDocument;

  const userDisplayName = user?.name || user?.email || user?.mobileNumber || 'Valued User';
  const userContactInfo = [user?.mobileNumber, user?.email].filter(Boolean).join(' / ') || user?.email || user?.mobileNumber || 'N/A';
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const processedContent = rawContent
    .replace(/Registered Mobile\/Email:\s*([^\n<]*)/g, `Registered Mobile/Email: <strong style="color: #0f172a; font-weight: 800;">${userContactInfo}</strong>`)
    .replace(/User Name:\s*([^\n<]*)/g, `User Name: <strong style="color: #0f172a; font-weight: 800;">${userDisplayName}</strong>`)
    .replace(/Date:\s*([^\n<]*)/g, `Date: <strong style="color: #0f172a; font-weight: 800;">${formattedDate}</strong>`)
    .replace(/Signature \/ Digital Acceptance:\s*([^\n<]*)/g, `Signature / Digital Acceptance: <strong style="color: #0f172a; font-weight: 800;">Confirmed via Authenticated User Session (v${CURRENT_TERMS_VERSION})</strong>`)
    .replace(/(?<!Mobile\/)Email:\s*([^\n<]+)/g, `Email: support@gmail.com / mitoreboot@gmail.com`)
    .replace(/Contact:\s*([^\n<]+)/g, `Contact: support@gmail.com / mitoreboot@gmail.com`);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col h-full w-full overflow-hidden select-none transition-colors duration-300">
      {/* Header Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3.5 shadow-sm flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-light text-primary rounded-xl">
            {logoSrc ? (
              <img src={logoSrc} alt={branding.appName} className="h-6 w-auto object-contain" />
            ) : (
              <Heart className="h-5 w-5 fill-primary text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
              {branding.appName}
            </h1>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Terms & Conditions Verification (v{CURRENT_TERMS_VERSION})
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          Logout
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col min-h-0">
        {/* Title Banner */}
        <div className="mb-4 shrink-0">
          <div className="flex items-center space-x-2 text-primary mb-1">
            <ShieldCheck className="h-6 w-6" />
            <span className="text-xs font-bold uppercase tracking-wider bg-primary-light text-primary px-2.5 py-0.5 rounded-full">
              Mandatory Agreement
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Master Disclaimer, Privacy Notice & Terms of Use
          </h2>
          <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Please read the complete MitoReboot Master Disclaimer, Privacy Notice, and Terms of Use carefully. You must scroll to the bottom of the document before accepting.
          </p>
        </div>

        {/* Scroll Banner Indicator */}
        {!hasScrolledToBottom && !loadingDoc && (
          <div className="mb-3 shrink-0 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl px-4 py-2.5 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 text-xs font-bold">
              <ArrowDownCircle className="h-4 w-4 shrink-0" />
              <span>Please scroll to the bottom to continue.</span>
            </div>
            <button
              onClick={scrollToBottom}
              className="text-[11px] font-extrabold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg shadow-sm transition-all"
            >
              Scroll to Bottom
            </button>
          </div>
        )}

        {hasScrolledToBottom && (
          <div className="mb-3 shrink-0 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl px-4 py-2.5 flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>You have reached the bottom of the document. You may now accept the terms below.</span>
          </div>
        )}

        {/* Scrollable Terms Container */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 overflow-y-auto shadow-inner text-slate-700 dark:text-slate-300 text-sm leading-relaxed max-w-none transition-colors duration-300"
        >
          {loadingDoc ? (
            <div className="flex flex-col justify-center items-center h-48 space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-xs font-bold text-slate-500">Loading document...</p>
            </div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: processedContent }} />
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 shrink-0 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl p-3 flex items-center space-x-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Footer Acceptance Action Box */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm space-y-4">
          <label
            className={`flex items-start space-x-3 cursor-pointer select-none transition-opacity ${
              hasScrolledToBottom ? 'opacity-100' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={isCheckboxChecked}
              disabled={!hasScrolledToBottom || isSubmitting}
              onChange={(e) => setIsCheckboxChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary disabled:cursor-not-allowed"
            />
            <span className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              I have read and understood the Master Disclaimer, Privacy Notice and Terms of Use, and I agree to be bound by them.
            </span>
          </label>

          <button
            type="button"
            disabled={!hasScrolledToBottom || !isCheckboxChecked || isSubmitting}
            onClick={handleAccept}
            className={`w-full py-3.5 px-6 rounded-xl font-black text-sm tracking-wide transition-all shadow-md flex items-center justify-center space-x-2 ${
              hasScrolledToBottom && isCheckboxChecked && !isSubmitting
                ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/25 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed shadow-none'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Saving Acceptance...</span>
              </>
            ) : (
              <span>Accept & Continue</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
