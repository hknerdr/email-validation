// context/AppContext.tsx
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface Email {
  email: string;
  is_valid: boolean;
  reason?: string;
  success?: boolean;
}

export interface AppState {
  emails: string[];
  validatedEmails: Email[];
  loading: boolean;
  error: string | null;
}

export type AppAction =
  | { type: 'SET_EMAILS'; payload: string[] }
  | { type: 'SET_VALIDATED_EMAILS'; payload: Email[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

export interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const initialState: AppState = {
  emails: [],
  validatedEmails: [],
  loading: false,
  error: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EMAILS':
      return { ...state, emails: action.payload };
    case 'SET_VALIDATED_EMAILS':
      return { ...state, validatedEmails: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}