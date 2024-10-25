import React, { createContext, useReducer, useContext, ReactNode } from 'react';

// Define the shape of the application's state.
interface AppState {
  emails: string[];
  apiKeys: string[];
  validatedEmails: any[];
  loading: boolean;
  error: string | null;
  isStopped: boolean;
}

// Initial state for the application.
const initialState: AppState = {
  emails: [],
  apiKeys: [''],
  validatedEmails: [],
  loading: false,
  error: null,
  isStopped: false,
};

// Define the possible actions that can be dispatched to the reducer.
type Action =
  | { type: 'SET_EMAILS'; payload: string[] }
  | { type: 'ADD_API_KEY'; payload: string }
  | { type: 'SET_API_KEYS'; payload: string[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_VALIDATED_EMAILS'; payload: any[] }
  | { type: 'STOP_VALIDATION' };

// Reducer function to manage state transitions.
const AppReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_EMAILS':
      return { ...state, emails: action.payload };
    case 'ADD_API_KEY':
      return { ...state, apiKeys: [...state.apiKeys, action.payload] };
    case 'SET_API_KEYS':
      return { ...state, apiKeys: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_VALIDATED_EMAILS':
      return { ...state, validatedEmails: action.payload };
    case 'STOP_VALIDATION':
      return { ...state, isStopped: true, loading: false };
    default:
      return state;
  }
};

// Create a context with a default value.
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => {} });

// Define the props expected by the AppProvider.
interface AppProviderProps {
  children: ReactNode;
}

// AppProvider component that wraps around the application.
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(AppReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to access the AppContext.
export const useAppContext = () => useContext(AppContext);
