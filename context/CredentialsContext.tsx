// context/CredentialsContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

interface CredentialsContextType {
  credentials: Credentials | null;
  setCredentials: (credentials: Credentials | null) => void;
  isVerified: boolean;
}

const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: React.ReactNode }) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const handleSetCredentials = (newCredentials: Credentials | null) => {
    setCredentials(newCredentials);
    setIsVerified(!!newCredentials);
  };

  return (
    <CredentialsContext.Provider 
      value={{ 
        credentials, 
        setCredentials: handleSetCredentials,
        isVerified
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