'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ClientAuthContextType {
  isAuthenticated: boolean;
  clientId: string | null;
  clientName: string | null;
  clientCode: string | null;
  login: (clientId: string, clientName: string, clientCode: string) => void;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [clientCode, setClientCode] = useState<string | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('clientAuth');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setIsAuthenticated(true);
        setClientId(data.clientId);
        setClientName(data.clientName);
        setClientCode(data.clientCode);
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('clientAuth');
      }
    }
  }, []);

  const login = (id: string, name: string, code: string) => {
    setIsAuthenticated(true);
    setClientId(id);
    setClientName(name);
    setClientCode(code);

    // Persist to localStorage
    localStorage.setItem('clientAuth', JSON.stringify({
      clientId: id,
      clientName: name,
      clientCode: code,
    }));
  };

  const logout = () => {
    setIsAuthenticated(false);
    setClientId(null);
    setClientName(null);
    setClientCode(null);
    localStorage.removeItem('clientAuth');
  };

  return (
    <ClientAuthContext.Provider
      value={{
        isAuthenticated,
        clientId,
        clientName,
        clientCode,
        login,
        logout,
      }}
    >
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}
