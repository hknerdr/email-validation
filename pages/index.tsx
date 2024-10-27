// pages/index.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { ValidationResult } from '../utils/types';

const IndexPage = () => {
  const [emails, setEmails] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    results: ValidationResult[];
    stats: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<Array<{
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
    timestamp: string;
  }>>([]);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date().toLocaleTimeString()
    }]);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      const emailList = lines
        .map(line => line.trim())
        .filter(line => line && line.includes('@'));

      if (emailList.length === 0) {
        setError('No valid email addresses found in the file');
        return;
      }

      setEmails(emailList);
      addLog(`Successfully loaded ${emailList.length} emails`, 'success');
    } catch (error) {
      setError('Error reading file');
      addLog('Failed to read file', 'error');
    }
  }, [addLog]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  const handleValidation = async () => {
    if (emails.length === 0) {
      setError('Please upload a file with emails first');
      return;
    }

    setIsValidating(true);
    setError(null);
    addLog('Starting validation process...', 'info');
    addLog(`Validating ${emails.length} emails`, 'info');

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setValidationResults(data);
      addLog(`Validation completed successfully`, 'success');
      addLog(`Found ${data.stats.valid} valid emails`, 'success');
      addLog(`Found ${data.stats.invalid} invalid emails`, 'warning');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      addLog('Validation failed', 'error');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/30 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Email Validator</h1>
            {emails.length > 0 && (
              <span className="text-sm text-gray-500">
                {emails.length} emails loaded
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Upload & Controls */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Email List
              </h2>
              
              <div 
                {...getRootProps()} 
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
                  transition-colors duration-200 ease-in-out
                  ${isDragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <input {...getInputProps()} />
                <div className="space-y-2">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M24 8v20m0-20l-8 8m8-8l8 8m-8 12h8a8 8 0 008-8V12a8 8 0 00-8-8h-8a8 8 0 00-8 8v20a8 8 0 008 8z"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-gray-600">
                    {isDragActive ? (
                      <p>Drop the CSV file here</p>
                    ) : (
                      <p>Drag & drop a CSV file here, or click to select</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Only CSV files are supported</p>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Validation Button */}
            <button
              onClick={handleValidation}
              disabled={isValidating || emails.length === 0}
              className={`
                w-full py-4 rounded-xl font-semibold text-white
                transition-all duration-200 ease-in-out
                flex items-center justify-center space-x-2
                ${isValidating || emails.length === 0
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isValidating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating...
                </>
              ) : (
                'Start Validation'
              )}
            </button>
          </div>

          {/* Right Panel - Results & Logs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress & Logs */}
            {(isValidating || logs.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Validation Progress
                </h2>
                <div className="space-y-4">
                  {/* Logs */}
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-sm">
                      {logs.map((log, index) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 ${
                            log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                            log.type === 'warning' ? 'text-yellow-400' :
                            'text-blue-400'
                          }`}
                        >
                          <span className="text-gray-500">[{log.timestamp}]</span>
                          <span>{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Validation Results */}
            {validationResults && !isValidating && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Validation Results
                </h2>
                <ValidationResults
                  results={validationResults.results}
                  stats={validationResults.stats}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default IndexPage;