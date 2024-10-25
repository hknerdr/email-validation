// pages/index.tsx

import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { FileUpload } from '../components/FileUpload';
import { ApiKeyInput } from '../components/ApiKeyInput';
import { ValidationResults } from '../components/ValidationResults';

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

      const data = await response.json();

      if (data.error) {
        dispatch({ type: 'SET_ERROR', payload: data.error });
      } else {
        dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Validation failed. Please try again.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Email Validator</h1>
      <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
      <FileUpload />
      <button 
        onClick={validateEmails} 
        disabled={state.loading || !state.emails.length || !apiKey}
        style={{ padding: '10px', marginTop: '10px' }}
      >
        {state.loading ? 'Validating...' : 'Validate Emails'}
      </button>
      {state.error && <p style={{ color: 'red' }}>{state.error}</p>}
      <ValidationResults validatedEmails={state.validatedEmails} />
    </div>
  );
};

export default IndexPage;
