import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';

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
  verifyCredentials: () => Promise<boolean>;
}

const CREDENTIALS_COOKIE_NAME = 'aws_credentials';
const CredentialsContext = createContext<CredentialsContextType | undefined>(undefined);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentialsState] = useState<AWSCredentials | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Load credentials from cookie on mount
  useEffect(() => {
    const loadCredentials = async () => {
      const savedCreds = Cookies.get(CREDENTIALS_COOKIE_NAME);
      if (savedCreds) {
        try {
          const parsedCreds = JSON.parse(savedCreds);
          setCredentialsState(parsedCreds);
          // Verify the loaded credentials
          const verified = await verifyCredentials(parsedCreds);
          setIsVerified(verified);
          if (!verified) {
            // Clear invalid credentials
            clearCredentials();
          }
        } catch (error) {
          console.error('Failed to load credentials:', error);
          clearCredentials();
        }
      }
    };

    loadCredentials();
  }, []);

  const verifyCredentials = async (creds: AWSCredentials | null = credentials): Promise<boolean> => {
    if (!creds) return false;

    try {
      const response = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds),
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Credential verification failed:', error);
      return false;
    }
  };

  const setCredentials = useCallback(async (creds: AWSCredentials): Promise<boolean> => {
    try {
      const response = await fetch('/api/test-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(creds),
      });

      const data = await response.json();

      if (data.success) {
        // Store credentials in cookie
        Cookies.set(CREDENTIALS_COOKIE_NAME, JSON.stringify(creds), { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict'
        });
        
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
    Cookies.remove(CREDENTIALS_COOKIE_NAME);
    setCredentialsState(null);
    setIsVerified(false);
  }, []);

  const value = {
    credentials,
    isVerified,
    setCredentials,
    clearCredentials,
    verifyCredentials
  };

  return (
    <CredentialsContext.Provider value={value}>
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