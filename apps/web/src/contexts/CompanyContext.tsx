'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface CompanyContextValue {
  companyId: string | null;
  setCompanyId: (nextId: string | null) => void;
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined);

const DEV_FALLBACK_COMPANY_ID = process.env.NEXT_PUBLIC_DEV_COMPANY_ID ?? 'cmfmbojit0000vj0ch078cnbu';
const DEFAULT_COMPANY_ID = process.env.NEXT_PUBLIC_COMPANY_ID || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_COMPANY_ID : null);
const STORAGE_KEY = 'logistics-company-id';

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('🔍 CompanyContext Debug:', {
    NEXT_PUBLIC_COMPANY_ID: process.env.NEXT_PUBLIC_COMPANY_ID,
    NEXT_PUBLIC_DEV_COMPANY_ID: process.env.NEXT_PUBLIC_DEV_COMPANY_ID,
    NODE_ENV: process.env.NODE_ENV,
    DEV_FALLBACK_COMPANY_ID,
    DEFAULT_COMPANY_ID,
  });
}

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyId, setCompanyIdState] = useState<string | null>(DEFAULT_COMPANY_ID);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    console.log('🔍 CompanyProvider useEffect - Initial state:', { companyId, DEFAULT_COMPANY_ID });

    // Clear any old/invalid stored company ID
    const storedCompanyId = window.localStorage.getItem(STORAGE_KEY);
    console.log('🔍 Stored company ID:', storedCompanyId);

    // Priority: 1. Valid stored ID, 2. Environment variable, 3. Fallback
    let finalCompanyId: string | null = null;

    if (storedCompanyId && storedCompanyId.length > 10) {
      finalCompanyId = storedCompanyId;
      console.log('✅ Using stored company ID:', finalCompanyId);
    } else if (DEFAULT_COMPANY_ID) {
      finalCompanyId = DEFAULT_COMPANY_ID;
      console.log('✅ Using environment company ID:', finalCompanyId);
      // Store it for next time
      window.localStorage.setItem(STORAGE_KEY, finalCompanyId);
    } else {
      // Force fallback to development company
      finalCompanyId = DEV_FALLBACK_COMPANY_ID;
      console.log('🔄 Force using DEV fallback company ID:', finalCompanyId);
      window.localStorage.setItem(STORAGE_KEY, finalCompanyId);
    }

    if (finalCompanyId && finalCompanyId !== companyId) {
      console.log('🔄 Setting company ID to:', finalCompanyId);
      setCompanyIdState(finalCompanyId);
    }
  }, []);

  const setCompanyId = (nextId: string | null) => {
    setCompanyIdState(nextId);
    if (typeof window !== 'undefined') {
      if (nextId) {
        window.localStorage.setItem(STORAGE_KEY, nextId);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  const value = useMemo<CompanyContextValue>(() => ({ companyId, setCompanyId }), [companyId]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export function useCompany() {
  const context = useContext(CompanyContext);

  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }

  return context;
}
