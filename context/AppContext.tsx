import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// Define types for our state and actions
type Email = {
  email: string;
  isValid?: boolean;
};

type State = {
  emails: string[];
  validatedEmails: Email[];
  loading: boolean;
  error: string | null;
};

type Action =
  | { type: 'SET_EMAILS'; payload: string[] }
  | { type: 'SET_VALIDATED_EMAILS'; payload: Email[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

type AppContextType = {
  state: State;
  dispatch: React.Dispatch<Action>;
};

// Initial state
const initialState: State = {
  emails: [],
  validatedEmails: [],
  loading: false,
  error: null,
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Reducer function
const reducer = (state: State, action: Action): State => {
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
};

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppProvider;