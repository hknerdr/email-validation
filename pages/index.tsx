// pages/index.tsx
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
      console.log('Sending request to /api/validateBulk');
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails: state.emails, apiKey }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        console.error(`API error: ${data.error}`);
        throw new Error(data.error);
      }

      console.log('Validation results:', data.results);

      dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
    } catch (error) {
      console.error('Validation error:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Validation failed. Please try again.'
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Email Validator</h1>
      <div style={{ marginBottom: '20px' }}>
        <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
      </div>
      <FileUpload />
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={validateEmails}
          disabled={state.loading || !state.emails.length || !apiKey}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: state.loading || !state.emails.length || !apiKey ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state.loading || !state.emails.length || !apiKey ? 'not-allowed' : 'pointer'
          }}
        >
          {state.loading ? 'Validating...' : 'Validate Emails'}
        </button>
      </div>
      {state.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>{state.error}</div>
      )}
      {state.validatedEmails.length > 0 && (
        <ValidationResults validatedEmails={state.validatedEmails} />
      )}
    </div>
  );
};

export default IndexPage;
