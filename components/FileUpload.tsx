import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const FileUpload = () => {
  const { state, dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseCSVContent = useCallback((content: string): string[] => {
    return content
      .split(/[\r\n]+/)
      .map(line => line.trim())
      .filter(line => line && validateEmail(line));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        dispatch({ type: 'SET_ERROR', payload: 'Please select a CSV file' });
        return;
      }
      setFile(selectedFile);
      dispatch({ type: 'SET_ERROR', payload: null });
      setMessage(null);
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a file first' });
      return;
    }

    setIsProcessing(true);
    dispatch({ type: 'SET_ERROR', payload: null });
    setMessage(null);

    try {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          if (!content) {
            throw new Error('Could not read file content');
          }

          const emails = parseCSVContent(content);

          if (emails.length === 0) {
            throw new Error('No valid email addresses found in the file');
          }

          // Update state with the parsed emails
          dispatch({ type: 'SET_EMAILS', payload: emails });
          setMessage(`Successfully loaded ${emails.length} email${emails.length > 1 ? 's' : ''}`);
        } catch (error) {
          dispatch({
            type: 'SET_ERROR',
            payload: error instanceof Error ? error.message : 'Failed to process the file'
          });
          dispatch({ type: 'SET_EMAILS', payload: [] });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        dispatch({ type: 'SET_ERROR', payload: 'Error reading the file' });
        setIsProcessing(false);
      };

      reader.readAsText(file);
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to process the file'
      });
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ marginRight: '1rem' }}
          disabled={isProcessing}
        />
        <button
          onClick={handleFileUpload}
          disabled={!file || isProcessing}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: !file || isProcessing ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !file || isProcessing ? 'not-allowed' : 'pointer'
          }}
        >
          {isProcessing ? 'Processing...' : 'Upload Emails'}
        </button>
      </div>
      {file && (
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Selected file: {file.name}
        </div>
      )}
      {message && (
        <div style={{ marginTop: '1rem', color: '#4CAF50' }}>
          {message}
        </div>
      )}
      {state.error && (
        <div style={{ color: 'red', marginTop: '1rem' }}>{state.error}</div>
      )}
    </div>
  );
};

export default FileUpload;
