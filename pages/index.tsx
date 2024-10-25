import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationResults from '../components/ValidationResults';

const IndexPage = () => {
  const { state, dispatch } = useAppContext();
  const [apiKey, setApiKey] = useState('');

  const validateEmails = async () => {
    if (!state.emails.length) {
      dispatch({ type: 'SET_ERROR', payload: 'No emails uploaded.' });
      return;
    }
    if (!apiKey) {
      dispatch({ type: 'SET_ERROR', payload: 'API key is required.' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: state.emails, apiKey }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error 
          ? error.message 
          : 'Validation failed. Please try again.'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email Validator</h1>
      <div className="space-y-6">
        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
        <FileUpload />
        <div>
          <button 
            onClick={validateEmails} 
            disabled={state.loading || !state.emails.length || !apiKey}
            className={`px-4 py-2 rounded transition-colors ${
              state.loading || !state.emails.length || !apiKey
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {state.loading ? 'Validating...' : 'Validate Emails'}
          </button>
          {state.error && (
            <p className="mt-2 text-red-500">{state.error}</p>
          )}
          {state.emails.length > 0 && !state.error && (
            <p className="mt-2 text-green-600">
              {state.emails.length} email{state.emails.length > 1 ? 's' : ''} ready for validation
            </p>
          )}
        </div>
        {state.validatedEmails.length > 0 && (
          <ValidationResults validatedEmails={state.validatedEmails} />
        )}
      </div>
    </div>
  );
};

export default IndexPage;