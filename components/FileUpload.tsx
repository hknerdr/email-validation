import React, { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

const FileUpload = () => {
  const { dispatch } = useAppContext();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseCSVContent = useCallback((content: string): string[] => {
    // Split by newlines and/or commas
    const rawEmails = content
      .split(/[\r\n,]+/)
      .map(line => line.trim())
      .filter(Boolean); // Remove empty lines

    // Validate and clean emails
    const validEmails = rawEmails
      .map(email => email.replace(/^["']|["']$/g, '').trim()) // Remove quotes
      .filter(email => validateEmail(email));

    return [...new Set(validEmails)]; // Remove duplicates
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        dispatch({ type: 'SET_ERROR', payload: 'Please select a CSV file' });
        setFile(null);
        e.target.value = ''; // Reset input
        return;
      }
      setFile(selectedFile);
      dispatch({ type: 'SET_ERROR', payload: null });
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a file first' });
      return;
    }

    setIsProcessing(true);
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const text = await file.text();
      const emails = parseCSVContent(text);

      if (emails.length === 0) {
        throw new Error('No valid email addresses found in the file');
      }

      dispatch({ type: 'SET_EMAILS', payload: emails });
      dispatch({
        type: 'SET_ERROR',
        payload: `Successfully loaded ${emails.length} email${emails.length > 1 ? 's' : ''}`
      });
      
      // Reset file input
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error instanceof Error ? error.message : 'Failed to process the file'
      });
      dispatch({ type: 'SET_EMAILS', payload: [] });
    } finally {
      setIsProcessing(false);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="my-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="p-2 border rounded"
          disabled={isProcessing}
        />
        <button
          onClick={handleFileUpload}
          disabled={!file || isProcessing}
          className={`px-4 py-2 rounded transition-colors ${
            !file || isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Upload Emails'}
        </button>
      </div>
      {file && (
        <p className="mt-2 text-sm text-gray-600">
          Selected file: {file.name}
        </p>
      )}
    </div>
  );
};

export default FileUpload;