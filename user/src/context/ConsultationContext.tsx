import React, { createContext, useContext, useState } from 'react';

interface ConsultationContextType {
  pendingRecommendationId: string | null;
  setPendingRecommendationId: (id: string | null) => void;
}

const ConsultationContext = createContext<ConsultationContextType | undefined>(undefined);

export const ConsultationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingRecommendationId, setPendingRecommendationId] = useState<string | null>(null);

  return (
    <ConsultationContext.Provider value={{ pendingRecommendationId, setPendingRecommendationId }}>
      {children}
    </ConsultationContext.Provider>
  );
};

export const useConsultation = () => {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error('useConsultation must be used within a ConsultationProvider');
  }
  return context;
};
