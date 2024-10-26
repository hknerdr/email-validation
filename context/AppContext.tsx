import React, { useState, useReducer, useCallback } from 'react';

// Initial state for the reducer
const initialState = {
  emails: [],
  validatedEmails: [],
  loading: false,
  error: null,
};

// Reducer function to manage state
const reducer = (state, action) => {
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

// Email validation regex
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const EmailValidator = () => {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  // Parse CSV content and update state
  const parseCSVContent = useCallback((content) => {
    const emails = content
      .split(/[\r\n]+/)
      .map(line => line.trim())
      .filter(line => line && validateEmail(line));
    dispatch({ type: 'SET_EMAILS', payload: emails });
  }, []);

  // Handle file input change
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        dispatch({ type: 'SET_ERROR', payload: 'Please select a CSV file' });
        return;
      }
      setFile(selectedFile);
      dispatch({ type: 'SET_ERROR', payload: null });
      setMessage('File uploaded successfully.');

      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        if (typeof content === 'string') {
          parseCSVContent(content);
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Invalid file content.' });
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  // Validate emails by sending to the API
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
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Email Validator</h1>

      {/* API Key Input */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="apiKey">API Key:</label>
        <input
          type="text"
          id="apiKey"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            marginTop: '5px',
            borderRadius: '4px',
            border: '1px solid #ccc',
          }}
          placeholder="Enter your API key"
        />
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="fileUpload">Upload CSV File:</label>
        <input
          type="file"
          id="fileUpload"
          accept=".csv"
          onChange={handleFileChange}
          style={{
            display: 'block',
            marginTop: '5px',
          }}
        />
      </div>

      {/* Upload Message */}
      {message && (
        <div style={{ color: 'green', marginBottom: '20px' }}>{message}</div>
      )}

      {/* Error Message */}
      {state.error && (
        <div style={{ color: 'red', marginBottom: '20px' }}>{state.error}</div>
      )}

      {/* Validate Emails Button */}
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
            cursor: state.loading || !state.emails.length || !apiKey ? 'not-allowed' : 'pointer',
          }}
        >
          {state.loading ? 'Validating...' : 'Validate Emails'}
        </button>
      </div>

      {/* Validation Results */}
      {state.validatedEmails.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h2>Validation Results:</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Email</th>
                <th style={{ border: '1px solid #ddd', padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.validatedEmails.map((item, index) => (
                <tr key={index}>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.email}</td>
                  <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                    {item.isValid ? 'Valid' : 'Invalid'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmailValidator;
