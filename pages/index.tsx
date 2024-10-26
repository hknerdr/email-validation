import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FileUpload from '../components/FileUpload';
import ApiKeyInput from '../components/ApiKeyInput';
import ValidationProgress from '../components/ValidationProgress';

export default function Home() {
  const { state, dispatch } = useAppContext();
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [processedEmails, setProcessedEmails] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleValidation = async () => {
    if (!apiKey) {
      setErrors(['Please enter your Mailgun API key']);
      return;
    }

    setIsValidating(true);
    setProcessedEmails(0);
    setErrors([]);
    setLogs([]);
    
    addLog('Starting email validation process...');
    addLog(`Total emails to validate: ${state.emails.length}`);

    try {
      const response = await fetch('/api/validateBulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails: state.emails,
          apiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Validation failed');
      }

      const data = await response.json();
      
      if (data.errors?.length) {
        setErrors(data.errors);
        data.errors.forEach((error: string) => addLog(`Error: ${error}`));
      }

      dispatch({ type: 'SET_VALIDATED_EMAILS', payload: data.results });
      
      setProcessedEmails(data.totalProcessed);
      addLog(`Validation completed. Processed ${data.totalProcessed} emails`);
      addLog(`Valid emails: ${data.successful}`);
      addLog(`Invalid emails: ${data.failed}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrors([errorMessage]);
      addLog(`Fatal error: ${errorMessage}`);
    } finally {
      setIsValidating(false);
      addLog('Validation process ended');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Email Validator</h1>
          
          <div className="space-y-6">
            {/* API Key Input */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">API Configuration</h2>
              <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
            </div>

            {/* File Upload Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Email List</h2>
              <FileUpload />
            </div>

            {/* Validation Button - Always visible but conditionally enabled */}
            <div className="flex justify-center">
              <button
                onClick={handleValidation}
                disabled={isValidating || !apiKey || state.emails.length === 0}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-white
                  transition-all duration-200 ease-in-out
                  ${isValidating || !apiKey || state.emails.length === 0
                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
                  }
                `}
              >
                {isValidating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Validating...
                  </span>
                ) : 'Validate Emails'}
              </button>
            </div>

            {/* Progress and Logs */}
            {(isValidating || logs.length > 0) && (
              <ValidationProgress
                totalEmails={state.emails.length}
                processedEmails={processedEmails}
                errors={errors}
                logs={logs}
                isValidating={isValidating}
              />
            )}

            {/* Results Summary */}
            {state.validatedEmails.length > 0 && !isValidating && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Validation Results</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Total Processed</div>
                    <div className="text-2xl font-bold text-gray-900">{state.validatedEmails.length}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Valid Emails</div>
                    <div className="text-2xl font-bold text-green-600">
                      {state.validatedEmails.filter(e => e.is_valid).length}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Invalid Emails</div>
                    <div className="text-2xl font-bold text-red-600">
                      {state.validatedEmails.filter(e => !e.is_valid).length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}