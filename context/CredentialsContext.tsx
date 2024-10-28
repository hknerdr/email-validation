// context/CredentialsContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface CredentialsContextType {
  credentials: AWSCredentials | null;
  isVerified: boolean;
  setCredentials: (creds: AWSCredentials) => Promise<boolean>;
  clearCredentials: () => void;
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const setCredentials = useCallback(async (creds: AWSCredentials) => {
    try {
      const response = await fetch('/api/ses-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds),
      });

      const data = await response.json();

      if (data.success) {
        setCredentialsState(creds);
        setIsVerified(true);
        return true;
      } else {
        throw new Error(data.error || 'Failed to verify credentials');
      }
    } catch (error) {
      setCredentialsState(null);
      setIsVerified(false);
      throw error;
    }
  }, []);

  const clearCredentials = useCallback(() => {
    setCredentialsState(null);
    setIsVerified(false);
  }, []);

  return (
    <CredentialsContext.Provider
      value={{
        credentials,
        isVerified,
        setCredentials,
        clearCredentials,
      }}
    >
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialsContext);
  if (context === undefined) {
    throw new Error('useCredentials must be used within a CredentialsProvider');
  }
  return context;
}
