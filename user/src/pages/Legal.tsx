import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface LegalProps {
  type: 'PrivacyPolicy' | 'TermsOfService';
}

export const Legal: React.FC<LegalProps> = ({ type }) => {
  const { apiUrl } = useAuth();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${apiUrl}/legal/${type}`);
        if (res.ok) {
          const data = await res.json();
          setContent(data.content);
        } else {
          setContent('Content not found.');
        }
      } catch (e) {
        console.error(e);
        setContent('Failed to load content.');
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [type, apiUrl]);

  const title = type === 'PrivacyPolicy' ? 'Privacy Policy' : 'Terms of Service';

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      <div className="flex items-center space-x-2 mb-6 border-b border-slate-100 pb-4">
        <ShieldCheck className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div 
          className="prose prose-sm prose-slate max-w-none text-slate-600"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
};
